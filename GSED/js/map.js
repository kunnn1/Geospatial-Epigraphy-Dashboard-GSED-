window.App = window.App || {};

App.map = (function () {
  'use strict';

  const cfg = App.config;

  const GLYPH_RADIUS = 6.5;
  const HIT_RADIUS = 13;

  let svg, layers, projection, geoPath, zoomBehaviour;
  let width = 0, height = 0;
  let currentTransform = { k: 1, x: 0, y: 0 };
  let records = [];
  let markerSelection = null;
  let selectedId = null;
  let callbacks = {};

  function glyphPath(shape, r) {
    switch (shape) {
      case 'star': {
        const h = r * 1.05;
        const up = `M0,${-h} L${h * 0.866},${h * 0.5} L${-h * 0.866},${h * 0.5} Z`;
        const down = `M0,${h} L${h * 0.866},${-h * 0.5} L${-h * 0.866},${-h * 0.5} Z`;
        return `${up} ${down}`;
      }
      case 'cross': {
        const a = r * 0.34;         
        const v = r * 1.15;         
        const hArm = r * 0.92;      
        const bar = -r * 0.25;      
        return [
          `M${-a},${-v}`, `L${a},${-v}`, `L${a},${bar - a}`,
          `L${hArm},${bar - a}`, `L${hArm},${bar + a}`, `L${a},${bar + a}`,
          `L${a},${v}`, `L${-a},${v}`, `L${-a},${bar + a}`,
          `L${-hArm},${bar + a}`, `L${-hArm},${bar - a}`, `L${-a},${bar - a}`, 'Z'
        ].join(' ');
      }
      case 'square': {
        const s = r * 0.86;
        return `M${-s},${-s} L${s},${-s} L${s},${s} L${-s},${s} Z`;
      }
      case 'circle':
      default: {
        return `M${-r},0 A${r},${r} 0 1,0 ${r},0 A${r},${r} 0 1,0 ${-r},0`;
      }
    }
  }

  
  function computeOffsets(items) {
    const groups = new Map();
    items.forEach((record) => {
      const key = `${record.lat.toFixed(2)},${record.lon.toFixed(2)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record);
    });

    groups.forEach((group) => {
      if (group.length === 1) {
        group[0]._dx = 0;
        group[0]._dy = 0;
        return;
      }
      const radius = 9 + group.length * 1.6;
      group.forEach((record, index) => {
        const angle = (index / group.length) * Math.PI * 2 - Math.PI / 2;
        record._dx = Math.cos(angle) * radius;
        record._dy = Math.sin(angle) * radius;
      });
    });
  }

  function markerTransform(record) {
    const [x, y] = projection([record.lon, record.lat]);
    const px = x * currentTransform.k + currentTransform.x + (record._dx || 0);
    const py = y * currentTransform.k + currentTransform.y + (record._dy || 0);
    return `translate(${px}, ${py})`;
  }


  function drawBase() {
    const basemap = window.BASEMAP_DATA;

    layers.sea.append('rect')
      .attr('class', 'map-sea')
      .attr('x', -4000).attr('y', -4000)
      .attr('width', 12000).attr('height', 12000);

    layers.graticule.append('path')
      .attr('class', 'map-graticule')
      .datum(d3.geoGraticule().step([5, 5])())
      .attr('d', geoPath);

    layers.land.selectAll('path.map-coast-glow')
      .data(basemap.features)
      .join('path')
      .attr('class', 'map-coast-glow')
      .attr('d', geoPath);

    layers.land.selectAll('path.map-land')
      .data(basemap.features)
      .join('path')
      .attr('class', 'map-land')
      .attr('d', geoPath);

    layers.borders.selectAll('path')
      .data(basemap.features)
      .join('path')
      .attr('class', 'map-border')
      .attr('d', geoPath);
  }


  function drawLabels() {
    layers.labels.selectAll('text.map-label--country')
      .data(cfg.COUNTRIES)
      .join('text')
      .attr('class', (d) => `map-label map-label--country${d.small ? ' is-small' : ''}`)
      .attr('data-hide-below', (d) => d.hideBelow || 0)
      .text((d) => d.name);

    layers.labels.selectAll('text.map-label--water')
      .data(cfg.WATER_LABELS)
      .join('text')
      .attr('class', (d) => `map-label map-label--water${d.small ? ' is-small' : ''}`)
      .text((d) => d.name);

    layers.labels.selectAll('text.map-label--desert')
      .data(cfg.DESERT_LABELS)
      .join('text')
      .attr('class', (d) => `map-label map-label--desert${d.small ? ' is-small' : ''}`)
      .text((d) => d.name);

    const places = layers.places.selectAll('g.map-place')
      .data(cfg.PLACES)
      .join('g')
      .attr('class', 'map-place');

    places.append('circle')
      .attr('class', (d) => `map-place-dot map-place-dot--${d.tier}`)
      .attr('r', (d) => (d.tier === 'ancient' ? 2.6 : 1.9));

    places.append('text')
      .attr('class', (d) =>
        `map-label ${d.tier === 'ancient' ? 'map-label--place' : 'map-label--modern'}`)
      .attr('text-anchor', (d) => d.anchor || 'start')
      .attr('dx', (d) => (d.anchor === 'end' ? -7 : 7))
      .attr('dy', (d) => d.dy || 0)
      .text((d) => d.name);
  }

  function positionLabels() {
    const place = (selection) => selection.attr('transform', (d) => {
      const [x, y] = projection([d.lon, d.lat]);
      const px = x * currentTransform.k + currentTransform.x;
      const py = y * currentTransform.k + currentTransform.y;
      const rotate = d.rotate ? ` rotate(${d.rotate})` : '';
      return `translate(${px}, ${py})${rotate}`;
    });

    place(layers.labels.selectAll('text.map-label--country'))
      .style('display', (d) =>
        (d.hideBelow && currentTransform.k < d.hideBelow ? 'none' : null));
    place(layers.labels.selectAll('text.map-label--water'));
    place(layers.labels.selectAll('text.map-label--desert'));

    place(layers.places.selectAll('g.map-place'))
      .style('display', (d) =>
        (d.minZoom && currentTransform.k < d.minZoom ? 'none' : null));
  }


  function drawMarkers() {
    computeOffsets(records);

    markerSelection = layers.markers.selectAll('g.marker')
      .data(records, (d) => d.id)
      .join((enter) => {
        const g = enter.append('g')
          .attr('class', (d) => `marker marker--${d.religion}`)
          .attr('tabindex', 0)
          .attr('role', 'button')
          .attr('aria-label', (d) => `${d.name}, ${d.dateLabel}`);

        g.append('circle')
          .attr('class', 'marker__halo')
          .attr('r', GLYPH_RADIUS + 4.5);

        g.append('path')
          .attr('class', 'marker__glyph')
          .attr('d', (d) => glyphPath(cfg.CATEGORIES[d.religion].shape, GLYPH_RADIUS));

        const multi = g.filter((d) => d.textCount > 1);
        multi.append('circle')
          .attr('class', 'marker__count-bg')
          .attr('cx', GLYPH_RADIUS + 1.5)
          .attr('cy', -GLYPH_RADIUS - 1.5)
          .attr('r', 6);
        multi.append('text')
          .attr('class', 'marker__count')
          .attr('x', GLYPH_RADIUS + 1.5)
          .attr('y', -GLYPH_RADIUS - 1.5)
          .text((d) => `${d.textCount}`);

        g.append('circle')
          .attr('class', 'marker__hit')
          .attr('r', HIT_RADIUS);

        return g;
      });

    markerSelection
      .on('pointerenter', function (event, d) {
        if (callbacks.onHover) callbacks.onHover(d, this);
      })
      .on('pointerleave', function () {
        if (callbacks.onHoverEnd) callbacks.onHoverEnd();
      })
      .on('click', function (event, d) {
        event.stopPropagation();
        if (callbacks.onSelect) callbacks.onSelect(d);
      })
      .on('keydown', function (event, d) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (callbacks.onSelect) callbacks.onSelect(d);
        }
      })
      .on('focus', function (event, d) {
        if (callbacks.onHover) callbacks.onHover(d, this);
      })
      .on('blur', function () {
        if (callbacks.onHoverEnd) callbacks.onHoverEnd();
      });

    positionMarkers();
  }

  function positionMarkers() {
    if (markerSelection) markerSelection.attr('transform', markerTransform);
  }

  function onZoom(event) {
    currentTransform = event.transform;
    layers.world.attr('transform', event.transform);
    positionLabels();
    positionMarkers();
    if (callbacks.onZoom) callbacks.onZoom(currentTransform);
  }

  function windowFitObject() {
    const [[west, south], [east, north]] = cfg.BBOX;
    const STEP = 1;                       
    const points = [];
    for (let lon = west; lon <= east; lon += STEP) {
      points.push([lon, south], [lon, north]);
    }
    for (let lat = south; lat <= north; lat += STEP) {
      points.push([west, lat], [east, lat]);
    }
    return { type: 'MultiPoint', coordinates: points };
  }

  function resize() {
    const frame = svg.node().parentNode;
    const rect = frame.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    width = rect.width;
    height = rect.height;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    projection.fitExtent([[14, 14], [width - 14, height - 14]], windowFitObject());

    layers.land.selectAll('path').attr('d', geoPath);
    layers.borders.selectAll('path').attr('d', geoPath);
    layers.graticule.selectAll('path').attr('d', geoPath);

    positionLabels();
    positionMarkers();
  }


  function init(options) {
    records = options.records;
    callbacks = options.callbacks || {};

    svg = d3.select(options.svg);

    projection = d3.geoConicEqualArea()
      .parallels([12, 32])
      .rotate([-44, 0])
      .center([0, 22]);

    geoPath = d3.geoPath(projection);

    layers = {};
    layers.sea = svg.append('g').attr('class', 'layer-sea');
    layers.world = svg.append('g').attr('class', 'layer-world');
    layers.graticule = layers.world.append('g').attr('class', 'layer-graticule');
    layers.land = layers.world.append('g').attr('class', 'layer-land');
    layers.borders = layers.world.append('g').attr('class', 'layer-borders');
    layers.labels = svg.append('g').attr('class', 'layer-labels');
    layers.places = svg.append('g').attr('class', 'layer-places');
    layers.markers = svg.append('g').attr('class', 'layer-markers');

    zoomBehaviour = d3.zoom()
      .scaleExtent(cfg.ZOOM_EXTENT)
      .on('zoom', onZoom);

    svg.call(zoomBehaviour);

    svg.on('click', () => {
      if (callbacks.onSelect) callbacks.onSelect(null);
    });

    resize();
    drawBase();
    drawLabels();
    drawMarkers();
    resize();  
    window.addEventListener('resize', debounce(resize, 150));
  }

  function applyFilter(visibleIds) {
    if (!markerSelection) return;
    markerSelection.classed('is-muted', (d) => !visibleIds.has(d.id));
  }

  function setSelected(id) {
    selectedId = id;
    if (markerSelection) markerSelection.classed('is-selected', (d) => d.id === selectedId);
  }

  function zoomBy(factor) {
    svg.transition().duration(280).call(zoomBehaviour.scaleBy, factor);
  }

  function resetZoom() {
    svg.transition().duration(420).call(zoomBehaviour.transform, d3.zoomIdentity);
  }

  function focusOn(record, scale) {
    const [x, y] = projection([record.lon, record.lat]);
    const k = scale || Math.max(currentTransform.k, 2.6);
    const transform = d3.zoomIdentity
      .translate(width / 2 - x * k, height / 2 - y * k)
      .scale(k);
    svg.transition().duration(500).call(zoomBehaviour.transform, transform);
  }

  function debounce(fn, wait) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, wait);
    };
  }

  return { init, applyFilter, setSelected, zoomBy, resetZoom, focusOn, glyphPath };
})();
