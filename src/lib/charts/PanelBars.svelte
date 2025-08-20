<script lang="ts">
  import type { KPI } from "$lib/utils/kpiHelpers";

  export let scores: KPI[] = [];

  const BAR_WIDTH = 120;
  const BAR_HEIGHT = 12; // reduced height
  const MAX_VALUE = 5;
  const MIN_VISIBLE_PX = 4; // minimal visible gap (px) to show some bottom color when values are close

  $: tooltipVisible = Array(scores.length).fill(false);
  $: tooltipX = Array(scores.length).fill(0);
  $: tooltipY = Array(scores.length).fill(0);

  const TOOLTIP_WIDTH = 150;

  $: tooltipTexts = scores.map(
    ({ label, overviewValue, selectedValue, unit }) =>
      `${label} Overview: ${overviewValue}${unit}` +
      (selectedValue !== null ? ` | Selected: ${selectedValue}${unit}` : ""),
  );

  function updateTooltipPosition(i: number, e: MouseEvent) {
    tooltipVisible[i] = true;
    const padding = 10;
    const pointerX = e.clientX;
    const pointerY = e.clientY;
    const viewportWidth = window.innerWidth;

    tooltipX[i] =
      viewportWidth - pointerX < TOOLTIP_WIDTH + padding * 2
        ? pointerX - TOOLTIP_WIDTH - padding
        : pointerX + padding;

    tooltipY[i] = pointerY + padding;
  }

  // helper: clamp and compute display widths + color stacking
  const clamp = (v: number, lo = 0, hi = MAX_VALUE) =>
    Math.max(lo, Math.min(hi, v));

  function computeBar(overviewValue: number, selectedValue: number | null) {
    const ovRaw = (clamp(overviewValue) / MAX_VALUE) * BAR_WIDTH;
    const selRaw =
      selectedValue !== null
        ? (clamp(selectedValue) / MAX_VALUE) * BAR_WIDTH
        : 0;

    // Only overview present
    if (selectedValue === null) {
      return {
        bottomWidth: ovRaw,
        topWidth: 0,
        bottomColor: "#93c5fd", // overview
        topColor: null,
        drawOverviewOnTop: false,
      };
    }

    // bottom is the larger, top is the smaller
    let bottomWidth = Math.max(ovRaw, selRaw);
    let topWidth = Math.min(ovRaw, selRaw);

    // Ensure the bottom bar shows at least MIN_VISIBLE_PX beyond the top
    const diff = bottomWidth - topWidth;
    if (diff < MIN_VISIBLE_PX) {
      // shrink the top so bottom shows MIN_VISIBLE_PX (do not increase bottom)
      topWidth = Math.max(0, bottomWidth - MIN_VISIBLE_PX);
    }

    const selectedBigger = selectedValue! > overviewValue;

    // color assignment per your rule:
    // if selected > overview -> overview drawn on top (topColor = overview)
    // else -> selected drawn on top (topColor = selected)
    const bottomColor = selectedBigger ? "#2563eb" : "#93c5fd";
    const topColor = selectedBigger ? "#93c5fd" : "#2563eb";

    return {
      bottomWidth,
      topWidth,
      bottomColor,
      topColor,
      drawOverviewOnTop: selectedBigger,
    };
  }
</script>

<div class="kpi-card">
  <h3 class="kpi-label">Review Scores</h3>
  <hr />

  {#each scores as { label, overviewValue, selectedValue, unit }, i}
    {@const bar = computeBar(overviewValue, selectedValue)}
    <div class="score-row">
      <div class="score-label">{label}</div>
      <!-- SVG bar -->
      <svg
        width={BAR_WIDTH}
        height={BAR_HEIGHT}
        on:mousemove={(e) => updateTooltipPosition(i, e)}
        on:mouseleave={() => (tooltipVisible[i] = false)}
        role="img"
        aria-label={`Overview: ${overviewValue}${unit}${selectedValue !== null ? `, Selected: ${selectedValue}${unit}` : ""}`}
      >
        <!-- Gray base -->
        <rect
          x="0"
          y="0"
          width={BAR_WIDTH}
          height={BAR_HEIGHT}
          fill="#e5e7eb"
          rx="3"
        />

        <!-- Draw bottom (larger) -->
        <rect
          x="0"
          y="0"
          width={bar.bottomWidth}
          height={BAR_HEIGHT}
          fill={bar.bottomColor}
          rx="3"
        />

        <!-- Draw top (smaller), only if topWidth > 0 -->
        {#if bar.topWidth > 0 && bar.topColor}
          <rect
            x="0"
            y="0"
            width={bar.topWidth}
            height={BAR_HEIGHT}
            fill={bar.topColor}
            rx="3"
          />
        {/if}
      </svg>

      <div class="score-value">
        {selectedValue ?? overviewValue}{unit}
      </div>

      {#if tooltipVisible[i]}
        <div
          class="tooltip"
          style="top: {tooltipY[i]}px; left: {tooltipX[i]}px;"
        >
          {tooltipTexts[i]}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .kpi-card {
    width: 300px;
    min-height: 140px; /* reduced height */
    background: white;
    padding: 0.8rem 1rem;
    border-radius: 0.6rem;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.07);
    display: flex;
    flex-direction: column;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    color: #222;
    user-select: none;
  }

  .kpi-label {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0 0 0.3rem 0;
    text-align: center;
  }

  hr {
    height: 1px; /* explicit height */
    background-color: #ddd; /* visible color */
    border: none; /* remove default border */
    margin: 0.2rem 0 0.4rem 0;
    width: 100%;
  }

  .score-row {
    display: grid;
    grid-template-columns: 90px auto auto;
    align-items: center;
    column-gap: 4px;
    margin-bottom: 0.3rem;
  }

  .score-label {
    text-align: right;
    font-weight: 600;
    font-size: 0.85rem;
    color: #444;
    white-space: nowrap;
    padding-right: 4px;
  }

  .score-value {
    font-weight: 700;
    font-size: 0.85rem;
    color: #1e40af;
    white-space: nowrap;
    min-width: 32px;
    text-align: left;
  }

  .tooltip {
    position: fixed;
    background-color: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    pointer-events: none;
    white-space: nowrap;
    user-select: none;
    z-index: 100;
  }
</style>
