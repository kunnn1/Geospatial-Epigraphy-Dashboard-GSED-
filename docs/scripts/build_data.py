from __future__ import annotations

import argparse
import json
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
SOURCE_DATA = PROJECT_ROOT / "data" / "inscriptions.json"
JS_DATA_DIR = PROJECT_ROOT / "js" / "data"
VENDOR_DIR = PROJECT_ROOT / "js" / "vendor"

D3_URL = "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"
D3_LOCAL = VENDOR_DIR / "d3.v7.min.js"

NATURAL_EARTH_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "v5.1.2/geojson/ne_50m_admin_0_countries.geojson"
)
BASEMAP_CACHE = PROJECT_ROOT / "data" / ".cache_ne_50m_countries.geojson"


MAP_BBOX = (24.5, 5.5, 63.5, 37.5)

COUNTRIES_IN_VIEW = {
    "Saudi Arabia", "Yemen", "Oman", "United Arab Emirates", "Qatar",
    "Bahrain", "Kuwait", "Iraq", "Iran", "Jordan", "Israel", "Palestine",
    "Lebanon", "Syria", "Egypt", "Sudan", "South Sudan", "Eritrea",
    "Ethiopia", "Djibouti", "Somalia", "Somaliland", "Turkey", "Cyprus",
    "Northern Cyprus", "Afghanistan", "Pakistan", "Turkmenistan", "Armenia",
    "Azerbaijan", "Georgia", "Libya", "Chad", "Kenya", "Uganda",
}

COORD_PRECISION = 3


REQUIRED_FIELDS = (
    "id", "name", "siglum", "religion", "dateLabel", "language", "script",
    "locality", "site", "modernCountry", "lat", "lon", "geoPrecision",
    "material", "synopsis", "provenance", "textCount", "inLindstedt",
    "references",
)

VALID_RELIGIONS = {"jewish", "christian", "monotheist", "christian-context"}
VALID_PRECISION = {"exact", "approximate", "indicative"}


class ValidationError(Exception):
    """Raised when the source dataset does not satisfy the schema."""


def validate_records(records: list[dict]) -> None:
   
    seen_ids: set[str] = set()
    min_lon, min_lat, max_lon, max_lat = MAP_BBOX

    for index, record in enumerate(records):
        label = record.get("id") or record.get("name") or f"index {index}"

        missing = [f for f in REQUIRED_FIELDS if record.get(f) in (None, "")]
        if missing:
            raise ValidationError(f"{label}: missing required field(s): {', '.join(missing)}")

        if record["id"] in seen_ids:
            raise ValidationError(f"{label}: duplicate id")
        seen_ids.add(record["id"])

        if record["religion"] not in VALID_RELIGIONS:
            raise ValidationError(
                f"{label}: religion {record['religion']!r} is not one of {sorted(VALID_RELIGIONS)}"
            )

        if record["geoPrecision"] not in VALID_PRECISION:
            raise ValidationError(
                f"{label}: geoPrecision {record['geoPrecision']!r} is not one of "
                f"{sorted(VALID_PRECISION)}"
            )

        lat, lon = record["lat"], record["lon"]
        if not (min_lat <= lat <= max_lat and min_lon <= lon <= max_lon):
            raise ValidationError(
                f"{label}: coordinates ({lat}, {lon}) fall outside the map window {MAP_BBOX}"
            )

        references = record["references"]
        if not isinstance(references, list) or not 1 <= len(references) <= 4:
            raise ValidationError(f"{label}: expected 1-4 references, found {len(references)}")
        for reference in references:
            if not reference.get("citation"):
                raise ValidationError(f"{label}: a reference is missing its citation")



SCRIPT_FAMILIES = (
    ("Paleo-Arabic", "Paleo-Arabic"),
    ("Nabataeo-Arabic", "Nabataeo-Arabic"),
    ("Nabataean Aramaic", "Nabataean Aramaic"),
    ("Ancient South Arabian", "Ancient South Arabian"),
    ("Syriac", "Syriac"),
    ("Greek", "Greek"),
    ("Hebrew", "Hebrew"),
)

MATERIAL_BUCKETS = (
    ("sandstone", "Sandstone"),
    ("basalt", "Basalt"),
    ("granite", "Granite"),
    ("limestone", "Limestone"),
    ("plaster", "Stone & plaster"),
    ("stone", "Stone"),
    ("rock", "Rock (unspecified)"),
)


def derive_facets(record: dict) -> dict:
  
    script_text = record["script"]
    facets = [label for needle, label in SCRIPT_FAMILIES if needle in script_text]
    if not facets:
        
        facets = ["Not applicable"]
    record["scriptFacets"] = facets

    material_text = record["material"].lower()
    record["materialFacet"] = next(
        (label for needle, label in MATERIAL_BUCKETS if needle in material_text),
        "Other",
    )
    return record


    context = ssl.create_default_context()
    if context.cert_store_stats().get("x509_ca", 0) == 0:
        try:
            import certifi
        except ImportError:
            return context
        context.load_verify_locations(cafile=certifi.where())
    return context


