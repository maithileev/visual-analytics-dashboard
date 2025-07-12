<script lang="ts">
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
  
    export let summaryData: Record<string, number> = {};
    const dataArray = Object.entries(summaryData).map(([label, value]) => ({ label, value }));

    let svg: SVGSVGElement;
    let tooltip: HTMLDivElement;
    let centerText: SVGTextElement;

    let selectedSlice: d3.PieArcDatum<{ label: string; value: number }> | null = null;

    onMount(() => {
      
      if (!dataArray || dataArray.length === 0) return;
  
      const width = 300;
      const height = 300;
      const radius = Math.min(width, height) / 2;
  
      const color = d3.scaleOrdinal(d3.schemeCategory10);
  
      const pie = d3.pie<{ label: string; value: number }>()
        .sort(null)
        .value(d => d.value);
  
      const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
        .innerRadius(radius * 0.6)  // donut thickness
        .outerRadius(radius - 1);
  
      const arcHover = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
        .innerRadius(radius * 0.6)
        .outerRadius(radius + 10);
  
      const total = d3.sum(dataArray, d => d.value);
  
      const svgSelection = d3.select(svg)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('role', 'img')
        .attr('aria-label', 'Donut chart showing data distribution')
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
  
      const arcs = svgSelection.selectAll('arc')
        .data(pie(dataArray))
        .enter()
        .append('g')
        .attr('class', 'arc');
  
        arcs.append('path')
      .attr('fill', (d, i) => color(i.toString()))
      .attr('d', arc)
      .each(function(d) { this._current = d; })  // store initial angles
      .transition()
      .duration(1000)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate(
          { startAngle: 0, endAngle: 0 },
          d
        );
        return function(t) {
          return arc(interpolate(t))!;
        };
      });

    // Add center text element for click display
    const centerGroup = svgSelection.append('g')
      .attr('class', 'center-text');

    centerGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.4em')
      .attr('font-weight', '600')
      .attr('font-size', '1.1rem')
      .attr('fill', '#333')
      .attr('pointer-events', 'none')
      .attr('class', 'center-label')
      .text('');

    centerGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.0em')
      .attr('font-weight', '400')
      .attr('font-size', '0.9rem')
      .attr('fill', '#555')
      .attr('pointer-events', 'none')
      .attr('class', 'center-percent')
      .text('');

    // Tooltip mouse events & hover slice animation
    arcs.select('path')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover);

        const percent = ((d.data.value / total) * 100).toFixed(1);
        tooltip.style.opacity = '1';
        tooltip.innerHTML = `<strong>${d.data.label}</strong>: ${percent}% (${d.data.value})`;
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY - 30) + 'px';
      })
      .on('mousemove', (event) => {
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY - 30) + 'px';
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc);

        tooltip.style.opacity = '0';
      })
      .on('click', function(event, d) {
        // If clicked slice already selected, clear center text
        if (selectedSlice && selectedSlice.data.label === d.data.label) {
          selectedSlice = null;
          centerGroup.select('.center-label').text('');
          centerGroup.select('.center-percent').text('');
          // reset all slices to normal size
          arcs.select('path').transition().duration(200).attr('d', arc);
          return;
        }

        selectedSlice = d;

        // Update center text
        const percent = ((d.data.value / total) * 100).toFixed(1);
        centerGroup.select('.center-label').text(d.data.label);
        centerGroup.select('.center-percent').text(`${percent}%`);

        // Animate clicked slice to hover size, others reset
        arcs.select('path')
          .transition()
          .duration(200)
          .attr('d', function(p) {
            return p.data.label === d.data.label ? arcHover(p) : arc(p);
          });
      });
  });
</script>

<style>
  div.wrapper {
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
      {#each dataArray as item, i}
        <div class="legend-item">
          <div class="legend-color" style="background-color: {d3.schemeCategory10[i]}"></div>
          {item.label} ({item.value})
        </div>
      {/each}
    </div>
</div>
  