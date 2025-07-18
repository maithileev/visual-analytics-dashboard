<!-- 
   <script lang="ts">
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
  
    export let data: { [key: string]: string | number }[] = [];
    export let labelField: string = 'label';
    export let overallField: string = 'overall';
    export let compareField: string | null = null; // null means no overlay
    export let colors: string[] = d3.schemeSet2;
    export let valueFormatter: (value: number) => string = (v) => v.toFixed(0);
  
    let svg: SVGSVGElement;
  
    onMount(() => drawChart());
    $: if (data && svg) drawChart();
  
    function drawChart() {
      if (!svg || !data.length) return;
  
      const margin = { top: 30, right: 60, bottom: 10, left: 120 };
      const barHeight = 40; // Increased bar height from 30 to 40
      const height = data.length * (barHeight + 15); // Increased vertical spacing for clarity
      const width = 450; // Slightly wider
  
      d3.select(svg).selectAll('*').remove();
      const svgSelection = d3
        .select(svg)
        .attr('width', width)
        .attr('height', height + margin.top + margin.bottom);
  
      const chart = svgSelection.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
      const hasCompareData = compareField && compareField !== overallField;
  
      const y = d3
        .scaleBand()
        .domain(data.map(d => d[labelField] as string))
        .range([0, height])
        .padding(0.25); // Slightly more padding between bars
  
      if (!hasCompareData) {
        // Simple bars without grey background
  
        const x = d3
          .scaleLinear()
          .domain([0, d3.max(data, d => +d[overallField]) || 0])
          .range([0, width - margin.left - margin.right]);
  
        chart.selectAll('rect')
          .data(data)
          .enter()
          .append('rect')
          .attr('y', d => y(d[labelField] as string)!)
          .attr('x', 0)
          .attr('height', y.bandwidth())
          .attr('width', 0)
          .attr('fill', (d, i) => colors[i % colors.length])
          .transition()
          .duration(800)
          .attr('width', d => x(+d[overallField]));
  
      //   chart.selectAll('text.value')
      //     .data(data)
      //     .enter()
      //     .append('text')
      //     .attr('class', 'value')
      //     .attr('x', d => x(+d[overallField]) + 8)
      //     .attr('y', d => (y(d[labelField] as string) || 0) + y.bandwidth() / 2 + 6)
      //     .text(d => {  
      //       const overall = valueFormatter(+d[overallField]);
      //       const compare = valueFormatter(+d[compareField!]);
      //       return `Overall: ${overall} | Selected: ${compare}`;
      //     })
      //     .style('font-size', '14px')
      //     .style('fill', '#333');
      // } else {
      //   // Stacked bars with grey background for overall and colored compare overlay
  
      //   const x = d3
      //     .scaleLinear()
      //     .domain([0, d3.max(data, d => (+d[overallField] || 0)) || 0])
      //     .range([0, width - margin.left - margin.right]);
  

      chart.selectAll('text.value')
  .data(data)
  .enter()
  .append('text')
  .attr('class', 'value')
  .attr('x', d => {
    const hasCompare = compareField && d[compareField!] !== undefined;
    const value = hasCompare ? +d[compareField!] : +d[overallField];
    return x(value) + 8;
  })
  .attr('y', d => (y(d[labelField] as string) || 0) + y.bandwidth() / 2 + 6)
  .text(d => {
    const hasCompare = compareField && d[compareField!] !== undefined;
    const overall = valueFormatter(+d[overallField]);
    if (hasCompare) {
      const compare = valueFormatter(+d[compareField!]);
      return `Overall: ${overall} | Selected: ${compare}`;
    } else {
      return overall;
    }
  })
  .style('font-size', '14px')
  .style('fill', '#333');

        // Grey bars for overall
        chart.selectAll('rect.overall')
          .data(data)
          .enter()
          .append('rect')
          .attr('class', 'overall')
          .attr('y', d => y(d[labelField] as string)!)
          .attr('x', 0)
          .attr('height', y.bandwidth())
          .attr('width', 0)
          .attr('fill', '#d3d3d3')
          .transition()
          .duration(800)
          .attr('width', d => x(+d[overallField]));
  
        // Colored bars for compare (overlay)
        chart.selectAll('rect.compare')
          .data(data)
          .enter()
          .append('rect')
          .attr('class', 'compare')
          .attr('y', d => y(d[labelField] as string)!)
          .attr('x', 0)
          .attr('height', y.bandwidth())
          .attr('width', 0)
          .attr('fill', (d, i) => colors[i % colors.length])
          .transition()
          .duration(800)
          .attr('width', d => x(+d[compareField!]));
  
        chart.selectAll('text.value')
          .data(data)
          .enter()
          .append('text')
          .attr('class', 'value')
          .attr('x', d => x(+d[compareField!]) + 8)
          .attr('y', d => (y(d[labelField] as string) || 0) + y.bandwidth() / 2 + 6)
          .text(d => valueFormatter(+d[compareField!]))
          .style('font-size', '14px')
          .style('fill', '#333');
      }
  
      chart.append('g')
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll('text')
        .style('font-size', '14px')
        .style('fill', '#333');
  
      chart.select('.domain').remove();
    }
  </script>
  
  <style>
    svg {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      overflow: visible;
    }
  
    rect {
      transition: fill 0.3s ease;
      cursor: pointer;
    }
  
    rect:hover {
      opacity: 0.85;
    }
  
    text.value {
      fill: #333;
      font-weight: 600;
    }
  </style>
  
  <svg bind:this={svg}></svg>
    
   -->



   <script lang="ts">
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
  
    export let data: { [key: string]: string | number }[] = [];
    export let labelField: string = 'label';
    export let overallField: string = 'overall';
    export let compareField: string | null = null; // null means no overlay
    export let colors: string[] = d3.schemeSet2;
    export let valueFormatter: (value: number) => string = (v) => v.toFixed(0);
  
    let svg: SVGSVGElement;
  
    onMount(() => drawChart());
    $: if (data && svg) drawChart();
  
    function drawChart() {
      if (!svg || !data.length) return;
  
      const margin = { top: 30, right: 60, bottom: 10, left: 120 };
      const barHeight = 40;
      const height = data.length * (barHeight + 15);
      const width = 450;
  
      d3.select(svg).selectAll('*').remove();
      const svgSelection = d3
        .select(svg)
        .attr('width', width)
        .attr('height', height + margin.top + margin.bottom);
  
      const chart = svgSelection.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
  
      const y = d3.scaleBand()
        .domain(data.map(d => d[labelField] as string))
        .range([0, height])
        .padding(0.25);
  
      const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(+d[overallField] || 0, +d[compareField!] || 0)) || 0])
        .range([0, width - margin.left - margin.right]);
  
      const hasCompareData = compareField && data.some(d => d[compareField!] !== undefined && d[compareField!] !== null);
  
      if (hasCompareData) {
        // Grey bars for overall
        chart.selectAll('rect.overall')
          .data(data)
          .enter()
          .append('rect')
          .attr('class', 'overall')
          .attr('y', d => y(d[labelField] as string)!)
          .attr('x', 0)
          .attr('height', y.bandwidth())
          .attr('width', 0)
          .attr('fill', '#d3d3d3')
          .transition()
          .duration(800)
          .attr('width', d => x(+d[overallField]));
  
        // Colored overlay bars for compare
        chart.selectAll('rect.compare')
          .data(data)
          .enter()
          .append('rect')
          .attr('class', 'compare')
          .attr('y', d => y(d[labelField] as string)!)
          .attr('x', 0)
          .attr('height', y.bandwidth())
          .attr('width', 0)
          .attr('fill', (d, i) => colors[i % colors.length])
          .transition()
          .duration(800)
          .attr('width', d => x(+d[compareField!]));
  
        // Text showing both values
        chart.selectAll('text.value')
          .data(data)
          .enter()
          .append('text')
          .attr('class', 'value')
          .attr('x', d => x(+d[compareField!]) + 8)
          .attr('y', d => (y(d[labelField] as string) || 0) + y.bandwidth() / 2 + 6)
          .text(d => {
            const overall = valueFormatter(+d[overallField]);
            const compare = valueFormatter(+d[compareField!]);
            return `Overall: ${overall} | Selected: ${compare}`;
          })
          .style('font-size', '14px')
          .style('fill', '#333');
  
      } else {
        // Colored bars for overall only
        chart.selectAll('rect')
          .data(data)
          .enter()
          .append('rect')
          .attr('y', d => y(d[labelField] as string)!)
          .attr('x', 0)
          .attr('height', y.bandwidth())
          .attr('width', 0)
          .attr('fill', (d, i) => colors[i % colors.length])
          .transition()
          .duration(800)
          .attr('width', d => x(+d[overallField]));
  
        // Only one value label
        chart.selectAll('text.value')
          .data(data)
          .enter()
          .append('text')
          .attr('class', 'value')
          .attr('x', d => x(+d[overallField]) + 8)
          .attr('y', d => (y(d[labelField] as string) || 0) + y.bandwidth() / 2 + 6)
          .text(d => valueFormatter(+d[overallField]))
          .style('font-size', '14px')
          .style('fill', '#333');
      }
  
      chart.append('g')
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll('text')
        .style('font-size', '14px')
        .style('fill', '#333');
  
      chart.select('.domain').remove();
    }
  </script>
  

  <style>
    svg {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      overflow: visible;
    }
  
    rect {
      transition: fill 0.3s ease;
      cursor: pointer;
    }
  
    rect:hover {
      opacity: 0.85;
    }
  
    text.value {
      fill: #333;
      font-weight: 600;
    }
  </style>
  
  <svg bind:this={svg}></svg>