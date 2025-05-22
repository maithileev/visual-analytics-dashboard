<script lang="ts">
    import { onMount } from 'svelte';
    import { select } from 'd3-selection';
    import { scaleTime, scaleLinear } from 'd3-scale';
    import { axisBottom, axisLeft } from 'd3-axis';
    import { line } from 'd3-shape';
    import { extent } from 'd3-array';
  
    // Get the data from the load function
    export let data: any;
  
    // Convert CSV data to usable format
    let points = (data.parsedCSV.data as any[])
      .map((row) => ({
        date: new Date(row.Timestamp),
        value: parseFloat(row.temp_min)
      }))
      .filter(d => !isNaN(d.date.getTime()) && !isNaN(d.value));
  
    let svg: SVGSVGElement | null = null;
  
    const width = 700;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  
    onMount(() => {
      if (!svg || !points.length) return;
  
      const svgEl = select(svg);

      // Scales
      const x = scaleTime()
        .domain(extent(points, d => d.date) as [Date, Date])
        .range([margin.left, width - margin.right]);
  
      const y = scaleLinear()
        .domain(extent(points, d => d.value) as [number, number])
        .range([height - margin.bottom, margin.top]);
  
      // X and Y Axes
      svgEl.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(axisBottom(x));
  
      svgEl.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(axisLeft(y));
  
      // Line generation
      const lineGen = line<any>()
        .x(d => x(d.date))
        .y(d => y(d.value));
  
      svgEl.append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('d', lineGen);
    });
  </script>
  
  <h2>Minimum Daily Temperature</h2>
  <svg bind:this={svg} width={width} height={height}></svg>
  
  