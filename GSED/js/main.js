/**
 * main.js - boot sequence and wiring.
 *
 * The other modules are deliberately unaware of each other. This file is the
 * only place that knows the map should dim its markers when the filter changes,
 * or that clicking a marker opens the panel. Keeping that knowledge in one
 * place is what makes the modules replaceable.
 */

(function () {
  'use strict';

  const App = window.App;

  // ------------------------------------------------------------------
  // Theme
  // ------------------------------------------------------------------

  const THEME_KEY = 'arabia-epigraphy-theme';

  const SUN_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3.2" fill="currentColor"/><g stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M12.9 3.1l-1.4 1.4M4.5 11.5l-1.4 1.4"/></g></svg>';
  const MOON_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 10.2A6 6 0 0 1 5.8 2.5a6 6 0 1 0 7.7 7.7z" fill="currentColor"/></svg>';

  function currentTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const button = document.querySelector('[data-theme-toggle]');
    const goingTo = theme === 'dark' ? 'Parchment' : 'Ink';
    button.innerHTML = `${theme === 'dark' ? SUN_SVG : MOON_SVG}<span>Switch to ${goingTo}</span>`;
    button.setAttribute('aria-label', `Switch to ${goingTo} theme`);
  }

  function initTheme() {
    applyTheme(currentTheme());
    document.querySelector('[data-theme-toggle]').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  // ------------------------------------------------------------------
  // Legend
  // ------------------------------------------------------------------

  function buildLegend(records) {
    const list = document.querySelector('[data-legend-items]');
    const counts = {};
    records.forEach((record) => {
      counts[record.religion] = (counts[record.religion] || 0) + 1;
    });

    list.innerHTML = App.config.CATEGORY_ORDER.map((id) => {
      const category = App.config.CATEGORIES[id];
      return `
        <div class="map-legend__item">
          <span style="color: var(--cat-${id})">${App.ui.categoryIcon(id)}</span>
          <span>${App.ui.escape(category.label)}</span>
          <span style="color: var(--ink-3); font-variant-numeric: tabular-nums;">${counts[id] || 0}</span>
        </div>`;
    }).join('');
  }

  // ------------------------------------------------------------------
  // Headline statistics
  // ------------------------------------------------------------------

  function buildStats(records) {
    const node = document.querySelector('[data-stats]');
    const textCount = records.reduce((sum, r) => sum + (r.textCount || 1), 0);
    const dated = records.filter((r) => /^\d/.test(r.dateLabel)).length;
    const regions = new Set(records.map((r) => r.locality)).size;

    const stats = [
      [records.length, 'Records mapped'],
      [textCount, 'Individual texts'],
      [dated, 'Explicitly dated'],
      [regions, 'Regions']
    ];

    node.innerHTML = stats.map(([value, label]) => `
      <div class="stat">
        <div class="stat__value">${value}</div>
        <div class="stat__label">${label}</div>
      </div>`).join('');
  }

  // ------------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------------

  function start() {
    if (typeof d3 === 'undefined' || !window.INSCRIPTION_DATA || !window.BASEMAP_DATA) {
      document.querySelector('[data-map-frame]').innerHTML =
        '<div class="map-empty" style="position:static;height:100%">' +
        '<div class="map-empty__title">Data not built</div>' +
        '<p class="map-empty__text">Run <code>python3 scripts/build_data.py</code> ' +
        'once to generate the map data and vendor D3, then reload this page.</p></div>';
      return;
    }

    const records = window.INSCRIPTION_DATA.records;

    initTheme();

    const frame = document.querySelector('[data-map-frame]');
    const atlas = document.querySelector('[data-atlas]');
    const panelElement = document.querySelector('[data-panel]');
    const emptyState = document.querySelector('[data-map-empty]');

    App.tooltip.init({
      element: document.querySelector('[data-tooltip]'),
      frame: frame
    });

    App.panel.init({
      element: panelElement,
      container: atlas,
      onClose: () => App.map.setSelected(null)
    });

    App.map.init({
      svg: document.querySelector('[data-map-svg]'),
      records: records,
      callbacks: {
        onHover: (record, node) => App.tooltip.show(record, node),
        onHoverEnd: () => App.tooltip.hide(),
        onSelect: (record) => {
          if (!record) {
            App.map.setSelected(null);
            App.panel.close();
            return;
          }
          App.map.setSelected(record.id);
          App.panel.open(record);
        }
      }
    });

    buildLegend(records);
    buildStats(records);

    App.chart.init({
      container: document.querySelector('[data-chart]'),
      records: records
    });
    App.chart.render(records);

    App.filters.init({
      records: records,
      container: document.querySelector('[data-filters]'),
      statusNode: document.querySelector('[data-filter-status]'),
      resetNode: document.querySelector('[data-filter-reset]'),
      onChange: (visible) => {
        App.map.applyFilter(new Set(visible.map((r) => r.id)));
        App.chart.render(visible);
        emptyState.hidden = visible.length > 0;
      }
    });

    // Zoom controls
    document.querySelector('[data-zoom-in]').addEventListener('click', () => App.map.zoomBy(1.5));
    document.querySelector('[data-zoom-out]').addEventListener('click', () => App.map.zoomBy(1 / 1.5));
    document.querySelector('[data-zoom-reset]').addEventListener('click', () => App.map.resetZoom());
    document.querySelector('[data-filter-clear-empty]').addEventListener('click', () => App.filters.reset());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
