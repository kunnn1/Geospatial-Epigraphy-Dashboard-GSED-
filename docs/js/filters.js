window.App = window.App || {};

App.filters = (function () {
  'use strict';

  let records = [];
  let container;
  let statusNode;
  let resetNode;
  let onChange = null;

  const state = new Map();

  function matches(record) {
    return App.config.FILTERS.every((dimension) => {
      const selected = state.get(dimension.key);
      if (!selected || selected.size === 0) return true;
  
      return dimension.accessor(record).some((value) => selected.has(value));
    });
  }

  function visibleRecords() {
    return records.filter(matches);
  }

  function tallyFor(dimension, value) {
    return records.filter((record) => {
      if (!dimension.accessor(record).includes(value)) return false;
      return App.config.FILTERS.every((other) => {
        if (other.key === dimension.key) return true;
        const selected = state.get(other.key);
        if (!selected || selected.size === 0) return true;
        return other.accessor(record).some((v) => selected.has(v));
      });
    }).length;
  }

  function optionsFor(dimension) {
    const values = new Set();
    records.forEach((record) => dimension.accessor(record).forEach((v) => values.add(v)));

    const list = [...values];
    if (dimension.key === 'religion') {
      return App.config.CATEGORY_ORDER.filter((id) => values.has(id));
    }
    return list.sort((a, b) => a.localeCompare(b));
  }


  const CHECK_SVG = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 6.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CHEVRON_SVG = '<svg class="chev" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2 4.5l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function buildDimension(dimension) {
    const wrapper = document.createElement('div');
    wrapper.className = 'filter';

    const menuId = `filter-menu-${dimension.key}`;
    const button = document.createElement('button');
    button.className = 'filter__button';
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', menuId);

    const menu = document.createElement('div');
    menu.className = 'filter__menu';
    menu.id = menuId;
    menu.hidden = true;

    wrapper.append(button, menu);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = button.getAttribute('aria-expanded') === 'true';
      closeAllMenus();
      if (!isOpen) {
        button.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
        renderMenu(dimension, menu);
      }
    });

    menu.addEventListener('click', (event) => event.stopPropagation());

    wrapper._dimension = dimension;
    wrapper._button = button;
    wrapper._menu = menu;
    return wrapper;
  }

  function renderMenu(dimension, menu) {
    const selected = state.get(dimension.key);
    menu.innerHTML = '';

    optionsFor(dimension).forEach((value) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'filter__option';
      const isOn = selected.has(value);
      option.setAttribute('aria-pressed', isOn ? 'true' : 'false');

      const label = dimension.display ? dimension.display(value) : value;
      const swatch = dimension.key === 'religion'
        ? `<span class="filter__swatch" style="color: var(--cat-${value})">${App.ui.categoryIcon(value, 12)}</span>`
        : '';

      option.innerHTML = `
        <span class="filter__check">${CHECK_SVG}</span>
        ${swatch}
        <span class="filter__label">${App.ui.escape(label)}</span>
        <span class="filter__tally">${tallyFor(dimension, value)}</span>
      `;

      option.addEventListener('click', () => {
        if (selected.has(value)) selected.delete(value);
        else selected.add(value);
        renderMenu(dimension, menu);   
        emit();
      });

      menu.appendChild(option);
    });
  }

  function closeAllMenus() {
    container.querySelectorAll('.filter').forEach((wrapper) => {
      wrapper._button.setAttribute('aria-expanded', 'false');
      wrapper._menu.hidden = true;
    });
  }

  function paintChrome() {
    container.querySelectorAll('.filter').forEach((wrapper) => {
      const dimension = wrapper._dimension;
      const selected = state.get(dimension.key);
      const badge = selected.size
        ? `<span class="filter__count">${selected.size}</span>`
        : '';
      wrapper._button.innerHTML =
        `<span>${App.ui.escape(dimension.label)}</span>${badge}${CHEVRON_SVG}`;
    });

    const shown = visibleRecords().length;
    statusNode.innerHTML = `Showing <strong>${shown}</strong> of <strong>${records.length}</strong> records`;

    const anySelected = [...state.values()].some((set) => set.size > 0);
    resetNode.hidden = !anySelected;
  }

  function emit() {
    paintChrome();
    if (onChange) onChange(visibleRecords());
  }

  function reset() {
    state.forEach((set) => set.clear());
    closeAllMenus();
    emit();
  }

  function init(options) {
    records = options.records;
    container = options.container;
    statusNode = options.statusNode;
    resetNode = options.resetNode;
    onChange = options.onChange;

    App.config.FILTERS.forEach((dimension) => {
      state.set(dimension.key, new Set());
      container.appendChild(buildDimension(dimension));
    });

    container.appendChild(statusNode.parentNode);

    resetNode.addEventListener('click', reset);
    document.addEventListener('click', closeAllMenus);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAllMenus();
    });

    paintChrome();
  }

  return { init, reset, visibleRecords };
})();
