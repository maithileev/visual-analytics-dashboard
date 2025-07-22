<script lang="ts">
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
  
    interface RadarData {
      roi: number;
      occupancyRate: number;
      minNights: number;
      reviewCount: number;
      rating: number;
    }
  
    export let overallData: RadarData;
    export let neighborhoodNormalized: RadarData | null = null;
  
    let svgElement: SVGSVGElement;
  
    const keys = ['roi', 'occupancyRate', 'minNights', 'reviewCount', 'rating'];
  
    const width = 450;
    const height = 450;
    const margin = 50;
    const radius = Math.min(width, height) / 2 - margin;
    const MIN_VISUAL_RADIUS = 0.08; // 8% min radius for visibility
  
    const colors = {
      overall: 'indigo',
      selected: 'orange',
    };
  
    const safeValue = (val: any) =>
      typeof val === 'number' && !isNaN(val) ? val : 0;
  
    function radialPoint(value: number, angle: number) {
      return [
        radius * value * Math.cos(angle - Math.PI / 2),
        radius * value * Math.sin(angle - Math.PI / 2),
      ];
    }
  
    function formatLabel(key: string) {
      return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
    }
  
    let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    let tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  
    $: if (svgElement) {
      svg = d3.select(svgElement);
    }
  
    onMount(() => {
      drawChart(overallData, neighborhoodNormalized);
      tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0,0,0,0.75)')
        .style('color', '#fff')
        .style('padding', '6px 10px')
        .style('border-radius', '4px')
        .style('font-size', '13px')
        .style('pointer-events', 'none')
        .style('visibility', 'hidden');
    });
  
    $: if (svg && overallData) {
      drawChart(overallData, neighborhoodNormalized);
    }
  
    function drawChart(overallData: RadarData, neighborhoodNormalized: RadarData | null) {
      if (!svg) return;
  
      svg.selectAll('*').remove();
  
      const g = svg
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);
  
      const angleScale = d3
        .scaleBand<string>()
        .domain(keys)
        .range([0, 2 * Math.PI])
        .paddingInner(0.1);
  
      const levels = 5;
      const maxPercent = 80;
      for (let level = 1; level <= levels; level++) {
        const percentValue = (level * maxPercent) / levels;
        const r = (radius / levels) * level;
        g.append('circle')
          .attr('r', r)
          .attr('fill', 'none')
          .attr('stroke', '#ccc')
          .attr('stroke-dasharray', '3 3');
  
        g.append('text')
          .attr('x', 5)
          .attr('y', -r)
          .attr('font-size', '11px')
          .attr('fill', '#666')
          .text(`${percentValue.toFixed(0)}%`);
      }
  
      keys.forEach((key) => {
        const angle = angleScale(key) ?? 0;
        const [x, y] = radialPoint(1, angle);
        g.append('line')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', x)
          .attr('y2', y)
          .attr('stroke', '#999');
  
        const [lx, ly] = radialPoint(1.1, angle);
        g.append('text')
          .attr('x', lx)
          .attr('y', ly)
          .attr('text-anchor', 'middle')
          .attr('font-size', '13px')
          .attr('fill', '#333')
          .text(formatLabel(key));
      });
  
      // Prepare points with min visual radius for better visibility
      const overallPoints = keys.map((key) => ({
        key,
        value: Math.max(safeValue(overallData[key]), MIN_VISUAL_RADIUS),
        rawValue: safeValue(overallData[key]),
      }));
  
      const selectedPoints =
        neighborhoodNormalized &&
        keys.map((key) => ({
          key,
          value: Math.max(safeValue(neighborhoodNormalized[key]), MIN_VISUAL_RADIUS),
          rawValue: safeValue(neighborhoodNormalized[key]),
        }));
  
      const lineGenerator = d3
        .lineRadial<{ key: string; value: number }>()
        .radius((d) => d.value * radius)
        .angle((d) => angleScale(d.key) ?? 0)
        .curve(d3.curveLinearClosed);
  
      g.append('path')
        .datum(overallPoints)
        .attr('d', lineGenerator)
        .attr('fill', colors.overall)
        .attr('fill-opacity', 0.3)
        .attr('stroke', colors.overall)
        .attr('stroke-width', 2);
  
      if (selectedPoints) {
        g.append('path')
          .datum(selectedPoints)
          .attr('d', lineGenerator)
          .attr('fill', colors.selected)
          .attr('fill-opacity', 0.4)
          .attr('stroke', colors.selected)
          .attr('stroke-width', 2);
      }
  
      // Draw pulsing rings for overlapping points and circles
      keys.forEach((key, i) => {
        if (!selectedPoints) return;
  
        const overallP = overallPoints[i];
        const selectedP = selectedPoints[i];
  
        const overallPos = radialPoint(overallP.value, angleScale(key) ?? 0);
        const selectedPos = radialPoint(selectedP.value, angleScale(key) ?? 0);
  
        // Distance between points
        const dist = Math.hypot(overallPos[0] - selectedPos[0], overallPos[1] - selectedPos[1]);
  
        // Threshold to consider overlapping (within circle radius*2)
        const overlapThreshold = 20;
  
        if (dist < overlapThreshold) {
          // Draw pulsing ring at overall point
          g.append('circle')
            .attr('class', 'pulse-ring')
            .attr('cx', overallPos[0])
            .attr('cy', overallPos[1])
            .attr('r', 14)
            .attr('fill', 'none')
            .attr('stroke', colors.overall)
            .attr('stroke-width', 3);
  
          // Draw pulsing ring at selected point
          g.append('circle')
            .attr('class', 'pulse-ring')
            .attr('cx', selectedPos[0])
            .attr('cy', selectedPos[1])
            .attr('r', 14)
            .attr('fill', 'none')
            .attr('stroke', colors.selected)
            .attr('stroke-width', 3);
        }
      });
  
      // Draw overall points
      g.selectAll('.overall-point')
        .data(overallPoints)
        .enter()
        .append('circle')
        .attr('class', 'overall-point')
        .attr('cx', (d) => radialPoint(d.value, angleScale(d.key) ?? 0)[0])
        .attr('cy', (d) => radialPoint(d.value, angleScale(d.key) ?? 0)[1])
        .attr('r', 8)
        .attr('fill', colors.overall)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .on('mouseover', (event, d) => {
          let selectedVal = '';
          if (selectedPoints) {
            const sel = selectedPoints.find(p => p.key === d.key);
            if (sel) selectedVal = `<br/><strong>${formatLabel(sel.key)} (Selected):</strong> ${(sel.rawValue * 100).toFixed(1)}%`;
          }
          tooltip
            .style('visibility', 'visible')
            .html(
              `<strong>${formatLabel(d.key)} (Overall):</strong> ${(d.rawValue * 100).toFixed(1)}%` + selectedVal
            )
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 28 + 'px');
        })
        .on('mousemove', (event) => {
          tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 28 + 'px');
        })
        .on('mouseout', () => tooltip.style('visibility', 'hidden'));
  
      // Draw selected points
      if (selectedPoints) {
        g.selectAll('.selected-point')
          .data(selectedPoints)
          .enter()
          .append('circle')
          .attr('class', 'selected-point')
          .attr('cx', (d) => radialPoint(d.value, angleScale(d.key) ?? 0)[0])
          .attr('cy', (d) => radialPoint(d.value, angleScale(d.key) ?? 0)[1])
          .attr('r', 8)
          .attr('fill', colors.selected)
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .on('mouseover', (event, d) => {
            let overallVal = '';
            if (overallPoints) {
              const ov = overallPoints.find(p => p.key === d.key);
              if (ov) overallVal = `<br/><strong>${formatLabel(ov.key)} (Overall):</strong> ${(ov.rawValue * 100).toFixed(1)}%`;
            }
            tooltip
              .style('visibility', 'visible')
              .html(
                `<strong>${formatLabel(d.key)} (Selected):</strong> ${(d.rawValue * 100).toFixed(1)}%` + overallVal
              )
              .style('left', event.pageX + 10 + 'px')
              .style('top', event.pageY - 28 + 'px');
          })
          .on('mousemove', (event) => {
            tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 28 + 'px');
          })
          .on('mouseout', () => tooltip.style('visibility', 'hidden'));
      }
  
      // Legend
      const legend = svg.append('g').attr('transform', `translate(${margin}, ${margin})`);
      const legendData = [
        { label: 'Overall', color: colors.overall },
        { label: 'Selected Neighborhood', color: colors.selected },
      ];
  
      legendData.forEach((d, i) => {
        legend
          .append('rect')
          .attr('x', 0)
          .attr('y', i * 20)
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', d.color)
          .attr('opacity', 0.7);
  
        legend
          .append('text')
          .attr('x', 20)
          .attr('y', i * 20 + 10)
          .attr('font-size', '12px')
          .attr('fill', '#333')
          .text(d.label);
      });
    }
  </script>
  
  <svg bind:this={svgElement}></svg>
  
  <style>
    .tooltip {
      position: absolute;
      pointer-events: none;
      background: rgba(0, 0, 0, 0.75);
      color: white;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 13px;
      visibility: hidden;
      z-index: 1000;
    }
  
    /* Pulsing ring animation */
    @keyframes pulse {
      0% {
        stroke-opacity: 0.7;
        r: 14;
        stroke-width: 3;
      }
      50% {
        stroke-opacity: 0.1;
        r: 18;
        stroke-width: 1;
      }
      100% {
        stroke-opacity: 0.7;
        r: 14;
        stroke-width: 3;
      }
    }
  
    .pulse-ring {
      animation: pulse 2s infinite;
      transform-origin: center;
    }
  </style>
  