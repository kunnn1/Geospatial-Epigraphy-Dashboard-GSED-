window.App = window.App || {};

App.chart = (function () {
  'use strict';

  let container, svg, tooltipNode;
  let allRecords = [];

  const MARGIN = { top: 4, right: 18, bottom: 22, left: 132 };
  const ROW_HEIGHT = 26;
  const ROW_GAP = 7;
  const SEGMENT_GAP = 2;      // surface-coloured gap between stacked segments
  const BAR_RADIUS = 3;

  function init(options) {
    container = options.container;
    allRecords = options.records;

    svg = d3.select(container).append('svg')
      .attr('class', 'chart-svg')
      .attr('width', '100%');

    tooltipNode = document.createElement('div');
    tooltipNode.className = 'map-tooltip';
    tooltipNode.style.position = 'absolute';
    container.style.position = 'relative';
    container.appendChild(tooltipNode);

    window.addEventListener('resize', debounce(() => render(currentRecords), 150));
  }

  let currentRecords = [];


  function aggregate(records) {
    const byRegion = new Map();

    records.forEach((record) => {
      if (!byRegion.has(record.locality)) {
        byRegion.set(record.locality, { region: record.locality, total: 0, counts: {} });
      }
      const row = byRegion.get(record.locality);
      row.counts[record.religion] = (row.counts[record.religion] || 0) + 1;
      row.total += 1;
    });

    return [...byRegion.values()].sort((a, b) => b.total - a.total);
  }

  function render(records) {
    currentRecords = records;
    const rows = aggregate(records);

    const width = container.clientWidth;
    const innerWidth = Math.max(80, width - MARGIN.left - MARGIN.right);
    const height = MARGIN.top + MARGIN.bottom + rows.length * (ROW_HEIGHT + ROW_GAP);

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('height', height);
    svg.selectAll('*').remove();

    if (!rows.length) {
      svg.append('text')
        .attr('x', width / 2).attr('y', 40)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--ink-3)')
        .attr('font-family', 'var(--font-sans)')
        .attr('font-size', 12)
        .text('No records match the current filter.');
      return;
    }

    const maxTotal = d3.max(rows, (row) => row.total);
    const x = d3.scaleLinear().domain([0, maxTotal]).range([0, innerWidth]);

    const plot = svg.append('g').attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

    const axisY = rows.length * (ROW_HEIGHT + ROW_GAP);
    const ticks = x.ticks(Math.min(6, maxTotal));

    plot.append('g')
      .selectAll('line')
      .data(ticks)
      .join('line')
      .attr('x1', (d) => x(d)).attr('x2', (d) => x(d))
      .attr('y1', 0).attr('y2', axisY - ROW_GAP)
      .attr('stroke', 'var(--rule)')
      .attr('stroke-width', 1)
      .attr('opacity', (d) => (d === 0 ? 0 : 0.6));

    plot.append('g')
      .selectAll('text')
      .data(ticks)
      .join('text')
      .attr('x', (d) => x(d))
      .attr('y', axisY + 8)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--ink-3)')
      .attr('font-family', 'var(--font-sans)')
      .attr('font-size', 10)
      .style('font-variant-numeric', 'tabular-nums')
      .text((d) => d);

    const row = plot.selectAll('g.chart-row')
      .data(rows)
      .join('g')
      .attr('class', 'chart-row')
      .attr('transform', (d, i) => `translate(0, ${i * (ROW_HEIGHT + ROW_GAP)})`);

    row.append('text')
      .attr('x', -10)
      .attr('y', ROW_HEIGHT / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'var(--ink-2)')
      .attr('font-family', 'var(--font-sans)')
      .attr('font-size', 11)
      .text((d) => d.region);

    row.each(function (rowDatum) {
      const group = d3.select(this);
      let offset = 0;

      App.config.CATEGORY_ORDER.forEach((categoryId) => {
        const count = rowDatum.counts[categoryId] || 0;
        if (!count) return;

        const segmentWidth = Math.max(0, x(count) - SEGMENT_GAP);
        const isFirst = offset === 0;
        const isLast = offset + count === rowDatum.total;

        group.append('rect')
          .attr('x', x(offset))
          .attr('y', 0)
          .attr('width', segmentWidth)
          .attr('height', ROW_HEIGHT)
          
          .attr('rx', isFirst || isLast ? BAR_RADIUS : 0)
          .attr('fill', `var(--cat-${categoryId})`)
          .style('cursor', 'default')
          .on('pointerenter', function (event) {
            showTooltip(event, rowDatum.region, categoryId, count);
          })
          .on('pointerleave', hideTooltip);

        if (isFirst && !isLast && segmentWidth > BAR_RADIUS) {
          group.append('rect')
            .attr('x', x(offset) + segmentWidth - BAR_RADIUS)
            .attr('y', 0).attr('width', BAR_RADIUS).attr('height', ROW_HEIGHT)
            .attr('fill', `var(--cat-${categoryId})`)
            .style('pointer-events', 'none');
        }
        if (isLast && !isFirst && segmentWidth > BAR_RADIUS) {
          group.append('rect')
            .attr('x', x(offset))
            .attr('y', 0).attr('width', BAR_RADIUS).attr('height', ROW_HEIGHT)
            .attr('fill', `var(--cat-${categoryId})`)
            .style('pointer-events', 'none');
        }

        offset += count;
      });

  
      group.append('text')
        .attr('x', x(rowDatum.total) + 7)
        .attr('y', ROW_HEIGHT / 2)
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'var(--ink-2)')
        .attr('font-family', 'var(--font-sans)')
        .attr('font-size', 11)
        .attr('font-weight', 600)
        .style('font-variant-numeric', 'tabular-nums')
        .text(rowDatum.total);
    });
  }

  function showTooltip(event, region, categoryId, count) {
    const category = App.config.CATEGORIES[categoryId];
    tooltipNode.innerHTML = `
      <div class="map-tooltip__kicker" style="color: var(--cat-${categoryId})">
        ${App.ui.categoryIcon(categoryId)}
        <span>${App.ui.escape(category.label)}</span>
      </div>
      <div class="map-tooltip__title">${count} ${count === 1 ? 'record' : 'records'}</div>
      <div class="map-tooltip__date">${App.ui.escape(region)}</div>
    `;
    tooltipNode.classList.add('is-visible');

    const rect = container.getBoundingClientRect();
    const cardRect = tooltipNode.getBoundingClientRect();
    let left = event.clientX - rect.left + 14;
    if (left + cardRect.width > rect.width - 6) left = event.clientX - rect.left - cardRect.width - 14;
    tooltipNode.style.left = `${Math.max(6, left)}px`;
    tooltipNode.style.top = `${Math.max(6, event.clientY - rect.top - cardRect.height - 8)}px`;
  }

  function hideTooltip() {
    tooltipNode.classList.remove('is-visible');
  }

  function debounce(fn, wait) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, wait);
    };
  }

  return { init, render };
})();
