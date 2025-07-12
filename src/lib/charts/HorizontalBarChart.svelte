<script lang="ts">
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
  
    export let data: Record<string, number> = {};
  
    let svg: SVGSVGElement;
  
    onMount(() => {
      drawChart();
    });
  
    function drawChart() {
      if (!svg) return;
  
      const chartData = Object.entries(data).map(([label, value]) => ({ label, value }));
      const total = chartData.reduce((sum, d) => sum + d.value, 0);
      const processedData = chartData.map(d => ({
        ...d,
        percent: ((d.value / total) * 100).toFixed(1) + '%'
      }));
  
      const margin = { top: 10, right: 60, bottom: 10, left: 120 };
      const barHeight = 30;
      const height = processedData.length * (barHeight + 10);
      const width = 400;
  
      d3.select(svg).selectAll("*").remove(); // Clear previous chart
  
      const svgSelection = d3
        .select(svg)
        .attr("width", width)
        .attr("height", height + margin.top + margin.bottom);
  
      const chart = svgSelection.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  
      const x = d3
        .scaleLinear()
        .domain([0, d3.max(processedData, d => d.value) || 0])
        .range([0, width - margin.left - margin.right]);
  
      const y = d3
        .scaleBand()
        .domain(processedData.map(d => d.label))
        .range([0, height])
        .padding(0.2);
  
      const colors = d3.schemeSet2;
  
      // Bars
      chart
        .selectAll('rect')
        .data(processedData)
        .enter()
        .append('rect')
        .attr('y', d => y(d.label)!)
        .attr('height', y.bandwidth())
        .attr('x', 0)
        .attr('width', 0) // Start at 0 width
        .attr('fill', (d, i) => colors[i % colors.length])
        .transition()
        .duration(800)
        .delay((d, i) => i * 100) // Optional stagger effect
        .attr('width', d => x(d.value));
  
      // Percent labels
      chart
        .selectAll('text.percent')
        .data(processedData)
        .enter()
        .append('text')
        .attr('class', 'percent')
        .attr('x', d => x(d.value) + 6)
        .attr('y', d => (y(d.label) || 0) + y.bandwidth() / 2 + 4)
        .text(d => d.percent)
        .style('font-size', '12px')
        .style('fill', '#333');
  
      // Y-axis labels
      chart
        .append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", "#333");
  
      chart.select(".domain").remove(); // Remove y-axis
    }
  </script>
  
  <style>
    svg {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      overflow: visible;
    }
  
    .bar {
      transition: fill 0.3s ease;
      cursor: pointer;
    }
  
    .bar:hover {
      opacity: 0.85;
    }
  
    .value {
      fill: #333;
      font-weight: 500;
    }
  </style>
  
  <svg bind:this={svg}></svg>
  