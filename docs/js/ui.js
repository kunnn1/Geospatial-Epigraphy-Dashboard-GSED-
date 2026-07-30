window.App = window.App || {};

App.ui = (function () {
  'use strict';


  function escape(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  
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

  function valueOrEmpty(value, emptyText) {
    if (value === null || value === undefined || value === '') {
      return `<span class="field__value field__value--empty">${escape(emptyText || 'Not recorded')}</span>`;
    }
    return `<span class="field__value">${escape(value)}</span>`;
  }

  function maybeLink(text, url) {
    if (!url) return escape(text);
    return `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(text)}</a>`;
  }

  return { escape, categoryIcon, valueOrEmpty, maybeLink };
})();
