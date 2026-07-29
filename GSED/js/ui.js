/**
 * ui.js - small shared helpers used by more than one view module.
 *
 * Kept separate so that tooltip.js, panel.js, filters.js and chart.js do not
 * each carry their own copy of an escape function or an icon.
 */

window.App = window.App || {};

App.ui = (function () {
  'use strict';

  /**
   * Escape text before putting it into innerHTML.
   *
   * The dataset is authored locally rather than user-supplied, so this is not
   * guarding against an attacker. It is here because the records genuinely
   * contain characters like < and & inside transliterations and readings
   * (l-bn<y>, for instance), which would otherwise break the markup.
   */
  function escape(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * An inline SVG of a category's glyph, for use outside the map: legend,
   * tooltip, filter menu, panel header.
   *
   * Reusing map.js's glyphPath keeps the legend honest - if the marker shape
   * ever changes, the legend changes with it automatically.
   */
  function categoryIcon(religion, size) {
    const category = App.config.CATEGORIES[religion];
    if (!category) return '';
    const s = size || 13;
    const r = s * 0.38;
    const path = App.map.glyphPath(category.shape, r);
    const hollow = religion === 'christian-context';
    const paint = hollow
      ? `fill="none" stroke="currentColor" stroke-width="1.8"`
      : `fill="currentColor"`;
    return `<svg viewBox="${-s / 2} ${-s / 2} ${s} ${s}" width="${s}" height="${s}"
              aria-hidden="true" focusable="false"><path d="${path}" ${paint}/></svg>`;
  }

  /** Render a value, or an italic "Not recorded" when there is nothing to show. */
  function valueOrEmpty(value, emptyText) {
    if (value === null || value === undefined || value === '') {
      return `<span class="field__value field__value--empty">${escape(emptyText || 'Not recorded')}</span>`;
    }
    return `<span class="field__value">${escape(value)}</span>`;
  }

  /** Wrap a URL in an anchor, or return the bare text when there is no URL. */
  function maybeLink(text, url) {
    if (!url) return escape(text);
    return `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(text)}</a>`;
  }

  return { escape, categoryIcon, valueOrEmpty, maybeLink };
})();
