/**
 * tooltip.js - the hover card.
 *
 * Deliberately minimal: name, dating, category. Everything else waits for a
 * click, so that skimming the map stays fast and uncluttered.
 */

window.App = window.App || {};

App.tooltip = (function () {
  'use strict';

  let element, frame;

  function init(options) {
    element = options.element;
    frame = options.frame;
  }

  /**
   * Show the card for `record`, positioned near `targetNode`.
   *
   * The card is placed in the frame's coordinate space and flipped to the
   * other side of the marker when it would otherwise overflow the frame.
   */
  function show(record, targetNode) {
    const category = App.config.CATEGORIES[record.religion];

    element.innerHTML = `
      <div class="map-tooltip__kicker" style="color: var(--cat-${record.religion})">
        ${App.ui.categoryIcon(record.religion)}
        <span>${App.ui.escape(category.label)}</span>
      </div>
      <div class="map-tooltip__title">${App.ui.escape(record.name)}</div>
      <div class="map-tooltip__date">${App.ui.escape(record.dateLabel)}</div>
      <div class="map-tooltip__hint">Click for the full record</div>
    `;

    element.classList.add('is-visible');

    // Measure after the content is in place, so the flip test uses real width.
    const frameRect = frame.getBoundingClientRect();
    const markerRect = targetNode.getBoundingClientRect();
    const cardRect = element.getBoundingClientRect();

    const markerX = markerRect.left - frameRect.left + markerRect.width / 2;
    const markerY = markerRect.top - frameRect.top + markerRect.height / 2;

    let left = markerX + 18;
    if (left + cardRect.width > frameRect.width - 8) {
      left = markerX - cardRect.width - 18;
    }
    left = Math.max(8, left);

    let top = markerY - cardRect.height / 2;
    top = Math.max(8, Math.min(top, frameRect.height - cardRect.height - 8));

    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  }

  function hide() {
    element.classList.remove('is-visible');
  }

  return { init, show, hide };
})();
