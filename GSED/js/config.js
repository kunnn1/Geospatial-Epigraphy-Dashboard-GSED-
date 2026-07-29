/**
 * config.js - every value the dashboard tunes, in one place.
 *
 * Nothing here draws anything. Keeping the map window, the gazetteer of place
 * labels and the category definitions separate from the rendering code means
 * you can retitle a city or recolour a category without opening map.js.
 */

window.App = window.App || {};

App.config = (function () {
  'use strict';

  /**
   * The geographic window, as [[west, south], [east, north]].
   * Must match MAP_BBOX in scripts/build_data.py, which clips the basemap.
   */
  const BBOX = [[24.5, 5.5], [63.5, 37.5]];

  /**
   * Inscription categories.
   *
   * Colour alone never carries the distinction: each category also has its own
   * glyph shape. That pairing is what lets the palette sit in the 6-8 CVD
   * separation band safely, and it keeps the map readable in greyscale.
   * Palette validated against both page surfaces with the dataviz validator.
   */
  const CATEGORIES = {
    jewish: {
      id: 'jewish',
      label: 'Jewish',
      shape: 'star',
      description: 'Identified as Jewish, usually by names or explicit Jewish content.'
    },
    christian: {
      id: 'christian',
      label: 'Christian',
      shape: 'cross',
      description: 'Identified as Christian, usually by an accompanying cross or Christian formulae.'
    },
    monotheist: {
      id: 'monotheist',
      label: 'Monotheist (unclassified)',
      shape: 'circle',
      description: 'Monotheistic in content, but with nothing that narrows the writer’s affiliation further.'
    },
    'christian-context': {
      id: 'christian-context',
      label: 'Christian site (material culture)',
      shape: 'square',
      description: 'Churches and monasteries rather than datable texts. Dating is debated and often post-600 CE.'
    }
  };

  /** Draw order, which is also the legend order and the filter order. */
  const CATEGORY_ORDER = ['jewish', 'christian', 'monotheist', 'christian-context'];

  /**
   * Places labelled on the map.
   *
   * tier 'ancient'  - settlements that mattered in the 5th-7th centuries.
   * tier 'modern'   - present-day cities, included purely for orientation and
   *                   styled so they read as secondary. Riyadh and Dubai are
   *                   here to help you find yourself, not because they existed.
   *
   * `minZoom` hides a label until the map is zoomed in far enough, which is how
   * the map stays legible at first sight while still rewarding exploration.
   * `anchor` nudges a label off its dot when neighbours would collide.
   */
  const PLACES = [
    // --- Ancient / late antique -------------------------------------------
    { name: 'Makkah', lat: 21.42, lon: 39.83, tier: 'ancient', anchor: 'end' },
    { name: 'Yathrib (Madinah)', lat: 24.47, lon: 39.61, tier: 'ancient', anchor: 'end' },
    { name: 'Ṭāʾif', lat: 21.27, lon: 40.42, tier: 'ancient', anchor: 'start' },
    { name: 'Khaybar', lat: 25.70, lon: 39.29, tier: 'ancient', anchor: 'start', minZoom: 1.6 },
    { name: 'Hegra (Madāʾin Ṣāliḥ)', lat: 26.79, lon: 37.95, tier: 'ancient', anchor: 'end' },
    { name: 'al-ʿUlā', lat: 26.62, lon: 37.92, tier: 'ancient', anchor: 'end', dy: 14, minZoom: 1.6 },
    { name: 'Tabūk', lat: 28.38, lon: 36.57, tier: 'ancient', anchor: 'end' },
    { name: 'Dūmat al-Jandal', lat: 29.81, lon: 39.87, tier: 'ancient', anchor: 'start' },
    { name: 'Taymaʾ', lat: 27.63, lon: 38.55, tier: 'ancient', anchor: 'start', minZoom: 1.6 },
    { name: 'Petra', lat: 30.33, lon: 35.44, tier: 'ancient', anchor: 'end' },
    { name: 'Jerusalem', lat: 31.78, lon: 35.23, tier: 'ancient', anchor: 'end' },
    { name: 'Bostra', lat: 32.52, lon: 36.48, tier: 'ancient', anchor: 'start', minZoom: 1.8 },
    { name: 'Alexandria', lat: 31.20, lon: 29.92, tier: 'ancient', anchor: 'start' },
    { name: 'al-Ḥīra', lat: 31.90, lon: 44.45, tier: 'ancient', anchor: 'start' },
    { name: 'Ctesiphon', lat: 33.09, lon: 44.58, tier: 'ancient', anchor: 'start', minZoom: 1.8 },
    { name: 'Najrān', lat: 17.49, lon: 44.13, tier: 'ancient', anchor: 'start' },
    { name: 'Ḥimā', lat: 18.30, lon: 44.42, tier: 'ancient', anchor: 'end', minZoom: 1.4 },
    { name: 'Ṣanʿāʾ', lat: 15.35, lon: 44.21, tier: 'ancient', anchor: 'end' },
    { name: 'Ẓafār', lat: 14.21, lon: 44.40, tier: 'ancient', anchor: 'start', minZoom: 1.4 },
    { name: 'Mārib', lat: 15.42, lon: 45.33, tier: 'ancient', anchor: 'start' },
    { name: 'Aksum', lat: 14.13, lon: 38.72, tier: 'ancient', anchor: 'end' },
    { name: 'Adulis', lat: 15.26, lon: 39.66, tier: 'ancient', anchor: 'start', minZoom: 1.8 },

    // --- Modern, for orientation only -------------------------------------
    { name: 'Riyadh', lat: 24.71, lon: 46.68, tier: 'modern', anchor: 'start' },
    { name: 'Jeddah', lat: 21.49, lon: 39.19, tier: 'modern', anchor: 'end', dy: 14 },
    { name: 'Abha', lat: 18.22, lon: 42.51, tier: 'modern', anchor: 'end' },
    { name: 'Cairo', lat: 30.04, lon: 31.24, tier: 'modern', anchor: 'end' },
    { name: 'Khartoum', lat: 15.50, lon: 32.56, tier: 'modern', anchor: 'end' },
    { name: 'Asmara', lat: 15.34, lon: 38.93, tier: 'modern', anchor: 'end', dy: 14, minZoom: 1.8 },
    { name: 'Muscat', lat: 23.59, lon: 58.41, tier: 'modern', anchor: 'start' },
    { name: 'Dubai', lat: 25.20, lon: 55.27, tier: 'modern', anchor: 'start' },
    { name: 'Abu Dhabi', lat: 24.45, lon: 54.38, tier: 'modern', anchor: 'end', dy: 14, minZoom: 1.8 },
    { name: 'Doha', lat: 25.29, lon: 51.53, tier: 'modern', anchor: 'end' },
    { name: 'Manama', lat: 26.23, lon: 50.59, tier: 'modern', anchor: 'end', dy: -8, minZoom: 1.6 },
    { name: 'Kuwait City', lat: 29.38, lon: 47.99, tier: 'modern', anchor: 'end', minZoom: 1.4 },
    { name: 'Amman', lat: 31.95, lon: 35.93, tier: 'modern', anchor: 'start' },
    { name: 'Damascus', lat: 33.51, lon: 36.29, tier: 'modern', anchor: 'start', minZoom: 1.4 },
    { name: 'Baghdad', lat: 33.31, lon: 44.37, tier: 'modern', anchor: 'end' },
    { name: 'Tehran', lat: 35.69, lon: 51.39, tier: 'modern', anchor: 'end', minZoom: 1.4 },
    { name: 'Shiraz', lat: 29.59, lon: 52.58, tier: 'modern', anchor: 'start', minZoom: 1.8 }
  ];

  /**
   * Country labels. Positioned by hand rather than at polygon centroids, which
   * for a shape like Saudi Arabia or Egypt lands the text in an awkward place.
   */
  const COUNTRIES = [
    { name: 'SAUDI ARABIA', lat: 23.20, lon: 44.20 },
    { name: 'YEMEN', lat: 15.60, lon: 47.60 },
    { name: 'OMAN', lat: 21.00, lon: 56.60 },
    { name: 'U.A.E.', lat: 23.90, lon: 54.20, small: true },
    { name: 'QATAR', lat: 25.30, lon: 51.20, small: true },
    { name: 'BAHRAIN', lat: 26.05, lon: 50.55, small: true, hideBelow: 1.5 },
    { name: 'KUWAIT', lat: 29.50, lon: 47.30, small: true },
    { name: 'IRAQ', lat: 32.60, lon: 42.60 },
    { name: 'IRAN', lat: 32.00, lon: 54.50 },
    { name: 'JORDAN', lat: 31.30, lon: 36.80, small: true },
    { name: 'ISRAEL', lat: 31.30, lon: 34.85, small: true, hideBelow: 1.5 },
    { name: 'SYRIA', lat: 34.80, lon: 38.50 },
    { name: 'EGYPT', lat: 26.50, lon: 29.50 },
    { name: 'SUDAN', lat: 17.00, lon: 30.00 },
    { name: 'ERITREA', lat: 15.60, lon: 38.00, small: true },
    { name: 'ETHIOPIA', lat: 11.00, lon: 39.50 },
    { name: 'DJIBOUTI', lat: 11.60, lon: 42.60, small: true, hideBelow: 1.5 },
    { name: 'SOMALIA', lat: 9.20, lon: 47.50 }
  ];

  /** Seas, gulfs and one desert. Rendered in spaced italics, atlas-style. */
  const WATER_LABELS = [
    { name: 'Red Sea', lat: 20.20, lon: 38.30, rotate: -46 },
    { name: 'Persian Gulf', lat: 27.30, lon: 51.20, rotate: -34 },
    { name: 'Gulf of Aden', lat: 12.30, lon: 47.80, rotate: 6 },
    { name: 'Arabian Sea', lat: 15.50, lon: 60.00 },
    { name: 'Mediterranean Sea', lat: 33.60, lon: 30.50, rotate: -8 },
    { name: 'Gulf of Oman', lat: 24.60, lon: 58.90, rotate: -30, small: true }
  ];

  const DESERT_LABELS = [
    { name: 'RUBʿ AL-KHĀLĪ', lat: 20.00, lon: 50.50, rotate: -10 },
    { name: 'AL-NAFŪD', lat: 28.30, lon: 41.00, rotate: -6, small: true },
    { name: 'ḤISMĀ', lat: 29.10, lon: 36.40, rotate: -20, small: true }
  ];

  /** Filter dimensions, in the order they appear in the filter bar. */
  const FILTERS = [
    { key: 'religion', label: 'Affiliation', accessor: (r) => [r.religion], display: (v) => (CATEGORIES[v] ? CATEGORIES[v].label : v) },
    { key: 'script', label: 'Script', accessor: (r) => r.scriptFacets },
    { key: 'locality', label: 'Region', accessor: (r) => [r.locality] },
    { key: 'material', label: 'Material', accessor: (r) => [r.materialFacet] }
  ];

  /** Zoom limits for d3.zoom. 1 is "fitted to the container". */
  const ZOOM_EXTENT = [1, 12];

  return {
    BBOX,
    CATEGORIES,
    CATEGORY_ORDER,
    PLACES,
    COUNTRIES,
    WATER_LABELS,
    DESERT_LABELS,
    FILTERS,
    ZOOM_EXTENT
  };
})();
