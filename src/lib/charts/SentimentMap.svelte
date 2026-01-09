<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";

  export let geojson: any;
  export let sentimentData: Record<
    string,
    { avg_sentiment: number; review_count: number }
  > = {};
  export let width = 600;
  export let height = 500;
  export let label = "Average Sentiment";

  let svg: SVGSVGElement;
  let tooltipVisible = false;
  let tooltipX = 0;
  let tooltipY = 0;
  let tooltipText = "";

  const colorRange = [
    "#f9fdf0", // soft off-white with a green tint
    "#d9f2cf", // pale mint green
    "#a9ddb5", // muted pastel green
    "#6bbf8e", // light sage green
    "#3d8f6b", // desaturated deep green
  ];

  const containerHeight = 500;
  const headingHeight = 24;
  const paddingVertical = 24;
  const legendHeight = 45;
  const legendRectHeight = 20;
  const legendMargin = { top: 20, left: 20 };
  const legendMarginTop = 10;

  const usableHeight =
    containerHeight -
    headingHeight -
    paddingVertical -
    legendHeight -
    legendMarginTop -
    25;

  function normalizeName(name: string | undefined): string {
    return name
      ? name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase()
      : "";
  }

  $: if (geojson && sentimentData && svg) {
    drawMap();
  }

  function drawMap() {
    d3.select(svg).selectAll("*").remove();

    const values = Object.values(sentimentData).map((d) => d.avg_sentiment);
    const minVal = d3.min(values) ?? 3.5;
    const maxVal = d3.max(values) ?? 5;

    // Threshold-based color scale
    const thresholds = d3.range(
      minVal,
      maxVal,
      (maxVal - minVal) / colorRange.length,
    );
    const colorScale = d3
      .scaleThreshold<number, string>()
      .domain(thresholds)
      .range(colorRange);

    const projection = d3.geoMercator().fitSize([width, usableHeight], geojson);
    const path = d3.geoPath(projection);

    const svgSelection = d3
      .select(svg)
      .attr("width", width)
      .attr("height", height);

    svgSelection
      .selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", (d: any) => {
        const nameRaw = d.properties.neighbourhood;
        const name = normalizeName(nameRaw);
        const sentiment = sentimentData[name];

        if (!sentiment) {
          console.warn("Mismatch:", nameRaw, "→", name, "NOT in sentimentData");
        }

        return sentiment ? colorScale(sentiment.avg_sentiment) : "#eee";
      })
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.8)
      .on("mousemove", (event, d: any) => {
        const raw = d.properties.neighbourhood;
        const norm = normalizeName(raw);
        const sentimentEntry = sentimentData[norm];
        tooltipText = `<strong>${raw || "Unknown"}</strong><br>
            Avg Sentiment: ${sentimentEntry?.avg_sentiment?.toFixed(2) ?? "N/A"}<br>
            Reviews: ${sentimentEntry?.review_count ?? "N/A"}`;
        const tooltipWidth = 150; 
        const tooltipHeight = 40;

        const pageWidth = window.innerWidth;
        const pageHeight = window.innerHeight;

        let x = event.pageX + 10;
        let y = event.pageY - 10;

        if (x + tooltipWidth > pageWidth) x = event.pageX - tooltipWidth - 12;
        if (y + tooltipHeight > pageHeight)
          y = event.pageY - tooltipHeight - 12;

        tooltipX = event.clientX + 10;
        tooltipY = event.clientY - 10;
        tooltipVisible = true;
      })
      .on("mouseout", () => {
        tooltipVisible = false;
      });

    const legendWidth = 200;
    const legendY = usableHeight + legendMargin.top;

    const legendGroup = svgSelection
      .append("g")
      .attr("transform", `translate(${legendMargin.left},${legendY})`);

      const legendScale = d3
      .scaleLinear()
      .domain([minVal, maxVal])
      .range([0, legendWidth]);

      const legendAxis = d3
      .axisBottom(legendScale)
      .ticks(colorRange.length)
      .tickFormat(d3.format(".2f"));

    const defs = svgSelection.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "legend-gradient");

    gradient
      .selectAll("stop")
      .data(colorRange)
      .enter()
      .append("stop")
      .attr("offset", (_, i) => `${(i / (colorRange.length - 1)) * 100}%`)
      .attr("stop-color", (d) => d);

    legendGroup
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendRectHeight)
      .style("fill", "url(#legend-gradient)");

    legendGroup
      .append("g")
      .attr("transform", `translate(0,${legendRectHeight + 6})`)
      .call(legendAxis)
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#333");

    legendGroup
      .append("text")
      .attr("x", 0)
      .attr("y", -6)
      .text(label)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#333");

  //   legendGroup
  //     .append("text")
  //     .attr("x", legendWidth / 2)
  //     .attr("y", legendHeight + 26)
  //     .attr("text-anchor", "middle")
  //     .text("Sentiment Score")
  //     .style("font-size", "11px")
  //     .style("fill", "#333");
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
  }

  .tooltip {
    position: absolute;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10;
    user-select: none;
    line-height: 1.4;
    transition: transform 0.1s ease-out, opacity 0.1s ease-out;
  }
</style>
