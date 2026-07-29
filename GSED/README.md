# The Monotheistic Inscriptions of Pre-Islamic Arabia, c. 400–630 CE

An interactive geospatial dashboard of the Jewish, Christian and unclassified
monotheistic inscriptions of late antique Arabia — modelled on the map and list
published by Ilkka Lindstedt in 2025, and extended with material his article
explicitly leaves out or that has been published since.

Built with HTML, CSS, JavaScript and Python only. One JavaScript library (D3 v7),
vendored locally. No frameworks, no build tooling, no runtime network requests.

---

## Quick start

```bash
python3 scripts/build_data.py
```

That is the whole setup. It validates the dataset, downloads D3 and the Natural
Earth basemap **once**, and writes the generated files into `js/data/`. Then
either double-click `index.html`, or:

```bash
python3 scripts/serve.py
```

The page works from `file://` as well as over HTTP — see
[Why `.data.js` and not `.json`](#why-datajs-and-not-json) below.

Requirements: Python 3.9+ and a modern browser. No `pip install` step; the build
script uses the standard library only.

---

## What you are looking at

A map of Arabia and its neighbours with one marker per record. Hovering a marker
gives its name and dating; clicking opens a panel with the full record —
readings, translation, provenance, script, material, dimensions and further
reading. Four filter dimensions sit above the map; a headline-figure row and a
distribution chart sit below it, and a bibliography closes the page.

Four marker categories, each with **its own shape as well as its own colour**:

| Category | Shape | Meaning |
|---|---|---|
| Jewish | six-pointed star | Identified as Jewish, usually by personal names |
| Christian | cross | Identified as Christian, usually by an accompanying cross |
| Monotheist (unclassified) | circle | Monotheistic content, affiliation undetermined |
| Christian site | hollow square | Churches and monasteries — material culture, not text |

The shape is not decorative. It is what keeps the categories distinguishable for
colour-blind readers and in greyscale, which in turn is what lets the palette use
these particular hues (see [Colour](#colour)).

---

## Project layout

```
GSED/
├── index.html                  Page structure, essay, bibliography
├── css/
│   ├── main.css                Design tokens, layout, typography, panel, filters
│   └── map.css                 Cartography: land, sea, labels, markers, tooltip
├── js/
│   ├── config.js               Map window, gazetteer, categories, filter definitions
│   ├── map.js                  Projection, base layers, labels, markers, zoom
│   ├── ui.js                   Shared helpers (escaping, category icons)
│   ├── tooltip.js              Hover card
│   ├── panel.js                Click-to-open detail panel
│   ├── filters.js              Filter state, predicate, counts
│   ├── chart.js                Distribution chart
│   ├── main.js                 Boot sequence and wiring
│   ├── vendor/d3.v7.min.js     GENERATED — vendored by the build
│   └── data/*.data.js          GENERATED — do not edit
├── data/
│   └── inscriptions.json       THE SOURCE OF TRUTH — edit this
├── scripts/
│   ├── build_data.py           Validate → fetch → clip → emit
│   └── serve.py                Optional local HTTP server
└── README.md
```

The rule that keeps this navigable: **generated files are never edited, and
source files are never generated.** `data/inscriptions.json` is written by hand;
everything under `js/data/` and `js/vendor/` is produced by the build.

---

## How the pieces fit

The modules do not know about each other. Each exposes a small API and reports
events upward; `main.js` is the only file that knows the whole picture.

```
                        ┌───────────┐
                        │  main.js  │  the only module that wires things together
                        └─────┬─────┘
        ┌────────────┬────────┼─────────┬────────────┐
        ▼            ▼        ▼         ▼            ▼
   filters.js     map.js   panel.js  tooltip.js   chart.js
        │            │        │         │            │
        └────────────┴────────┴─────────┴────────────┘
                             │
                    config.js + ui.js  (shared, no state)
```

Concretely: when you tick a filter, `filters.js` recomputes which records match
and calls its `onChange` callback. `main.js` receives that list and passes it to
`map.js` (which dims the excluded markers) and to `chart.js` (which re-renders).
`filters.js` has never heard of the map.

Swapping the chart for a different one means editing `chart.js` and one line in
`main.js`. Nothing else moves.

---

## Rebuilding this from scratch

If you want to reconstruct the project rather than read it, this is the order
that keeps you working at each step.

**1. Get a map on screen.** Write `config.js` with just a bounding box, then
`map.js` with a projection, a `<path>` per country, and a `d3.zoom` behaviour.
Natural Earth's 50m countries file is the only geographic input you need — the
same polygons give you coastlines and borders. Getting pan and zoom right early
matters, because everything else has to survive it.

**2. Decide how labels behave.** The non-obvious choice here: labels are *not*
inside the zoomed group. They live in their own layer and are repositioned in
screen space on every zoom event (`positionLabels()` in `map.js`). If you scale
them with the map, text becomes unreadable at both extremes. The `minZoom` field
in the gazetteer then lets you hide minor places until the reader has zoomed in.

**3. Write the dataset before the UI that displays it.** Decide the record schema
first (see below) and fill in three or four real records. Building the panel
against real data — including records with missing dimensions and no
transliteration — surfaces the "what do we show when there is nothing" question
immediately, instead of after you have built everything.

**4. Add the build script.** Validation is the point. `validate_records()` in
`build_data.py` aborts the build and names the offending record. A typo in a
latitude otherwise shows up as a marker in the Red Sea, which is far harder to
trace back than a build failure that says `fas-7: coordinates outside the map
window`.

**5. Markers, then tooltip, then panel.** In that order, because each one needs
the last. The one piece of real geometry is `computeOffsets()` — several sites
carry more than one record, and without fanning them out onto a small circle the
overlapping markers are impossible to hover individually.

**6. Filters last.** They are the most interconnected part, so they are easiest
to write once everything they touch already exists.

---

## The data model

`data/inscriptions.json` holds `{ "records": [ … ] }`. Each record:

| Field | Notes |
|---|---|
| `id` | Unique slug; used as the D3 data key |
| `name`, `siglum` | Display name and the scholarly siglum |
| `religion` | `jewish` \| `christian` \| `monotheist` \| `christian-context` |
| `dateLabel`, `dateNote` | Human-readable dating, plus how it was arrived at |
| `language`, `script` | As published |
| `locality` | The filter bucket (region) |
| `site`, `modernCountry` | Findspot |
| `lat`, `lon`, `geoPrecision` | `exact` \| `approximate` \| `indicative` |
| `material`, `support`, `dimensions` | `null` where never published |
| `transliteration`, `translation` | `null` where none exists |
| `provenance`, `synopsis` | Religious/geographic provenance; prose summary |
| `textCount` | >1 where one marker stands for several texts |
| `inLindstedt` | Whether it appears in Lindstedt's list |
| `additionReason` | Why it was added, when it does not |
| `references` | 1–4 objects with `citation` and optional `url` |

Two derived fields are added by the build, not stored in the source:

- **`scriptFacets`** — a *list*, because a trilingual inscription like Zebed
  belongs under Greek, Syriac *and* Paleo-Arabic in the filter.
- **`materialFacet`** — a *single* bucket, because a stone is one kind of stone.

That asymmetry is deliberate and it is why `filters.js` treats every accessor as
returning an array.

### Adding a record

Append it to `data/inscriptions.json`, re-run `python3 scripts/build_data.py`,
reload. The validator will tell you what you missed. No other file changes —
new script names, materials and regions appear in the filters automatically.

---

## Design decisions worth knowing

### Why `.data.js` and not `.json`

Browsers block `fetch()` against `file://` URLs. Emitting plain scripts that
assign to a global (`window.INSCRIPTION_DATA = …`) means the dashboard opens by
double-clicking `index.html`, with no server and no CORS configuration. The cost
is a build step, which we needed anyway for validation.

### The projection

`d3.geoConicEqualArea`, centred on the peninsula. Equal-area matters on a
distribution map: a cluster's visual weight should be proportional to the ground
it covers, which a Mercator-style projection would distort badly across this
latitude range.

### Colour

The four category colours were validated with the `dataviz` skill's palette
validator against **both** page surfaces — parchment `#f2e8d5` and ink `#141a22`
— on the all-pairs test, since markers can appear beside any other marker.

- Light: `#1c5cab` · `#c25a1e` · `#a63a86` · `#0f7a55`
- Dark: `#4b8fe0` · `#d4762f` · `#cc6aa9` · `#2fa176`

Both sets clear the lightness band, chroma floor, normal-vision separation
(≥15 ΔE) and 3:1 contrast. Their worst colour-vision-deficiency pair sits in the
6–8 ΔE band, which is permitted **only** with a secondary encoding — which is
exactly what the four distinct marker shapes provide. If you re-colour the
categories, re-run the validator and keep the shapes.

### Theming

Every colour is a CSS custom property declared twice in `css/main.css`, once per
theme. Nothing below the token block hard-codes a colour. The dark values are
declared under both `@media (prefers-color-scheme: dark)` and
`:root[data-theme="dark"]`, so the OS preference applies by default and the
toggle overrides it in both directions.

### Filtered markers fade rather than disappear

`.marker.is-muted` drops to 10% opacity instead of `display: none`. You can see
what your filter removed and where it was, which on a distribution map is
information rather than clutter.

---

## Scholarly conventions

- **Positions are indicative**, as on Lindstedt's own map. Many findspots are
  published only as "between Tabūk and al-Ḥijr". Every record carries a
  `geoPrecision` flag and the panel states it.
- **One symbol may stand for several texts.** A badge shows the count (×12 for
  the Greek graffiti at Mabrak al-Nāqa, ×23 for the Ḥimā corpus).
- **Empty fields are shown as "Not recorded"**, never invented. Most of these
  graffiti have never had their dimensions published.
- **Modern borders are drawn as dashed hairlines** and labelled as modern. They
  are an anachronism on a map of late antiquity, included for orientation only.
- **Disagreement is reported.** Where editors differ on a reading, the record's
  synopsis or notes say so.

---

## Sources

The core list is Ilkka Lindstedt, "A Map and List of the Monotheistic
Inscriptions of Arabia, 400–600 CE," *Hadis ve Siyer Araştırmaları* 10, no. 2
(2025): 275–283. Records were checked against the
[Digital Corpus of the Nabataean and Developing Arabic Inscriptions](https://diconab.huma-num.fr/)
(ed. Laïla Nehmé) and the
[Digital Archive for the Study of pre-Islamic Arabian Inscriptions](https://dasi.cnr.it/)
(ed. Alessandra Avanzini). The full bibliography is at the bottom of the page.

Basemap: [Natural Earth](https://www.naturalearthdata.com/), public domain.
