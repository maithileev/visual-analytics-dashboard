
<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import type { RawMetrics, NormalizedMetrics } from '$lib/utils/radarNormalization';

  interface RadarData {
    rawMetrics: RawMetrics;
    normalized: NormalizedMetrics;
  }

  export let overallData: RadarData;
  export let neighborhoodNormalized: NormalizedMetrics | null = null;
  export let neighborhoodRawMetrics: RawMetrics | null = null;
  let svgElement: SVGSVGElement;

  const keys = ["roi", "occupancyRate", "minNights", "reviewCount", "rating"];
  const width = 450;
  const height = 450;
  const margin = 50;
  const radius = Math.min(width, height) / 2 - margin;
  const MIN_VISUAL_RADIUS = 0.08; 

  const colors = { overall: "indigo", selected: "orange" };
  const safeValue = (val: any) => (typeof val === "number" && !isNaN(val) ? val : 0);

  function radialPoint(value: number, angle: number) {
    return [
      radius * value * Math.cos(angle - Math.PI / 2),
      radius * value * Math.sin(angle - Math.PI / 2),
    ];
  }

  function formatLabel(key: string) {
    return (
      key.charAt(0).toUpperCase() +
      key.slice(1).replace(/([A-Z])/g, " $1").trim()
    );
  }

  function formatValue(key: string, value: number) {
    switch (key) {
      case "rating":
        return value.toFixed(2);
      case "minNights":
      case "reviewCount":
        return value.toFixed(0);
      case "occupancyRate":
      case "roi":
        return value.toFixed(2) + "%";
      default:
        return value;
    }
  }

  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;

  $: if (svgElement) svg = d3.select(svgElement);

  onMount(() => {
    tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0,0,0,0.75)")
      .style("color", "#fff")
      .style("padding", "6px 10px")
      .style("border-radius", "4px")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("visibility", "hidden");
  });

  $: if (svg && overallData) {
    drawChart(overallData, neighborhoodNormalized, neighborhoodRawMetrics);
  }

  function drawChart(
    overallData: RadarData,
    neighborhoodNormalized: NormalizedMetrics | null,
    neighborhoodRawMetrics: RawMetrics | null
  ) {
    if (!svg) return;
    svg.selectAll("*").remove();

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const angleScale = d3
      .scaleBand<string>()
      .domain(keys)
      .range([0, 2 * Math.PI])
      .paddingInner(0.1);

    // Draw levels
    const levels = 5;
    const maxPercent = 80;
    for (let level = 1; level <= levels; level++) {
      const r = (radius / levels) * level;
      g.append("circle").attr("r", r).attr("fill", "none").attr("stroke", "#ccc").attr("stroke-dasharray", "3 3");
      g.append("text").attr("x", 5).attr("y", -r).attr("font-size", "11px").attr("fill", "#666")
        .text(`${((level * maxPercent) / levels).toFixed(0)}%`);
    }

    keys.forEach((key) => {
      const angle = angleScale(key) ?? 0;
      const [x, y] = radialPoint(1, angle);
      g.append("line").attr("x1", 0).attr("y1", 0).attr("x2", x).attr("y2", y).attr("stroke", "#999");
      const [lx, ly] = radialPoint(1.1, angle);
      g.append("text").attr("x", lx).attr("y", ly).attr("text-anchor", "middle").attr("font-size", "13px").attr("fill", "#333")
        .text(formatLabel(key));
    });

    const overallPoints = keys.map((key) => ({
      key,
      value: Math.max(safeValue(overallData.normalized[key]), MIN_VISUAL_RADIUS),
      rawValue: safeValue(overallData.rawMetrics[key]),
    }));

    const selectedPoints =
  neighborhoodNormalized && Object.keys(neighborhoodNormalized).some(key => safeValue(neighborhoodNormalized[key]) > 0)
    ? keys.map((key) => ({
        key,
        value: Math.max(safeValue(neighborhoodNormalized[key]), MIN_VISUAL_RADIUS),
        rawValue: neighborhoodRawMetrics ? safeValue(neighborhoodRawMetrics[key]) : 0,
      }))
    : null;

    const lineGenerator = d3.lineRadial<{ key: string; value: number }>()
      .radius((d) => d.value * radius)
      .angle((d) => angleScale(d.key) ?? 0)
      .curve(d3.curveLinearClosed);

    g.append("path").datum(overallPoints).attr("d", lineGenerator)
      .attr("fill", colors.overall).attr("fill-opacity", 0.3)
      .attr("stroke", colors.overall).attr("stroke-width", 2);

    if (selectedPoints) {
      g.append("path").datum(selectedPoints).attr("d", lineGenerator)
        .attr("fill", colors.selected).attr("fill-opacity", 0.4)
        .attr("stroke", colors.selected).attr("stroke-width", 2);
    }

    const drawPoints = (points: typeof overallPoints, isSelected: boolean) => {
      g.selectAll(isSelected ? ".selected-point" : ".overall-point")
        .data(points)
        .enter()
        .append("circle")
        .attr("class", isSelected ? "selected-point" : "overall-point")
        .attr("cx", (d) => radialPoint(d.value, angleScale(d.key) ?? 0)[0])
        .attr("cy", (d) => radialPoint(d.value, angleScale(d.key) ?? 0)[1])
        .attr("r", 8)
        .attr("fill", isSelected ? colors.selected : colors.overall)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .on("mouseover", (event, d) => {
          let otherVal = "";
          if (isSelected && overallPoints) {
            const ov = overallPoints.find((p) => p.key === d.key);
            if (ov) otherVal = `<br/><strong>${formatLabel(ov.key)} (Overall):</strong> ${formatValue(ov.key, ov.rawValue)}`;
          }
          if (!isSelected && selectedPoints) {
            const sel = selectedPoints.find((p) => p.key === d.key);
            if (sel) otherVal = `<br/><strong>${formatLabel(sel.key)} (Selected):</strong> ${formatValue(sel.key, sel.rawValue)}`;
          }
          tooltip.style("visibility", "visible")
            .html(`<strong>${formatLabel(d.key)} (${isSelected ? 'Selected' : 'Overall'}):</strong> ${formatValue(d.key, d.rawValue)}${otherVal}`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mousemove", (event) => tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 28 + "px"))
        .on("mouseout", () => tooltip.style("visibility", "hidden"));
    };

    drawPoints(overallPoints, false);
    if (selectedPoints) drawPoints(selectedPoints, true);

    const legend = svg.append("g").attr("transform", `translate(${margin}, ${margin})`);
    const legendData = [{ label: "Overall", color: colors.overall }, { label: "Selected Neighborhood", color: colors.selected }];
    legendData.forEach((d, i) => {
      legend.append("rect").attr("x", 0).attr("y", i * 20).attr("width", 12).attr("height", 12).attr("fill", d.color).attr("opacity", 0.7);
      legend.append("text").attr("x", 20).attr("y", i * 20 + 10).attr("font-size", "12px").attr("fill", "#333").text(d.label);
    });
  }
</script>

<svg bind:this={svgElement}></svg>

<style>
  .tooltip { position: absolute; pointer-events: none; background: rgba(0,0,0,0.75); color: white; padding: 6px 10px; border-radius: 4px; font-size: 13px; visibility: hidden; z-index: 1000; }

  @keyframes pulse { 0% { stroke-opacity: 0.7; r: 14; stroke-width: 3; } 50% { stroke-opacity: 0.1; r: 18; stroke-width: 1; } 100% { stroke-opacity: 0.7; r: 14; stroke-width: 3; } }
  .pulse-ring { animation: pulse 2s infinite; transform-origin: center; }
</style>
