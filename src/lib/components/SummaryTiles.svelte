<script lang="ts">
  export let label: string;
  export let overviewValue: number;
  export let selectedValue: number | null = null;
  export let unit: string = "";

  const BAR_WIDTH = 200;
  const MIN_VISIBLE_PERCENT = 5;

  // Tooltip state
  let tooltipVisible = false;
  let tooltipX = 0;
  let tooltipY = 0;

  // Reactive calculations
  $: maxValue = Math.max(overviewValue, selectedValue ?? 0, 1);

  // Percent of the bar for common value
  $: commonPercent =
    selectedValue !== null
      ? (Math.min(overviewValue, selectedValue) / maxValue) * 100
      : 100;

  $: adjustedCommonPercent =
    selectedValue !== null &&
    commonPercent > 0 &&
    commonPercent < MIN_VISIBLE_PERCENT
      ? MIN_VISIBLE_PERCENT
      : commonPercent;

  $: adjustedDiffPercent =
    selectedValue !== null ? 100 - adjustedCommonPercent : 0;

  // Difference in percentage
  $: percentDiff =
    selectedValue !== null
      ? ((selectedValue - overviewValue) / overviewValue) * 100
      : 0;

  // Gradient bar: shades of blue
  $: barBackground =
    selectedValue === null
      ? "#2563eb"
      : `linear-gradient(to right,
          #2563eb 0%,
          #2563eb ${adjustedCommonPercent}%,
          #93c5fd ${adjustedCommonPercent}%,
          #93c5fd 100%)`;

  // Tooltip text
  $: tooltipText =
    `${label} Overview: ${overviewValue}${unit}` +
    (selectedValue !== null ? ` | Selected: ${selectedValue}${unit}` : "");

  // Difference label
  $: diffText =
    selectedValue !== null
      ? `${percentDiff > 0 ? "+" : ""}${percentDiff.toFixed(2)}%`
      : "";
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
    >
      <span class="bar-diff-text">{diffText}</span>
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
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
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
    position: relative;
    height: 20px;
    border-radius: 10px;
    cursor: pointer;
    user-select: none;
    box-shadow: inset 0 0 5px rgb(0 0 0 / 0.1);
  }

  .bar-diff-text {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.8rem;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); /* subtle shadow for readability */
    pointer-events: none;
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
