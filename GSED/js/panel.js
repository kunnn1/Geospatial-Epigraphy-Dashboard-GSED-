/**
 * panel.js - the expanded record view.
 *
 * Opens when a marker is clicked and shows everything the dataset holds for
 * that inscription: dating, readings, provenance, script, physical details and
 * further reading. Fields with no published value say so rather than being
 * hidden, because "no dimensions were ever published" is itself information
 * about how this material was recorded.
 */

window.App = window.App || {};

App.panel = (function () {
  'use strict';

  let element, titleNode, bodyNode, kickerNode, siglumNode, container;
  let onClose = null;

  function init(options) {
    element = options.element;
    container = options.container;
    onClose = options.onClose;

    titleNode = element.querySelector('[data-panel-title]');
    siglumNode = element.querySelector('[data-panel-siglum]');
    kickerNode = element.querySelector('[data-panel-kicker]');
    bodyNode = element.querySelector('[data-panel-body]');

    element.querySelector('[data-panel-close]').addEventListener('click', close);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !element.hidden) close();
    });
  }

  /** Build the physical / classificatory field list. */
  function renderFields(record) {
    const precisionText = {
      exact: 'Exact coordinates published',
      approximate: 'Approximate, placed at the named site',
      indicative: 'Indicative; the findspot is not precisely published'
    }[record.geoPrecision];

    const fields = [
      ['Dating', record.dateLabel],
      ['Language', record.language],
      ['Script', record.script],
      ['Religious & geographic provenance', record.provenance],
      ['Site', record.site],
      ['Modern country', record.modernCountry],
      ['Material', record.material],
      ['Support', record.support],
      ['Dimensions', record.dimensions],
      ['Position on map', `${record.lat.toFixed(3)}°N, ${record.lon.toFixed(3)}°E (${precisionText})`]
    ];

    return `<div class="fields">${fields.map(([label, value]) => `
      <div class="field">
        <div class="field__label">${App.ui.escape(label)}</div>
        ${App.ui.valueOrEmpty(value)}
      </div>`).join('')}</div>`;
  }

  function renderReadings(record) {
    if (!record.transliteration && !record.translation) return '';

    const parts = [];
    if (record.transliteration) {
      parts.push(`<blockquote class="quote quote--translit">${App.ui.escape(record.transliteration)}</blockquote>`);
    }
    if (record.translation) {
      parts.push(`<blockquote class="quote quote--translation">${App.ui.escape(record.translation)}</blockquote>`);
    }

    return `
      <section class="panel__section">
        <h3>Text</h3>
        ${parts.join('')}
      </section>`;
  }

  function renderNotes(record) {
    const notes = [];
    if (record.dateNote) notes.push(`<strong>On the dating.</strong> ${App.ui.escape(record.dateNote)}`);
    if (record.additionReason) {
      notes.push(`<strong>Why it is here.</strong> ${App.ui.escape(record.additionReason)}`);
    }
    if (!notes.length) return '';

    return `
      <section class="panel__section">
        <h3>Notes</h3>
        ${notes.map((note) => `<div class="note">${note}</div>`).join('')}
      </section>`;
  }

  function renderReferences(record) {
    const items = record.references.map((reference) => {
      const citation = App.ui.escape(reference.citation);
      const link = reference.url
        ? ` <a href="${App.ui.escape(reference.url)}" target="_blank" rel="noopener noreferrer">Link&nbsp;&rarr;</a>`
        : '';
      return `<li>${citation}${link}</li>`;
    }).join('');

    return `
      <section class="panel__section">
        <h3>Further reading</h3>
        <ul class="refs">${items}</ul>
      </section>`;
  }

  function open(record) {
    const category = App.config.CATEGORIES[record.religion];

    kickerNode.style.color = `var(--cat-${record.religion})`;
    kickerNode.innerHTML = `${App.ui.categoryIcon(record.religion)}<span>${App.ui.escape(category.label)}</span>`;

    titleNode.textContent = record.name;
    siglumNode.textContent = record.siglum;

    bodyNode.innerHTML = `
      <section class="panel__section">
        <h3>Synopsis</h3>
        <p>${App.ui.escape(record.synopsis)}</p>
      </section>
      ${renderReadings(record)}
      <section class="panel__section">
        <h3>Record</h3>
        ${renderFields(record)}
      </section>
      ${renderNotes(record)}
      ${renderReferences(record)}
    `;

    bodyNode.scrollTop = 0;
    element.hidden = false;
    container.classList.remove('atlas--closed');
  }

  function close() {
    element.hidden = true;
    container.classList.add('atlas--closed');
    if (onClose) onClose();
  }

  return { init, open, close };
})();
