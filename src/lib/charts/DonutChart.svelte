   <!-- <script lang="ts">
    import * as d3 from 'd3';
    import { afterUpdate } from 'svelte';
  
    export let summaryData: { overview: Record<string, number>; region?: Record<string, number> };
  
    let svg: SVGSVGElement;
    let tooltip: HTMLDivElement;
  
    let allLabels: string[] = [];
    let color: d3.ScaleOrdinal<string, string>;
  
    let selectedLabel: string | null = null;
    let selectedValue: number | null = null;
  
    let needsRedraw = true;
  
    // Watch for summaryData change
    $: if (summaryData && summaryData.overview) {
      needsRedraw = true;
    }
  
    // Trigger chart draw only when data updates
    afterUpdate(() => {
      if (needsRedraw) {
        drawChart();
        needsRedraw = false;
      }
    });
  
    function objToArray(obj: Record<string, number>) {
      return Object.entries(obj).map(([label, value]) => ({ label, value }));
    }
  
    function hideTooltip() {
      if (tooltip) tooltip.style.opacity = '0';
    }
  
    function showTooltip(event: MouseEvent, d: d3.PieArcDatum<{ label: string; value: number }>, total: number) {
      if (!tooltip) return;
  
      const percent = ((d.data.value / total) * 100).toFixed(1);
      tooltip.style.opacity = '1';
      tooltip.innerHTML = `<strong>${d.data.label}</strong>: ${percent}% (${d.data.value})`;
  
      const wrapperRect = (tooltip.parentElement as HTMLElement).getBoundingClientRect();
      tooltip.style.left = (event.clientX - wrapperRect.left + 10) + 'px';
      tooltip.style.top = (event.clientY - wrapperRect.top - 30) + 'px';
    }
  
    function drawChart() {
      const width = 300;
      const height = 300;
      const radius = Math.min(width, height) / 2;
  
      // Clean previous SVG content
      d3.select(svg).selectAll('*').remove();
  
      // Set up labels + color
      allLabels = Array.from(new Set([
        ...Object.keys(summaryData.overview),
        ...(summaryData.region ? Object.keys(summaryData.region) : [])
      ]));
  
      color = d3.scaleOrdinal<string>()
        .domain(allLabels)
        .range(d3.schemeCategory10.concat(d3.schemeCategory10));
  
      const svgSelection = d3.select(svg)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('role', 'img')
        .attr('aria-label', 'Multi-layer donut chart')
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
  
      const pie = d3.pie<{ label: string; value: number }>()
        .sort(null)
        .value(d => d.value);
  
      const arcInner = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.7);
  
      const arcOuter = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
        .innerRadius(radius * 0.75)
        .outerRadius(radius * 0.95);
  
      const overviewDataArray = objToArray(summaryData.overview);
      const totalOverview = d3.sum(overviewDataArray, d => d.value);
  
      const hasLicenseObj = overviewDataArray.find(d => d.label === 'Has License');
      if (!selectedLabel && hasLicenseObj) {
        selectedLabel = hasLicenseObj.label;
        selectedValue = hasLicenseObj.value;
      }
  
      const centerGroup = svgSelection.append('g').attr('class', 'center-text');
      const centerLabel = centerGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.2em')
        .attr('font-weight', '600')
        .attr('font-size', '1.3rem')
        .attr('fill', '#333');
  
      const centerValue = centerGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.2em')
        .attr('font-weight', '400')
        .attr('font-size', '1rem')
        .attr('fill', '#555');
  
      function updateCenterText(label: string | null, value: number | null) {
        centerLabel.text(label || '');
        centerValue.text(value !== null && value !== undefined ? value.toString() : '');
      }
  
      updateCenterText(selectedLabel, selectedValue);
  
      const overviewArcs = svgSelection.selectAll('.arc-inner')
        .data(pie(overviewDataArray))
        .enter()
        .append('g')
        .attr('class', 'arc-inner');
  
      overviewArcs.append('path')
        .attr('fill', d => color(d.data.label))
        .attr('d', arcInner)
        .transition()
        .duration(1000)
        .attrTween('d', function (d) {
          const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return function (t) {
            const interpolated = i(t);
            return arcInner({ ...d, startAngle: interpolated.startAngle, endAngle: interpolated.endAngle })!;
          };
        });
  
      overviewArcs.select('path')
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('d', d3.arc().innerRadius(radius * 0.5).outerRadius(radius * 0.77));
          showTooltip(event, d, totalOverview);
        })
        .on('mousemove', (event) => {
          const wrapperRect = (tooltip.parentElement as HTMLElement).getBoundingClientRect();
          tooltip.style.left = (event.clientX - wrapperRect.left + 10) + 'px';
          tooltip.style.top = (event.clientY - wrapperRect.top - 30) + 'px';
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget).transition().duration(200).attr('d', arcInner);
          hideTooltip();
        })
        .on('click', (event, d) => {
          selectedLabel = d.data.label;
          selectedValue = d.data.value;
          updateCenterText(selectedLabel, selectedValue);
        });
  
      if (summaryData.region) {
        const regionDataArray = objToArray(summaryData.region);
        const totalRegion = d3.sum(regionDataArray, d => d.value);
  
        const regionArcs = svgSelection.selectAll('.arc-outer')
          .data(pie(regionDataArray))
          .enter()
          .append('g')
          .attr('class', 'arc-outer');
  
        regionArcs.append('path')
          .attr('fill', d => color(d.data.label))
          .attr('d', arcOuter)
          .transition()
          .duration(1000)
          .attrTween('d', function (d) {
            const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
            return function (t) {
              const interpolated = i(t);
              return arcOuter({ ...d, startAngle: interpolated.startAngle, endAngle: interpolated.endAngle })!;
            };
          });
  
        regionArcs.select('path')
          .on('mouseover', (event, d) => {
            d3.select(event.currentTarget)
              .transition()
              .duration(200)
              .attr('d', d3.arc().innerRadius(radius * 0.75).outerRadius(radius * 1.05));
            showTooltip(event, d, totalRegion);
          })
          .on('mousemove', (event) => {
            const wrapperRect = (tooltip.parentElement as HTMLElement).getBoundingClientRect();
            tooltip.style.left = (event.clientX - wrapperRect.left + 10) + 'px';
            tooltip.style.top = (event.clientY - wrapperRect.top - 30) + 'px';
          })
          .on('mouseout', (event) => {
            d3.select(event.currentTarget).transition().duration(200).attr('d', arcOuter);
            hideTooltip();
          })
          .on('click', (event, d) => {
            selectedLabel = d.data.label;
            selectedValue = d.data.value;
            updateCenterText(selectedLabel, selectedValue);
          });
      }
    }
  </script>
  
  <style>
    .wrapper {
      position: relative;
      width: 300px;
    }
  
    .tooltip {
      position: absolute;
      background-color: white;
      border: 1px solid #ccc;
      padding: 6px 10px;
      font-size: 0.9rem;
      pointer-events: none;
      border-radius: 4px;
      box-shadow: 0 0 6px rgba(0,0,0,0.15);
      opacity: 0;
      transition: opacity 0.3s ease;
      user-select: none;
      white-space: nowrap;
      z-index: 10;
    }
  
    .legend {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 15px;
    }
  
    .legend-item {
      margin: 0 12px 8px 12px;
      display: flex;
      align-items: center;
      font-size: 0.9rem;
    }
  
    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      margin-right: 8px;
    }
  </style>
  
  <div class="wrapper">
    <div class="donut-container">
      <svg bind:this={svg}></svg>
    </div>
  
    <div class="tooltip" bind:this={tooltip}></div>
  
    <div class="legend">
      {#each allLabels as label}
        <div class="legend-item">
          <div class="legend-color" style="background-color: {color(label)}"></div>
          {label}
        </div>
      {/each}
    </div>
  </div> -->
  <script lang="ts">
    import * as d3 from 'd3';
    import { afterUpdate } from 'svelte';
  
    export let summaryData: { overview: Record<string, number>; region?: Record<string, number> };
  
    let svg: SVGSVGElement;
    let tooltip: HTMLDivElement;
  
    let allLabels: string[] = [];
    let color: d3.ScaleOrdinal<string, string>;
  
    let selectedLabel: string | null = null;
    let selectedValue: number | null = null;
  
    let needsRedraw = true;
  
    $: if (summaryData && summaryData.overview) {
      needsRedraw = true;
    }
  
    afterUpdate(() => {
      if (needsRedraw) {
        drawChart();
        needsRedraw = false;
      }
    });
  
    function objToArray(obj: Record<string, number>) {
      return Object.entries(obj).map(([label, value]) => ({ label, value }));
    }
  
    function hideTooltip() {
      if (tooltip) tooltip.style.opacity = '0';
    }
  
    function showTooltip(event: MouseEvent, d: d3.PieArcDatum<{ label: string; value: number }>, total: number) {
      if (!tooltip) return;
  
      const percent = ((d.data.value / total) * 100).toFixed(1);
      tooltip.style.opacity = '1';
      tooltip.innerHTML = `<strong>${d.data.label}</strong>: ${percent}% (${d.data.value})`;
  
      const wrapperRect = (tooltip.parentElement as HTMLElement).getBoundingClientRect();
      tooltip.style.left = (event.clientX - wrapperRect.left + 10) + 'px';
      tooltip.style.top = (event.clientY - wrapperRect.top - 30) + 'px';
    }
  
    function drawChart() {
      const width = 300;
      const height = 300;
      const radius = Math.min(width, height) / 2;
  
      d3.select(svg).selectAll('*').remove();
  
      allLabels = Array.from(new Set([
        ...Object.keys(summaryData.overview),
        ...(summaryData.region ? Object.keys(summaryData.region) : [])
      ]));
  
      color = d3.scaleOrdinal<string>()
        .domain(allLabels)
        .range(d3.schemeCategory10.concat(d3.schemeCategory10));
  
      const svgSelection = d3.select(svg)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('role', 'img')
        .attr('aria-label', 'Multi-layer donut chart')
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
  
      const pie = d3.pie<{ label: string; value: number }>()
        .sort(null)
        .value(d => d.value);
  
      const arcInner = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.7);
  
      const arcOuter = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
        .innerRadius(radius * 0.75)
        .outerRadius(radius * 0.95);
  
      const overviewDataArray = objToArray(summaryData.overview);
      const totalOverview = d3.sum(overviewDataArray, d => d.value);
  
      // Default select "Has License" if none selected
      const hasLicenseObj = overviewDataArray.find(d => d.label === 'Has License');
      if (!selectedLabel && hasLicenseObj) {
        selectedLabel = hasLicenseObj.label;
        selectedValue = hasLicenseObj.value;
      }
  
      const centerGroup = svgSelection.append('g').attr('class', 'center-text');
  
      const centerLabel = centerGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-1em')
        .attr('font-weight', '600')
        .attr('font-size', '1.2rem')
        .attr('fill', '#333');
  
      const centerOverview = centerGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.5em')
        .attr('font-weight', '400')
        .attr('font-size', '0.9rem')
        .attr('fill', '#555');
  
      const centerRegion = centerGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '2.2em')
        .attr('font-weight', '400')
        .attr('font-size', '0.9rem')
        .attr('fill', '#777');
  
      function updateCenterText(label: string | null, regionRawValue: number | null) {
        if (!label) {
          centerLabel.text('');
          centerOverview.text('');
          centerRegion.text('');
          return;
        }
  
        const overviewTotal = d3.sum(Object.values(summaryData.overview));
        const overviewVal = summaryData.overview[label] ?? 0;
        const overviewPct = ((overviewVal / overviewTotal) * 100).toFixed(1);
  
        const hasRegion = summaryData.region && summaryData.region[label] !== undefined;
        const regionVal = hasRegion ? summaryData.region![label] : null;
        const regionTotal = summaryData.region ? d3.sum(Object.values(summaryData.region)) : null;
        const regionPct = regionVal !== null && regionTotal ? ((regionVal / regionTotal) * 100).toFixed(1) : null;
  
        centerLabel.text(label);
        centerOverview.text(`Ov: ${overviewPct}%`);
  
        if (regionPct !== null && regionVal !== null) {
          const delta = (+regionPct - +overviewPct).toFixed(1);
          const sign = +delta > 0 ? '+' : '';
          centerRegion.text(`Reg: ${regionPct}% (${sign}${delta}%)`);
        } else {
          centerRegion.text('');
        }
      }
  
      updateCenterText(selectedLabel, selectedValue);
  
      const overviewArcs = svgSelection.selectAll('.arc-inner')
        .data(pie(overviewDataArray))
        .enter()
        .append('g')
        .attr('class', 'arc-inner');
  
      overviewArcs.append('path')
        .attr('fill', d => color(d.data.label))
        .attr('d', arcInner)
        .transition()
        .duration(1000)
        .attrTween('d', function (d) {
          const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return function (t) {
            const interpolated = i(t);
            return arcInner({ ...d, startAngle: interpolated.startAngle, endAngle: interpolated.endAngle })!;
          };
        });
  
      overviewArcs.select('path')
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('d', d3.arc().innerRadius(radius * 0.5).outerRadius(radius * 0.77));
          showTooltip(event, d, totalOverview);
        })
        .on('mousemove', (event) => {
          const wrapperRect = (tooltip.parentElement as HTMLElement).getBoundingClientRect();
          tooltip.style.left = (event.clientX - wrapperRect.left + 10) + 'px';
          tooltip.style.top = (event.clientY - wrapperRect.top - 30) + 'px';
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget).transition().duration(200).attr('d', arcInner);
          hideTooltip();
        })
        .on('click', (event, d) => {
          selectedLabel = d.data.label;
          selectedValue = d.data.value;
          updateCenterText(selectedLabel, selectedValue);
        });
  
      if (summaryData.region) {
        const regionDataArray = objToArray(summaryData.region);
        const totalRegion = d3.sum(regionDataArray, d => d.value);
  
        const regionArcs = svgSelection.selectAll('.arc-outer')
          .data(pie(regionDataArray))
          .enter()
          .append('g')
          .attr('class', 'arc-outer');
  
        regionArcs.append('path')
          .attr('fill', d => color(d.data.label))
          .attr('d', arcOuter)
          .transition()
          .duration(1000)
          .attrTween('d', function (d) {
            const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
            return function (t) {
              const interpolated = i(t);
              return arcOuter({ ...d, startAngle: interpolated.startAngle, endAngle: interpolated.endAngle })!;
            };
          });
  
        regionArcs.select('path')
          .on('mouseover', (event, d) => {
            d3.select(event.currentTarget)
              .transition()
              .duration(200)
              .attr('d', d3.arc().innerRadius(radius * 0.75).outerRadius(radius * 1.05));
            showTooltip(event, d, totalRegion);
          })
          .on('mousemove', (event) => {
            const wrapperRect = (tooltip.parentElement as HTMLElement).getBoundingClientRect();
            tooltip.style.left = (event.clientX - wrapperRect.left + 10) + 'px';
            tooltip.style.top = (event.clientY - wrapperRect.top - 30) + 'px';
          })
          .on('mouseout', (event) => {
            d3.select(event.currentTarget).transition().duration(200).attr('d', arcOuter);
            hideTooltip();
          })
          .on('click', (event, d) => {
            selectedLabel = d.data.label;
            selectedValue = d.data.value;
            updateCenterText(selectedLabel, selectedValue);
          });
      }
    }
  </script>
  
  <style>
    .wrapper {
      position: relative;
      width: 300px;
    }
  
    .tooltip {
      position: absolute;
      background-color: white;
      border: 1px solid #ccc;
      padding: 6px 10px;
      font-size: 0.9rem;
      pointer-events: none;
      border-radius: 4px;
      box-shadow: 0 0 6px rgba(0,0,0,0.15);
      opacity: 0;
      transition: opacity 0.3s ease;
      user-select: none;
      white-space: nowrap;
      z-index: 10;
    }
  
    .legend {
  display: flex;
  overflow-x: auto;
  padding: 4px 0;
  border-top: 1px solid #ddd;
  margin-top: 12px;
  font-size: 0.75rem;
  color: #666;
  user-select: none;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-right: 10px;
  white-space: nowrap;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 6px;
  flex-shrink: 0;
}
  </style>
  
  <div class="wrapper">
    <div class="donut-container">
      <svg bind:this={svg}></svg>
    </div>
  
    <div class="tooltip" bind:this={tooltip}></div>
  
    <div class="legend">
      {#each allLabels as label}
        <div class="legend-item">
          <div class="legend-color" style="background-color: {color(label)}"></div>
          {label}
        </div>
      {/each}
    </div>
  </div>
    