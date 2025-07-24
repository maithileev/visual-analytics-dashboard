<script lang="ts">
  export let label: string;
  export let overviewValue: number;
  export let selectedValue: number | null = null;
  export let unit: string = "";

  const BAR_WIDTH = 200;
  const MIN_VISIBLE_PERCENT = 5; // ensures visibility of very small values

  // Compute the max for normalization
  $: maxValue = Math.max(overviewValue, selectedValue ?? 0, 1);

  // Compute raw common percent
  $: rawCommonPercent = selectedValue !== null
    ? (Math.min(overviewValue, selectedValue) / maxValue) * 100
    : 100;

  // Enforce a minimum visible percentage only if non-zero
  $: adjustedCommonPercent = (selectedValue !== null && rawCommonPercent > 0 && rawCommonPercent < MIN_VISIBLE_PERCENT)
    ? MIN_VISIBLE_PERCENT
    : rawCommonPercent;

  // Adjust diff percent accordingly
  $: adjustedDiffPercent = selectedValue !== null
    ? 100 - adjustedCommonPercent
    : 0;

  // Difference color (green if selected > overview, else red)
  $: diffColor = selectedValue !== null && selectedValue > overviewValue
    ? "#22c55e"  // green
    : "#ef4444"; // red

  // Final gradient style
  $: barBackground = selectedValue === null
    ? "#2563eb"
    : `linear-gradient(to right, 
        #2563eb 0%, 
        #2563eb ${adjustedCommonPercent}%, 
        ${diffColor} ${adjustedCommonPercent}%, 
        ${diffColor} 100%)`;

  // Tooltip state
  let tooltipVisible = false;
  let tooltipX = 0;
  let tooltipY = 0;

  // Tooltip text
  $: tooltipText = `${label} Overview: ${overviewValue}${unit}` + 
    (selectedValue !== null ? ` | Selected: ${selectedValue}${unit}` : '');
</script>

<div class="kpi-card">
  <h3 class="kpi-label">{label}</h3>
  <hr />

  {#if selectedValue === null}
    <div class="kpi-value-single">
      {overviewValue}{unit}
    </div>
  {:else}
    <div class="kpi-value-selected">
      {selectedValue}{unit}
    </div>

    <div
      class="bar-container"
      style="width: {BAR_WIDTH}px; background: {barBackground};"
      on:mousemove={(e) => {
        tooltipVisible = true;
        tooltipX = e.clientX + 10;
        tooltipY = e.clientY + 10;
      }}
      on:mouseleave={() => (tooltipVisible = false)}
      aria-label="Comparison bar"
      role="img"
    ></div>
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

  .kpi-value-single,
  .kpi-value-selected {
    font-size: 2.8rem;
    font-weight: 700;
    color: #1e40af;
    text-align: center;
    margin-bottom: 1rem;
  }

  .bar-container {
    height: 20px;
    border-radius: 10px;
    cursor: pointer;
    user-select: none;
    box-shadow: inset 0 0 5px rgb(0 0 0 / 0.1);
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
