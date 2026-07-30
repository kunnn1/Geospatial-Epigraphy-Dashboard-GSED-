# The Judeo-Christian and ḥanīf Inscriptions of Pre-Islamic Arabia, c. 400–630 CE

With the evincably rapid shifts materializing in the field pre-Islamic Arabian epigraphy, every published monograph and paper capturing such progress has almost become rather overwhelming for avid readers of pre-Islamic Arabia and epigraphy, Early Islam, Arabic historical linguistics, etc. Atleast, that's how I certainly felt. Despite such developments in the field being of infancy, it's remarkable how much published findings have already seemed to dramatically shift the once uncontested paradigm of the social, cultural and religious milieu of pre-Islamic Arabia such as the unprecedented ubiquity of literacy among members of pre-Islamic Arabian society. However, what is of particular interest to me among many others, is the discussion surrounding the extent of Judeo-Christian and pre-Islamic monotheistic (ḥanīf) presence in the pre-Islamic Arabian peninsula, which was once held, to be rather scarce and unattested, more so in the regions surrounding the Qurʾānic milieu (e.g. Ḥijāz & Ṭāʾif). However with recent developments in pre-Islamic Arabia epigraphy, the traditional paradigm of an overwhelmingly polytheistic milieu is already being robustly challenged. But just how definitive are these epigraphical surveys and how much do they actually shift academia away from the standard paradigm and towards a principally henotheistic paradigm? I found it difficult to conceptualize this shift, so I came up with an idea. The idea is what you're looking at. 

I created GSED: An Interactive Geo-Spatial Dashboard of Jewish, Christian and ḥanīf inscriptions of pre-Islamic Arabia between the fifth and seventh century CE (c. 400-630). This project was primaril

Built with HTML, CSS, JavaScript and Python only. One JavaScript library (D3 v7),
vendored locally. No frameworks, no build tooling, no runtime network requests.

---

## Quick Start Guide 

```bash
python3 scripts/build_data.py
```

That's basically it. Pretty easy stuff. Then double-click `index.html`.

The page works from `file://` as well as over HTTP.

Requirements to run: Python 3.9+ and a modern browser. No `pip install` step; the build
script uses the standard library only.

---

## What exactly am I looking at? How do I use this thing?

Well, what you're looking at is a map of the pre-Islamic Arabian peninsula and pertinent surrounding neighbors. For each inscription record, it has a marker indicating the religious affiliation of the inscription (Jewish, Christian or unclassified monotheistic/ḥanīf). When you hover over a marker, a card appears that provides the name and dating of that specific inscription. If you want to know more about a specific inscription, you click on the inscription, and a panel will appear that details the inscription more thoroughly providing a brief synopsis contextualizing and elucidating the background of the inscription, the actual text of the inscription (I try to provide the actual transliteration of the script if available, but if not, I provide the translation of the inscriptional content) and covers the name, dating, script/language of the inscription, the regional site of the record, the actual material of the record (e.g. sandstone, rock, basalt, granite, etc.), dimensions of the inscription (if available, alot of these sources I read didn't specific dimensions), religious and geographic provenance restated if some users have a hard time understanding the map (I also include the coordinates of the inscription on the map to help with this), and the modern country where the record was found. In these panels, I also attempt to cite 2-3 academic sources that discuss the specific inscription for further reading if users would be interested in reading more about them. With the map since it can be confusing to navigate, I included a filtering mechanism where users can sort and filter inscriptions by religious affiliation (Jewish, Christian, ḥanīf, and Christian material sites), the script of the inscription (Ancient South Arabian, Greek, Hebrew, Nabatean Aramaic, Nabataeo-Arabic, Paleo-Arabic, and Syriac), the regional site of the inscription (Tabūk & Ḥismā, South Arabia (Ḥimyar), Najrān & Ḥimā, Hegra & al-ʿUlā, Jordan & Syria, Eastern Arabia & the Gulf, Dūmat al-Jandal & al-Jawf, Ḥijāz & Ṭāʾif), and the material of the inscription (Basalt, Granite, Limestone, Rock (Unspecificed), Sandstone, Stone, Stone & Plaster). As with any map, there is a key provided that explains with each marker (marks religious affiliation) on the map signify. I decided to not only include inscriptions but some prominent Christian material sites in pre-Islamic Arabia, that concurrently contributes to the discussion of Judeo-Christian presence in pre-Islamic Arabia, which as aforementioned is what I'm interested in, and thought that others might like to see. 

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
