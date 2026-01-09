<script lang="ts">
  export let label = "Price Range";
  export let overviewMin: number;
  export let overviewMax: number;
  export let regionMin: number | undefined = undefined;
  export let regionMax: number | undefined = undefined;
  export let unit: string = "$";

  const BAR_WIDTH = 200;

  $: hasRegion = regionMin !== undefined && regionMax !== undefined;

  // Global range based on both overview and region
  $: globalMin = hasRegion ? Math.min(overviewMin, regionMin!) : overviewMin;
  $: globalMax = hasRegion ? Math.max(overviewMax, regionMax!) : overviewMax;

  function toWidth(value: number) {
    return ((value - globalMin) / (globalMax - globalMin)) * BAR_WIDTH;
  }

  $: overviewStart = toWidth(overviewMin);
  $: overviewEnd = toWidth(overviewMax);
  $: overviewWidth = Math.max(overviewEnd - overviewStart, 1.5);

  $: regionStart = hasRegion ? toWidth(regionMin!) : 0;
  $: regionEnd = hasRegion ? toWidth(regionMax!) : 0;
  $: regionWidth = hasRegion ? Math.max(regionEnd - regionStart, 1.5) : 0;

  let tooltipVisible = false;
  let tooltipX = 0;
  let tooltipY = 0;
  $: tooltipText = hasRegion
    ? `${label}: ${unit}${regionMin!.toFixed(2)} – ${unit}${regionMax!.toFixed(2)}`
    : `${label}: ${unit}${overviewMin.toFixed(2)} – ${unit}${overviewMax.toFixed(2)}`;
</script>

<div class="kpi-card">
  <h3 class="kpi-label">{label}</h3>
  <hr />

  <div class="kpi-value-single">
    {#if hasRegion}
      {unit}{regionMin!.toFixed(2)} – {unit}{regionMax!.toFixed(2)}
    {:else}
      {unit}{overviewMin.toFixed(2)} – {unit}{overviewMax.toFixed(2)}
    {/if}
  </div>

  {#if hasRegion}
    <div
      class="bar-container"
      style="width: {BAR_WIDTH}px"
      on:mousemove={(e) => {
        tooltipVisible = true;
        tooltipX = e.clientX + 10;
        tooltipY = e.clientY + 10;
      }}
      on:mouseleave={() => (tooltipVisible = false)}
    >
      <div
        class="bar overview-bar"
        style="left: {overviewStart}px; width: {overviewWidth}px"
      ></div>

      <div
        class="bar region-bar"
        style="left: {regionStart}px; width: {regionWidth}px"
      ></div>
    </div>
  {/if}
</div>

{#if tooltipVisible}
  <div class="tooltip" style="top: {tooltipY}px; left: {tooltipX}px;">
    {tooltipText}
  </div>
{/if}

<style>
  .kpi-card {
    width: 280px;
    background: white;
    padding: 1.5rem;
    border-radius: 0.8rem;
    box-shadow: 0 4px 10px rgb(0 0 0 / 0.05);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #222;
    user-select: none;
  }

  .kpi-label {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 0 0.6rem 0;
    color: #333;
  }

  hr {
    border: none;
    border-top: 1px solid #ddd;
    margin-bottom: 1rem;
  }

  .kpi-value-single {
    font-size: 2.8rem;
    font-weight: 700;
    color: #1e40af;
    text-align: center;
    margin-bottom: 1rem;
  }

  .bar-container {
    position: relative;
    height: 20px;
    border-radius: 10px;
    background: #bfdbfe;
    box-shadow: inset 0 0 5px rgb(0 0 0 / 0.1);
    cursor: pointer;
  }

  .bar {
    position: absolute;
    height: 100%;
    border-radius: 10px;
    top: 0;
  }

  .overview-bar {
    background-color: #bfdbfe;
    z-index: 1;
  }

  .region-bar {
    background-color: #2563eb;
    z-index: 2;
    opacity: 0.95;
  }

  .tooltip {
    position: fixed;
    background-color: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
    pointer-events: none;
    white-space: nowrap;
    user-select: none;
    z-index: 100;
  }
</style>
