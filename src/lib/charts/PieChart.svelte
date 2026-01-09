<script lang="ts">
  import * as d3 from "d3";

  export let summaryData: {
    overview: Record<string, number>;
    region?: Record<string, number>;
  };

  export let label: string = "Superhost KPI";

  let svg: SVGSVGElement;
  let tooltip: HTMLDivElement;

  let centerLabel = "Superhost";
  let centerPercent = 0;

  const objToArray = (obj: Record<string, number>) =>
    Object.entries(obj).map(([label, value]) => ({ label, value }));

  $: allLabels = Array.from(
    new Set([
      ...Object.keys(summaryData.overview),
      ...(summaryData.region ? Object.keys(summaryData.region) : []),
    ])
  );

  function moveTooltip(event: MouseEvent) {
    const bounds = svg.getBoundingClientRect();
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    let left = event.clientX - bounds.left + 10;
    let top = event.clientY - bounds.top - 30;

    if (left + tooltipWidth > bounds.width) left = bounds.width - tooltipWidth - 4;
    if (left < 0) left = 0;
    if (top < 0) top = 0;

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  }

  $: if (summaryData?.overview) {
    const width = 200;
    const height = 150;
    const radius = Math.min(width, height) / 2 - 12;

    const overviewOuter = radius * 0.7;
    const regionOuter = radius * 0.95;

    d3.select(svg).selectAll("*").remove();

    const svgSelection = d3
      .select(svg)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const color = d3
      .scaleOrdinal<string>()
      .domain(allLabels)
      .range(["#2563eb", "#22c55e"]);

    const pie = d3
      .pie<{ label: string; value: number }>()
      .sort(null)
      .value((d) => d.value);

    const arcOverview = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(0)
      .outerRadius(overviewOuter);

    const arcRegion = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(radius * 0.75)
      .outerRadius(regionOuter);

    const overviewData = objToArray(summaryData.overview);
    const totalOverview = d3.sum(overviewData, (d) => d.value);
    const regionData = summaryData.region ? objToArray(summaryData.region) : null;
    const totalRegion = regionData ? d3.sum(regionData, (d) => d.value) : null;

    function setCenterData(isRegion: boolean) {
      const superhostVal = summaryData.overview["Superhost"] ?? 0;

      if (isRegion && regionData) {
        const regVal = summaryData.region!["Superhost"] ?? 0;
        const totalReg = d3.sum(Object.values(summaryData.region!));
        centerPercent = totalReg ? (regVal / totalReg) * 100 : 0;
      } else {
        centerPercent = totalOverview ? (superhostVal / totalOverview) * 100 : 0;
      }
      centerLabel = "Superhost";
    }

    setCenterData(summaryData.region ? true:false);

    function arcTween(arc: d3.Arc<any, any>, startRadius: number, endRadius: number) {
      return function (d: any) {
        const i = d3.interpolate(startRadius, endRadius);
        return function (t: number) {
          return d3
            .arc<d3.PieArcDatum<{ label: string; value: number }>>()
            .innerRadius(arc.innerRadius() as number)
            .outerRadius(i(t))(d)!;
        };
      };
    }

    function addHoverEffect(selection, arc, baseOuterRadius, expandFactor = 1.05, totalVal?: number, isRegionArc = false) {
      selection
        .on("mouseover", function (event, d) {
          const percent = ((d.data.value / (totalVal ?? 1)) * 100).toFixed(1);
          tooltip.style.opacity = "1";
          tooltip.innerHTML = `<strong>${d.data.label}</strong>: ${percent}% (${d.data.value})`;
          moveTooltip(event);

          d3.select(this)
            .transition()
            .duration(200)
            .attrTween("d", arcTween(arc, baseOuterRadius, baseOuterRadius * expandFactor));
        })
        .on("mousemove", moveTooltip)
        .on("mouseout", function () {
          tooltip.style.opacity = "0";
          d3.select(this)
            .transition()
            .duration(200)
            .attrTween("d", arcTween(arc, baseOuterRadius * expandFactor, baseOuterRadius));
        })
        .on("click", () => {
          setCenterData(isRegionArc);
        });
    }

    const overviewArcs = svgSelection
      .selectAll(".arc-overview")
      .data(pie(overviewData))
      .enter()
      .append("path")
      .attr("class", "arc-segment arc-overview")
      .attr("fill", (d) => color(d.data.label))
      .attr("d", arcOverview)
      .style("cursor", "pointer");

    addHoverEffect(overviewArcs, arcOverview, overviewOuter, 1.05, totalOverview, false);

    if (regionData) {
      const regionArcs = svgSelection
        .selectAll(".arc-region")
        .data(pie(regionData))
        .enter()
        .append("path")
        .attr("class", "arc-segment arc-region")
        .attr("fill", (d) => color(d.data.label))
        .attr("d", arcRegion)
        .style("cursor", "pointer");

      addHoverEffect(regionArcs, arcRegion, regionOuter, 1.03, totalRegion, true);
    }
  }
</script>

<!-- <div class="kpi-card">
  <h3 class="kpi-label">{label}</h3>
  <hr />
  <svg bind:this={svg}></svg>
  <div class="tooltip" bind:this={tooltip}></div>
  <div class="center-info">
    {centerLabel}: {centerPercent.toFixed(1)}%
  </div>
</div> -->
<div class="kpi-card">
  <h3 class="kpi-label">{label}</h3>
  <hr />
  <div class="donut-label">
    Superhost: {centerPercent.toFixed(1)}%
  </div>
  <svg bind:this={svg}></svg>
  <div class="tooltip" bind:this={tooltip}></div>
</div>

<style>
  .kpi-card {
    width: 235px;
    background: white;
    padding: 0.4rem 0.6rem;
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
    color: #333;
    text-align: center;
  }

  svg {
    display: block;
    margin: 0 auto;
    height: 125px;
    width: auto;   
  }

  hr {
    border: none;
    border-top: 1px solid #ddd;
    margin: 0.2rem 0;
  }

  .center-info {
    display: block;
    text-align: center;
    font-weight: 600;
    color: #000;
    font-size: 0.95rem;
    user-select: none;
    margin-top: 0.1rem;
  }

  .tooltip {
    position: absolute;
    background-color: white;
    border: 1px solid #ccc;
    padding: 6px 10px;
    font-size: 0.85rem;
    pointer-events: none;
    border-radius: 4px;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
    opacity: 0;
    transition: opacity 0.2s ease;
    user-select: none;
    white-space: nowrap;
    z-index: 10;
  }

  .donut-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start; 
}

.donut-label {
  text-align: right;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e3a8a; /* Indigo tone */
  margin-bottom: 0.1rem;
}

</style>
