<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as d3 from "d3";
  import { selectedNeighborhood } from "$lib/stores/selectedNeighborhood";

  let currentSelected: string | null = null;
  let svg: SVGSVGElement;
  let unsubscribe: () => void;

  export let geojson: any;
  export let values: Record<string, number> = {};
  export let width = 600;
  export let height = 500;
  export let label = "Value";
  export let unit = "";
  export let colorRange: string[] = [
    "#e6f2f8",
    "#a8d0e6",
    "#5ca7c8",
    "#2c6b8f",
    "#1b3e57"
  ];
  export let tooltipFormatter: (val: number) => string = (v) => v.toString();

  let tooltipVisible = false;
  let tooltipX = 0;
  let tooltipY = 0;
  let tooltipText = "";

  let pathGenerator: d3.GeoPath<any, d3.GeoPermissibleObjects>;

  const containerHeight = 500;
  const headingHeight = 24;
  const paddingVertical = 24;
  const legendHeight = 45;
  const legendRectHeight = 20;
  const legendMargin = { top: 20, left: 20 };
  const legendMarginTop = 10;

  function normalizeName(name: string | undefined): string {
    return name ? name.trim().toLowerCase() : "";
  }

  onMount(() => {
    unsubscribe = selectedNeighborhood.subscribe((val) => {
      currentSelected = val ? val.trim().toLowerCase() : null;
      drawMap();
    });
  });

  onDestroy(() => {
    unsubscribe?.();
  });

  // Initial draw and redraw on data changes
  $: if (geojson && values && svg) {
    drawMap();
  }

  function drawMap() {
    if (!svg || !geojson) return;

    d3.select(svg).selectAll("*").remove();

    const usableHeight = containerHeight - headingHeight - paddingVertical - legendHeight - legendMarginTop - 25;

    const projection = d3.geoMercator().fitSize([width, usableHeight], geojson);
    pathGenerator = d3.geoPath(projection);

    const normalizedValues: Record<string, number> = {};
    Object.entries(values).forEach(([key, val]) => {
      normalizedValues[key.trim().toLowerCase()] = val;
    });

    const dataValues = Object.values(normalizedValues);
    const minVal = d3.min(dataValues) ?? 0;
    const maxVal = d3.max(dataValues) ?? 1;

    const colorScale = d3.scaleThreshold<number, string>()
      .domain(d3.range(minVal, maxVal, (maxVal - minVal) / colorRange.length))
      .range(colorRange);

    const svgSelection = d3.select(svg)
      .attr("width", width)
      .attr("height", containerHeight - paddingVertical);

    const g = svgSelection.append("g");

    g.selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", (d: any) => {
        const rawName = d.properties.neighbourhood_cleansed || d.properties.name || d.properties.neighbourhood;
        const name = normalizeName(rawName);
        const val = normalizedValues[name];
        return val !== undefined ? colorScale(val) : "#eee";
      })
      .attr("stroke", (d: any) => {
        const rawName = d.properties.neighbourhood_cleansed || d.properties.name || d.properties.neighbourhood;
        const name = normalizeName(rawName);
        return name === currentSelected ? "#333" : "#999";
      })
      .attr("stroke-width", (d: any) => {
        const rawName = d.properties.neighbourhood_cleansed || d.properties.name || d.properties.neighbourhood;
        const name = normalizeName(rawName);
        return name === currentSelected ? 2 : 0.5;
      })
      .on("mousemove", (event, d: any) => {
        const rawName = d.properties.neighbourhood_cleansed || d.properties.name || d.properties.neighbourhood;
        const name = normalizeName(rawName);
        const val = normalizedValues[name];
        tooltipText = `${rawName} — ${
          val !== undefined ? tooltipFormatter(val) + (unit ? " " + unit : "") : "No data"
        }`;
        tooltipX = event.pageX + 10;
        tooltipY = event.pageY + 10;
        tooltipVisible = true;
      })
      .on("mouseout", () => {
        tooltipVisible = false;
      })
      .on("click", (event, d: any) => {
        const rawName = d.properties.neighbourhood_cleansed || d.properties.name || d.properties.neighbourhood;
        selectedNeighborhood.set(rawName);
      });

    // Legend
    const legendY = usableHeight + legendMargin.top;
    const legendWidth = 200;

    const legend = svgSelection.append("g")
      .attr("transform", `translate(${legendMargin.left},${legendY})`);

    const legendScale = d3.scaleLinear().domain([minVal, maxVal]).range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(colorRange.length).tickFormat(d3.format(".2f"));

    const defs = svgSelection.append("defs");
    const linearGradient = defs.append("linearGradient").attr("id", "legend-gradient");

    linearGradient.selectAll("stop")
      .data(colorRange)
      .enter()
      .append("stop")
      .attr("offset", (_, i) => (i / (colorRange.length - 1)) * 100 + "%")
      .attr("stop-color", (d) => d);

    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendRectHeight)
      .style("fill", "url(#legend-gradient)");

    legend.append("g")
      .attr("transform", `translate(0,${legendRectHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#333");

    legend.append("text")
      .attr("x", 0)
      .attr("y", -6)
      .text(label)
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#333");
  }
</script>

<svg bind:this={svg}></svg>

{#if tooltipVisible}
  <div class="tooltip" style="top: {tooltipY}px; left: {tooltipX}px;">
    {@html tooltipText}
  </div>
{/if}

<style>
  svg {
    width: 100%;
    height: 100%;
    display: block;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  }

  .tooltip {
    position: absolute;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 5px 8px;
    border-radius: 3px;
    font-size: 12px;
    z-index: 10;
    user-select: none;
  }
</style>
