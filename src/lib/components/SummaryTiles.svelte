   <!-- <script lang="ts">
    import { onMount } from 'svelte';
  
    export let label: string;
    export let overviewValue: number;
    export let selectedValue: number | null = null;
    export let unit: string = "";
  
    // For tooltip visibility & position
    let tooltipVisible = false;
    let tooltipX = 0;
    let tooltipY = 0;
  
    // Fixed bar width in px
    const BAR_WIDTH = 200;
    const BAR_HEIGHT = 20;
  
    // Calculate top bar width relative to overviewValue (avoid division by zero)
    $: topBarWidth = selectedValue !== null && overviewValue > 0
      ? Math.min(BAR_WIDTH, (selectedValue / overviewValue) * BAR_WIDTH)
      : 0;
  
    // Tooltip text for base bar
    $: tooltipText = `${label} Overview: ${overviewValue}${unit}`;
  </script>
  
  <div class="kpi-card">
    <h3 class="kpi-label">{label}</h3>
    <hr />
  
    {#if selectedValue === null}
      No neighborhood selected: show overview only
      <div class="kpi-value-single">
        {overviewValue}{unit}
      </div>
    {:else}
      Neighborhood selected: show selected value and stacked bar 
      <div class="kpi-value-selected">
        {selectedValue}{unit}
      </div>
  
      <div
        class="bar-container"
        style="width: {BAR_WIDTH}px;"
        on:mousemove={(e) => {
          tooltipVisible = true;
          tooltipX = e.clientX + 10;
          tooltipY = e.clientY + 10;
        }}
        on:mouseleave={() => (tooltipVisible = false)}
        aria-label="Overview value bar"
        role="img"
      >
        <!-- Base bar (overview) 
        <div class="bar base-bar" style="width: {BAR_WIDTH}px"></div>
  
        <!-- Top bar (selected neighborhood) 
        <div
          class="bar top-bar"
          style="width: {topBarWidth}px"
          aria-label="Selected neighborhood value"
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
  
    .kpi-value-single,
    .kpi-value-selected {
      font-size: 2.8rem;
      font-weight: 700;
      color: #1e40af; /* Bright Indigo */
      text-align: center;
      margin-bottom: 1rem;
    }
  
    .bar-container {
      position: relative;
      height: 20px;
      border-radius: 10px;
      cursor: pointer;
      user-select: none;
    }
  
    .bar {
      height: 100%;
      border-radius: 10px;
      position: absolute;
      top: 0;
      left: 0;
    }
  
    .base-bar {
      background-color: #bfdbfe; /* light blue */
      z-index: 1;
    }
  
    .top-bar {
      background-color: #2563eb; /* bright blue */
      z-index: 2;
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
  </style> -->
  

  <script lang="ts">
    export let label: string;
    export let overviewValue: number;
    export let selectedValue: number | null = null;
    export let unit: string = "";
  
    const BAR_WIDTH = 200;
  
    // Compute relative sizes as percentages (0 to 100)
    $: maxValue = Math.max(overviewValue, selectedValue ?? 0, 1);
  
    $: commonPercent = selectedValue !== null
      ? (Math.min(overviewValue, selectedValue) / maxValue) * 100
      : 100;
  
    $: diffPercent = selectedValue !== null
      ? (Math.abs(selectedValue - overviewValue) / maxValue) * 100
      : 0;
  
    $: diffColor = selectedValue !== null && selectedValue > overviewValue
      ? "#22c55e"  // green
      : "#ef4444"; // red
  
    $: barBackground = selectedValue === null
      ? "#2563eb"
      : `linear-gradient(to right, #2563eb 0%, #2563eb ${commonPercent}%, ${diffColor} ${commonPercent}%, ${diffColor} ${commonPercent + diffPercent}%)`;
  
    // Tooltip state
    let tooltipVisible = false;
    let tooltipX = 0;
    let tooltipY = 0;
  
    $: tooltipText = `${label} Overview: ${overviewValue}${unit}` + (selectedValue !== null ? ` | Selected: ${selectedValue}${unit}` : '');
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
  
    .kpi-value-single,
    .kpi-value-selected {
      font-size: 2.8rem;
      font-weight: 700;
      color: #1e40af; /* Bright Indigo */
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
  