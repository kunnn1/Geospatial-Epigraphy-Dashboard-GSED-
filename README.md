# The Judeo-Christian and ḥanīf Inscriptions of Pre-Islamic Arabia, c. 400–630 CE

With the evincably rapid shifts materializing in the field pre-Islamic Arabian epigraphy, every published monograph and paper capturing such progress has almost become rather overwhelming for avid readers of pre-Islamic Arabia and epigraphy, Early Islam, Arabic historical linguistics, etc. Atleast, that's how I certainly felt. Despite such developments in the field being of infancy, it's remarkable how much published findings have already seemed to dramatically shift the once uncontested paradigm of the social, cultural and religious milieu of pre-Islamic Arabia (e.g. unprecedented ubiquity of literacy among members of pre-Islamic Arabian society). However, what is of particular interest to me among many others, is the discussion surrounding the extent of Judeo-Christian and pre-Islamic monotheistic (ḥanīf) presence in the pre-Islamic Arabian peninsula, which was once held, to be rather scarce and unattested, more so in the regions surrounding the Qurʾānic milieu (e.g. Ḥijāz & Ṭāʾif). However with recent developments in pre-Islamic Arabia epigraphy, the traditional paradigm of an overwhelmingly polytheistic milieu is already being robustly challenged. But just how definitive are these epigraphical surveys and how much do they actually shift academia away from the standard paradigm and towards a principally henotheistic paradigm? I found it difficult to conceptualize this shift, so I came up with an idea. The idea is what you're looking at. 

I created GSED: An Interactive Geo-Spatial Dashboard of Jewish, Christian and ḥanīf inscriptions (and Christian material sites) of pre-Islamic Arabia between the 5th and 7th century CE (c. 400-630). This project was primarily inspired from Ilkka Lindstedt and his stellar work on pre-Islamic Arabian epigraphy. His own mapping of monotheist inscriptions in pre-Islamic Arabia (from his Muḥammad and His Followers in Context: The Religious Map of Late Antique Arabia) was by far the most valuable source for this project. 

---

## Quick Start Guide (lol)

```bash
python3 scripts/build_data.py
```

That's basically it. Pretty easy stuff. Then double-click `index.html`.

The page works from `file://` as well as over HTTP.

Requirements to run: Python 3.9+ and a modern browser. No `pip install` step; the build
script uses the standard library only.

---

## What exactly am I looking at? How do I use this thing?

Well, what you're looking at is a map of the pre-Islamic Arabian peninsula and its surrounding neighbors. For each inscription record, it has a marker indicating the religious affiliation of the inscription (Jewish, Christian or unclassified monotheistic/ḥanīf). When you hover over a marker, a card appears that provides the name and dating of that specific inscription. If you want to know more about a specific inscription, you click on the inscription, and a panel will appear that details the inscription more thoroughly providing a brief synopsis contextualizing and elucidating the background of the inscription, the actual text of the inscription (I try to provide the actual transliteration of the script if available, but if not, I provide the translation of the inscriptional content) and covers the name, dating, script/language of the inscription, the regional site of the record, the actual material of the record (e.g. sandstone, rock, basalt, granite, etc.), dimensions of the inscription (if available, alot of these sources I read didn't specific dimensions), religious and geographic provenance restated if some users have a hard time understanding the map (I also include the coordinates of the inscription on the map to help with this), and the modern country where the record was found. In these panels, I also attempt to cite 2-3 academic sources that discuss the specific inscription for further reading if users would be interested in reading more about them. 

Since it can be confusing to navigate the map, I included a filtering mechanism where users can sort and filter inscriptions by religious affiliation (Jewish, Christian, ḥanīf, and Christian material sites), the script of the inscription (Ancient South Arabian, Greek, Hebrew, Nabatean Aramaic, Nabataeo-Arabic, Paleo-Arabic, and Syriac), the regional site of the inscription (Tabūk & Ḥismā, South Arabia (Ḥimyar), Najrān & Ḥimā, Hegra & al-ʿUlā, Jordan & Syria, Eastern Arabia & the Gulf, Dūmat al-Jandal & al-Jawf, Ḥijāz & Ṭāʾif), and the material of the inscription (Basalt, Granite, Limestone, Rock (Unspecificed), Sandstone, Stone, Stone & Plaster). As with any map, there is a key provided that explains what each marker (marks religious affiliation) on the map signify. I decided to not only include inscriptions but some prominent Christian material sites in pre-Islamic Arabia, that concurrently contributes to the discussion of Judeo-Christian presence in pre-Islamic Arabia, which as aforementioned is what I'm interested in, and thought that others might like to see. That's why I included them. 

Below the map, is the "What This Map Shows" section that is basically a table that captures the distribution of inscriptions of a given religious affiliation by regional site. I decided to represent this specific relationship between religious affiliation and region because I think it yields unique insights into where certain religious affiliations would have been more prominent in distinct regions of pre-Islamic Arabia. For example, the table suggests that in the regions of Tabūk & Ḥismā and Ḥijāz & Ṭāʾif, of the monotheistic epigraphical records available, the inscriptions are of dominantly ḥanīf character. However, when you shift to other regions such as Najrān & Ḥimā and South Arabia (Ḥimyar), a starkly Jude-Christian character seems to dominate the epigraphical records of those regions. Of course, the totality of the pre-Islamic Arabian epigraphical repository is simply too small and pre-mature to draw any sort of paradigmatic inferences or conclusions about the broader religious and cultural horizon of pre-Islamic Arabian society. However, even with such pre-mature data, patterns can be observed and noted, and such inferences can begin to take shape. As this repository grows with decades to come, such patterns in the data will become more polished and elaborated to the degree that paradigmatic inferences can and probably will be made justifiably. These inferences could explore, for example, the development of the catalogue of Qurʾānic religious communities and how epigraphical records can inform the moulding of this catalogue. And of course, if users want to filter the tables to focus on either solely Judeo-Christian attestations, they would use the filtering mechanisms on the top of the map. And finally, the project ends with a bilbiography of the sources used to ground the panels for each inscription give or take. 

Also included a light and dark mode for a better personalized experience: Parchment = Light Mode and Ink = Dark Mode

Special thanks to Terron, and Tracy, and Jack for advising me during the process of building GSED.

## The Data Model

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
| `additionReason` | Why it was added, when it does not |
| `references` | 1–4 objects with `citation` and optional `url` |

Two derived fields are added by the build, not stored in the source:

- **`scriptFacets`** — a *list*, because a trilingual inscription like Zebed
  belongs under Greek, Syriac *and* Paleo-Arabic in the filter.
- **`materialFacet`** — a *single* bucket, because a stone is one kind of stone.

That asymmetry is deliberate and it is why `filters.js` treats every accessor as
returning an array.

### How to Add a Record

Append it to `data/inscriptions.json`, re-run `python3 scripts/build_data.py`,
reload. The validator will tell you what you missed. No other file changes, since
new script names, materials and regions appear in the filters automatically.

## Sources 

The core list is Ilkka Lindstedt, "A Map and List of the Monotheistic
Inscriptions of Arabia, 400–600 CE," *Hadis ve Siyer Araştırmaları* 10, no. 2
(2025): 275–283. Records were checked against the
[Digital Corpus of the Nabataean and Developing Arabic Inscriptions](https://diconab.huma-num.fr/)
(ed. Laïla Nehmé) and the
[Digital Archive for the Study of pre-Islamic Arabian Inscriptions](https://dasi.cnr.it/)
(ed. Alessandra Avanzini). The full bibliography is at the bottom of the page.

Basemap: [Natural Earth](https://www.naturalearthdata.com/), public domain.
