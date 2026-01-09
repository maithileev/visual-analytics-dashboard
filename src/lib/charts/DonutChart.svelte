<script lang="ts">
  import * as d3 from "d3";
  import { afterUpdate } from "svelte";

  export let summaryData: {
    overview: Record<string, number>;
    region?: Record<string, number>;
  };
  export let label: string = "License Summary";

  let svg: SVGSVGElement;
  let tooltip: HTMLDivElement;

  let allLabels: string[] = [];
  let color: d3.ScaleOrdinal<string, string>;

  let selectedLabel: string | null = null;
  let selectedValue: number | null = null;

  let needsRedraw = true;
  let centerPercent = 0;

  $: if (summaryData && summaryData.overview) needsRedraw = true;

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
    if (tooltip) tooltip.style.opacity = "0";
  }

  function showTooltip(
    event: MouseEvent,
    d: d3.PieArcDatum<{ label: string; value: number }>,
    total: number,
  ) {
    if (!tooltip) return;

    const percent = ((d.data.value / total) * 100).toFixed(1);
    tooltip.style.opacity = "1";
    tooltip.innerHTML = `<strong>${d.data.label}</strong>: ${percent}% (${d.data.value})`;

    const wrapperRect = (
      tooltip.parentElement as HTMLElement
    ).getBoundingClientRect();
    tooltip.style.left = event.clientX - wrapperRect.left + 10 + "px";
    tooltip.style.top = event.clientY - wrapperRect.top - 30 + "px";
  }

  function updateCenterPercent(isRegion:boolean, selectedLabel:'Has License') {
    const source =
      isRegion && summaryData.region
        ? summaryData.region
        : summaryData.overview;
    const total = d3.sum(Object.values(source));
    const value = source[selectedLabel] ?? 0;
    centerPercent = total ? (value / total) * 100 : 0;
  }

  function drawChart() {
    const width = 300;
    const height = 130;
    const radius = Math.min(width / 2, height * 0.7) * 1.1;

    d3.select(svg).selectAll("*").remove();

    allLabels = Array.from(
      new Set([
        ...Object.keys(summaryData.overview),
        ...(summaryData.region ? Object.keys(summaryData.region) : []),
      ]),
    );

    color = d3
      .scaleOrdinal<string>()
      .domain(allLabels)
      .range(d3.schemeCategory10.concat(d3.schemeCategory10));

    const svgSelection = d3
      .select(svg)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "Half-donut chart")
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height * 0.75})`);

    const pie = d3
      .pie<{ label: string; value: number }>()
      .sort(null)
      .value((d) => d.value)
      .startAngle(-0.5 * Math.PI)
      .endAngle(0.5 * Math.PI)
      .padAngle(0.02);

    const arcInner = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.65);

    const arcOuter = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(radius * 0.75)
      .outerRadius(radius * 0.9);

    const overviewDataArray = objToArray(summaryData.overview);
    const totalOverview = d3.sum(overviewDataArray, (d) => d.value);

    // Default select "Has License"
    const hasLicenseObj = overviewDataArray.find(
      (d) => d.label === "Has License",
    );
    if (!selectedLabel && hasLicenseObj) {
      selectedLabel = hasLicenseObj.label;
      selectedValue = hasLicenseObj.value;
    }

    updateCenterPercent(summaryData.region?true:false, "Has License");

    const overviewArcs = svgSelection
      .selectAll(".arc-overview")
      .data(pie(overviewDataArray))
      .enter()
      .append("g")
      .attr("class", "arc-inner");

    overviewArcs
      .append("path")
      .attr("fill", (d) => color(d.data.label))
      .attr("d", arcOuter)
      .transition()
      .duration(1000)
      .attrTween("d", function (d) {
        const i = d3.interpolate({ startAngle: Math.PI, endAngle: Math.PI }, d);
        return (t) => {
          const interpolated = i(t);
          return arcInner({
            ...d,
            startAngle: interpolated.startAngle,
            endAngle: interpolated.endAngle,
          })!;
        };
      });

    overviewArcs
      .select("path")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr(
            "d",
            d3
              .arc()
              .innerRadius(radius * 0.5)
              .outerRadius(radius * 0.77),
          );
        showTooltip(event, d, totalOverview);
      })
      .on("mousemove", (event) => {
        const wrapperRect = (
          tooltip.parentElement as HTMLElement
        ).getBoundingClientRect();
        tooltip.style.left = event.clientX - wrapperRect.left + 10 + "px";
        tooltip.style.top = event.clientY - wrapperRect.top - 30 + "px";
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("d", arcInner);
        hideTooltip();
      })
      .on("click", (event, d) => {
        selectedLabel = d.data.label;
        selectedValue = d.data.value;
        updateCenterPercent(false,selectedLabel);
      });

    // Region arcs
    if (summaryData.region) {
      const regionDataArray = objToArray(summaryData.region).sort(
        (a, b) => allLabels.indexOf(a.label) - allLabels.indexOf(b.label),
      );
      const totalRegion = d3.sum(regionDataArray, (d) => d.value);

      const regionArcs = svgSelection
        .selectAll(".arc-region")
        .data(pie(regionDataArray))
        .enter()
        .append("g")
        .attr("class", "arc-region");

      regionArcs
        .append("path")
        .attr("fill", (d) => color(d.data.label))
        .attr("d", arcInner)
        .transition()
        .duration(1000)
        .attrTween("d", function (d) {
          const i = d3.interpolate(
            { startAngle: Math.PI, endAngle: Math.PI },
            d,
          );
          return (t) => {
            const interpolated = i(t);
            return arcOuter({
              ...d,
              startAngle: interpolated.startAngle,
              endAngle: interpolated.endAngle,
            })!;
          };
        });

      regionArcs
        .select("path")
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr(
              "d",
              d3
                .arc()
                .innerRadius(radius * 0.75)
                .outerRadius(radius * 1.05),
            );
          showTooltip(event, d, totalRegion);
        })
        .on("mousemove", (event) => {
          const wrapperRect = (
            tooltip.parentElement as HTMLElement
          ).getBoundingClientRect();
          tooltip.style.left = event.clientX - wrapperRect.left + 10 + "px";
          tooltip.style.top = event.clientY - wrapperRect.top - 30 + "px";
        })
        .on("mouseout", (event) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr("d", arcOuter);
          hideTooltip();
        })
        .on("click", (event, d) => {
          selectedLabel = d.data.label;
          selectedValue = d.data.value;
          updateCenterPercent(true,selectedLabel);
        });
    }
  }
</script>

<div class="kpi-card">
  <h3 class="kpi-label">{label}</h3>
  <hr />
  <div class="donut-label">
    {selectedLabel}: {centerPercent.toFixed(1)}%
  </div>
  <svg bind:this={svg}></svg>
  <div class="tooltip" bind:this={tooltip}></div>
</div>

<style>
  .kpi-card {
    width: 235px;
    background: white;
    padding: 0.6rem;
    border-radius: 0.8rem;
    box-shadow: 0 4px 10px rgb(0 0 0 / 0.05);
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    color: #222;
    user-select: none;
  }

  .kpi-label {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 0 0.4rem 0;
    text-align: center;
    color: #333;
  }

  .donut-label {
    text-align: right;
    font-size: 0.8rem;
    font-weight: 600;
    color: #1e3a8a;
    margin-bottom: 0.1rem;
  }

  .donut-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin-bottom: 0.1rem;
  }

  hr {
    border: none;
    border-top: 1px solid #ddd;
    margin-bottom: 0.1rem;
  }

  svg {
    display: block;
    margin: 0 auto;
    height: 120px;
    width: 100%;
  }

  .tooltip {
    position: absolute;
    background-color: white;
    border: 1px solid #ccc;
    padding: 6px 10px;
    font-size: 0.9rem;
    pointer-events: none;
    border-radius: 4px;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
    opacity: 0;
    transition: opacity 0.3s ease;
    user-select: none;
    white-space: nowrap;
    z-index: 10;
  }
</style>