def download(url: str, destination: Path, description: str) -> None:
    """Fetch ``url`` to ``destination`` unless it is already cached."""
    if destination.exists():
        print(f"  cached   {description} ({destination.stat().st_size // 1024} KB)")
        return

    print(f"  fetching {description} ...")
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": "arabia-epigraphy-build/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=120, context=make_ssl_context()) as response:
            destination.write_bytes(response.read())
    except (urllib.error.URLError, TimeoutError) as error:
        raise SystemExit(
            f"\nCould not download {description} from {url}\n  {error}\n"
            "An internet connection is needed for the first build only; "
            "afterwards everything runs offline.\n"
            "On macOS, a certificate error here is usually fixed by running\n"
            '  "/Applications/Python 3.13/Install Certificates.command"'
        ) from error
    print(f"  saved    {description} ({destination.stat().st_size // 1024} KB)")


def ring_intersects_bbox(ring: list) -> bool:

    min_lon, min_lat, max_lon, max_lat = MAP_BBOX
    return any(
        min_lon <= point[0] <= max_lon and min_lat <= point[1] <= max_lat
        for point in ring
        if isinstance(point, (list, tuple)) and len(point) >= 2
    )


def simplify_ring(ring: list) -> list:

    simplified: list[list[float]] = []
    for point in ring:
        rounded = [round(point[0], COORD_PRECISION), round(point[1], COORD_PRECISION)]
        if not simplified or rounded != simplified[-1]:
            simplified.append(rounded)
    return simplified if len(simplified) >= 4 else []


def clip_feature(feature: dict) -> dict | None:

    geometry = feature.get("geometry") or {}
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates") or []

    polygons = [coordinates] if geometry_type == "Polygon" else coordinates

    kept: list = []
    for polygon in polygons:
        if not polygon or not ring_intersects_bbox(polygon[0]):
            continue
        rings = [simplify_ring(ring) for ring in polygon]
        rings = [ring for ring in rings if ring]
        if rings:
            kept.append(rings)

    if not kept:
        return None

    return {
        "type": "Feature",
        "properties": {"name": feature["properties"].get("ADMIN", "")},
        "geometry": {"type": "MultiPolygon", "coordinates": kept},
    }


def build_basemap() -> dict:
    """Produce a trimmed GeoJSON FeatureCollection for the map window."""
    raw = json.loads(BASEMAP_CACHE.read_text(encoding="utf-8"))
    features = []
    for feature in raw["features"]:
        if feature["properties"].get("ADMIN") not in COUNTRIES_IN_VIEW:
            continue
        clipped = clip_feature(feature)
        if clipped:
            features.append(clipped)

    features.sort(key=lambda f: f["properties"]["name"])
    return {"type": "FeatureCollection", "features": features}


def write_data_module(path: Path, global_name: str, payload: object, note: str) -> None:

    path.parent.mkdir(parents=True, exist_ok=True)
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    path.write_text(
        f"// GENERATED FILE - do not edit by hand.\n"
        f"// {note}\n"
        f"// Rebuild with: python3 scripts/build_data.py\n"
        f"window.{global_name} = {body};\n",
        encoding="utf-8",
    )
    print(f"  wrote    {path.relative_to(PROJECT_ROOT)} ({path.stat().st_size // 1024} KB)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="re-download the basemap and D3 even if they are already cached",
    )
    args = parser.parse_args()

    if args.refresh:
        for cached in (BASEMAP_CACHE, D3_LOCAL):
            cached.unlink(missing_ok=True)

    print("Building the Arabian epigraphy dashboard\n")

    print("Source data")
    if not SOURCE_DATA.exists():
        raise SystemExit(f"Missing {SOURCE_DATA}. Nothing to build.")
    dataset = json.loads(SOURCE_DATA.read_text(encoding="utf-8"))
    records = dataset["records"]

    try:
        validate_records(records)
    except ValidationError as error:
        raise SystemExit(f"\nDataset validation failed:\n  {error}\n") from error
    print(f"  valid    {len(records)} records")

    records = [derive_facets(record) for record in records]

    print("\nExternal assets (first run only)")
    download(D3_URL, D3_LOCAL, "D3 v7")
    download(NATURAL_EARTH_URL, BASEMAP_CACHE, "Natural Earth 50m countries")

    print("\nBasemap")
    basemap = build_basemap()
    print(f"  clipped  {len(basemap['features'])} countries to {MAP_BBOX}")

    print("\nGenerated modules")
    write_data_module(
        JS_DATA_DIR / "inscriptions.data.js",
        "INSCRIPTION_DATA",
        {"records": records},
        "Source: data/inscriptions.json",
    )
    write_data_module(
        JS_DATA_DIR / "basemap.data.js",
        "BASEMAP_DATA",
        basemap,
        "Source: Natural Earth 50m admin-0 countries (public domain), clipped.",
    )

    print("\nDone. Open index.html in a browser, or run: python3 scripts/serve.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
