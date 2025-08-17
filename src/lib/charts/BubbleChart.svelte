<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { writable } from "svelte/store";

  export let data: {
    label: string;
    avg_x: number;
    avg_y: number;
    count: number;
  }[] = [];

  export let xLabel: string = "Average Price (€)";
  export let yLabel: string = "Average Rating";

  let svg: SVGSVGElement;
  let tooltip: HTMLDivElement;

  const selectedNeighborhood = writable<string | null>(null);
  let selectedLabel: string | null = null;

  // Responsive dimensions
  // let width = 600;
  // let height = 400;
  let width: number;
  let height: number;

  const margin = { top: 30, right: 30, bottom: 60, left: 60 };

  // Store data to draw (selected + neighbors or full)
  let displayedData = data;

  // Find similar neighborhoods by Euclidean distance (x,y)
  function findSimilarNeighborhoods(selected, allData, topN = 5) {
    return allData
      .map((d) => ({
        ...d,
        distance: Math.sqrt(
          (d.avg_x - selected.avg_x) ** 2 + (d.avg_y - selected.avg_y) ** 2,
        ),
      }))
      .filter((d) => d.label !== selected.label)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, topN);
  }

  function updateDisplayedData(label: string | null) {
    if (!label) {
      displayedData = data;
      selectedLabel = null;
    } else {
      const selected = data.find((d) => d.label === label);
      if (selected) {
        selectedLabel = label;
        const neighbors = findSimilarNeighborhoods(selected, data);
        displayedData = [selected, ...neighbors];
      }
    }
    drawChart();
  }

  function onBubbleClick(label: string) {
    selectedNeighborhood.update((cur) => (cur === label ? null : label));
  }

  function showTooltip(event: MouseEvent, d) {
    const containerRect = svg.getBoundingClientRect();
    tooltip.style.display = "block";
    tooltip.style.left = event.clientX - containerRect.left + 10 + "px";
    tooltip.style.top = event.clientY - containerRect.top + 35 + "px";
    tooltip.innerHTML = `
        <strong>${d.label}</strong><br/>
        ${xLabel}: ${d.avg_x.toFixed(2)}<br/>
        ${yLabel}: ${d.avg_y.toFixed(2)}<br/>
        Listings: ${d.count}
      `;
  }

  function hideTooltip() {
    tooltip.style.display = "none";
  }

  // Redraw chart on mount and when data or selection changes
  $: updateDisplayedData($selectedNeighborhood);

  // Handle window resize to update width/height responsively
  function resize() {
    const container = svg.parentElement;
    if (container) {
      width = container.clientWidth;
      height = container.clientHeight;
      drawChart();
    }
  }

  onMount(() => {
    window.addEventListener("resize", resize);
    resize();
    return () => window.removeEventListener("resize", resize);
  });

  function drawChart() {
    if (!svg || !displayedData.length) return;
    d3.select(svg).selectAll("*").remove();

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.avg_x) as [number, number])
      .nice()
      .range([0, chartWidth]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.avg_y) as [number, number])
      .nice()
      .range([chartHeight, 0]);

    const r = d3
      .scaleSqrt()
      .domain([0, d3.max(data, (d) => d.count) || 1])
      .range([6, 30]);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const chart = d3
      .select(svg)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Axes
    chart
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x));

    chart
      .append("text")
      .attr("x", chartWidth / 2)
      .attr("y", chartHeight + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text(xLabel);

    chart.append("g").call(d3.axisLeft(y).ticks(5));

    chart
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -chartHeight / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text(yLabel);

    // Prepare nodes with initial positions and radius for simulation
    const nodes = displayedData.map((d) => ({
      ...d,
      x: x(d.avg_x),
      y: y(d.avg_y),
      r: r(d.count),
    }));

    // Create simulation for collision avoidance
    const simulation = d3
      .forceSimulation(nodes)
      .force("x", d3.forceX((d) => d.x).strength(0.8))
      .force("y", d3.forceY((d) => d.y).strength(0.8))
      .force(
        "collide",
        d3.forceCollide((d) => d.r + 2),
      )
      .stop();

    // Run simulation for fixed iterations to stabilize layout
    for (let i = 0; i < 120; i++) simulation.tick();

    // Draw all bubbles faded (background)
    chart
      .selectAll("circle.background")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "background")
      .attr("cx", (d) => x(d.avg_x))
      .attr("cy", (d) => y(d.avg_y))
      .attr("r", (d) => r(d.count))
      .style("fill", "#ccc")
      .style("opacity", 0.2);

    // Draw foreground bubbles with updated positions from simulation
    chart
      .selectAll("circle.foreground")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("class", "foreground")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => (d.label === selectedLabel ? d.r * 1.3 : d.r))
      .style("fill", (_, i) => color(String(i)))
      .style("stroke", (d) => (d.label === selectedLabel ? "#000" : "none"))
      .style("stroke-width", (d) => (d.label === selectedLabel ? 2 : 0))
      .style("opacity", 0.9)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        onBubbleClick(d.label);
      })
      .on("mouseenter", (event, d) => showTooltip(event, d))
      .on("mousemove", (event) => {
        const containerRect = svg.getBoundingClientRect();
        tooltip.style.left = event.clientX - containerRect.left + 10 + "px";
        tooltip.style.top = event.clientY - containerRect.top + 35 + "px";
      })
      .on("mouseleave", hideTooltip);
  }
</script>

<div class="chart-container">
  <svg bind:this={svg}></svg>
  <div
    bind:this={tooltip}
    class="tooltip"
    style="position: absolute; pointer-events: none; background: white; border: 1px solid #ccc; padding: 0.5rem; border-radius: 4px; font-size: 0.9rem; display: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15);"
  ></div>
</div>

<style>
  svg {
    font-family: system-ui, sans-serif;
    display: block;
    width: 90%;
    height: 100%; /* use 100% of container height */
  }

  .chart-container {
    width: 100%; /* full width of tile */
    height: 410px; /* tile height */
    position: relative;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
  }

  text {
    fill: #333;
  }

  button {
    font-family: system-ui, sans-serif;
    transition:
      background-color 0.3s ease,
      color 0.3s ease;
  }

  button:hover {
    background-color: #005fa3;
    color: white;
  }
</style>
