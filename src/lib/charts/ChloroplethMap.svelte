<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";

  export let geojson: any;
  export let metricData: Record<string, number>; // avgRevenue per neighborhood

  let svg: SVGSVGElement;

  const width = 600;
  const height = 500;
  const margin = 20;

  onMount(() => {
    drawMap();
  });

  function drawMap() {
    if (!geojson || !svg) return;

    d3.select(svg).selectAll("*").remove();

    const projection = d3.geoMercator().fitSize([width, height], geojson);
    const path = d3.geoPath().projection(projection);

    const values = Object.values(metricData);
    const color = d3
      .scaleSequential(d3.interpolateYlGnBu)
      .domain([d3.min(values) || 0, d3.max(values) || 1]);

    const chart = d3
      .select(svg)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin},${margin})`);

    chart
      .selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", (d: any) => {
        const name = d.properties.neighbourhood;
        const val = metricData[name];
        return val ? color(val) : "#ccc";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.7)
      .on("mouseenter", function (event, d: any) {
        const name = d.properties.neighbourhood;
        const val = metricData[name] || "No data";
        d3.select(this).attr("stroke-width", 1.5);
        d3.select("#tooltip")
          .style("display", "block")
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + 10 + "px")
          .html(`<strong>${name}</strong><br/>Avg Revenue: $${val}`);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke-width", 0.7);
        d3.select("#tooltip").style("display", "none");
      });

    // Legend
    const legendWidth = 200;
    const legendHeight = 10;

    const defs = d3.select(svg).append("defs");

    const linearGradient = defs
      .append("linearGradient")
      .attr("id", "legend-gradient");

    linearGradient
      .selectAll("stop")
      .data(d3.ticks(0, 1, 10))
      .enter()
      .append("stop")
      .attr("offset", (d) => `${d * 100}%`)
      .attr("stop-color", (d) =>
        color(
          d3.interpolateNumber(d3.min(values) || 0, d3.max(values) || 1)(d),
        ),
      );

    const legendGroup = d3
      .select(svg)
      .append("g")
      .attr(
        "transform",
        `translate(${width / 2 - legendWidth / 2}, ${height - 30})`,
      );

    legendGroup
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)")
      .style("stroke", "#ccc");

    const legendScale = d3
      .scaleLinear()
      .domain([d3.min(values) || 0, d3.max(values) || 1])
      .range([0, legendWidth]);

    legendGroup
      .append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(
        d3
          .axisBottom(legendScale)
          .ticks(5)
          .tickFormat((d) => `€${Math.round(d as number)}`),
      )
      .select(".domain")
      .remove();
  }
</script>

<svg bind:this={svg}></svg>
<div
  id="tooltip"
  style="
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  padding: 0.5rem;
  border-radius: 4px;
  pointer-events: none;
  display: none;
  font-size: 0.9rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);"
></div>

<style>
  svg {
    border-radius: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    background: white;
    display: block;
    margin: auto;
  }

  svg text {
  font-size: 12px;
  fill: #333;
}

</style>
