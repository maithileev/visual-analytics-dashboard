<script lang="ts">
    export interface ReviewScore {
      label: string;
      overviewValue: number;
      selectedValue: number | null | undefined;
      unit?: string;
    }
  
    export let scores: ReviewScore[] = [];
  
    const BAR_WIDTH = 120;
    const BAR_HEIGHT = 14;
  
    let tooltipVisible = Array(scores.length).fill(false);
    let tooltipX = Array(scores.length).fill(0);
    let tooltipY = Array(scores.length).fill(0);
  
    const TOOLTIP_WIDTH = 150; // estimated tooltip width in px
  
    $: barBackgrounds = scores.map(({ overviewValue, selectedValue }) => {
      const maxValue = Math.max(overviewValue, selectedValue ?? 0, 1);
  
      // Show only base blue if selectedValue is null or undefined
      if (selectedValue === null || selectedValue === undefined) {
        return "#2563eb";  // base blue
      }
  
      const commonPercent = (Math.min(overviewValue, selectedValue) / maxValue) * 100;
      const diffPercent = (Math.abs(selectedValue - overviewValue) / maxValue) * 100;
      // If selectedValue > overviewValue => green, else red (including 0 or less)
      const diffColor = selectedValue > overviewValue ? "#22c55e" : "#ef4444";
  
      return `linear-gradient(to right, #2563eb 0%, #2563eb ${commonPercent}%, ${diffColor} ${commonPercent}%, ${diffColor} ${
        commonPercent + diffPercent
      }%)`;
    });
  
    $: tooltipTexts = scores.map(({ label, overviewValue, selectedValue, unit }) =>
      `${label} Overview: ${overviewValue}${unit ?? ''}` +
      (selectedValue !== null && selectedValue !== undefined ? ` | Selected: ${selectedValue}${unit ?? ''}` : '')
    );
  
    function updateTooltipPosition(i: number, e: MouseEvent) {
      tooltipVisible[i] = true;
      const padding = 10;
      const pointerX = e.clientX;
      const pointerY = e.clientY;
      const viewportWidth = window.innerWidth;
  
      if (viewportWidth - pointerX < TOOLTIP_WIDTH + padding * 2) {
        tooltipX[i] = pointerX - TOOLTIP_WIDTH - padding;
      } else {
        tooltipX[i] = pointerX + padding;
      }
  
      tooltipY[i] = pointerY + padding;
    }
  </script>
  
  <div class="kpi-card">
    <h3 class="kpi-label">Review Scores</h3>
    <hr />
  
    {#each scores as { label, overviewValue, selectedValue, unit }, i}
      <div class="score-row">
        <div class="score-label">{label}</div>
  
        <div
          class="bar"
          style="background: {barBackgrounds[i]}; height: {BAR_HEIGHT}px; width: {BAR_WIDTH}px;"
          on:mousemove={(e) => updateTooltipPosition(i, e)}
          on:mouseleave={() => (tooltipVisible[i] = false)}
          aria-label="Comparison bar"
          role="img"
        ></div>
  
        <div class="score-value">
          {selectedValue === null || selectedValue === undefined ? overviewValue : selectedValue}{unit}
        </div>
  
        {#if tooltipVisible[i]}
          <div class="tooltip" style="top: {tooltipY[i]}px; left: {tooltipX[i]}px;">
            {tooltipTexts[i]}
          </div>
        {/if}
      </div>
    {/each}
  </div>
  
  <style>
    .kpi-card {
      width: 328px;
      height: 188px;
      background: white;
      padding: 1rem 1.2rem;
      border-radius: 0.6rem;
      box-shadow: 0 3px 8px rgb(0 0 0 / 0.07);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #222;
      user-select: none;
  
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      box-sizing: border-box;
    }
  
    .kpi-label {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0 0 0.8rem 0;
      color: #333;
      text-align: center;
      flex-shrink: 0;
    }
  
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin-bottom: 1rem;
      flex-shrink: 0;
    }
  
    .score-row {
      display: grid;
      grid-template-columns: 90px auto auto;
      align-items: center;
      column-gap: 4px;
      margin-bottom: 0.6rem;
      flex-shrink: 0;
    }
  
    .score-label {
      text-align: right;
      font-weight: 600;
      font-size: 0.85rem;
      color: #444;
      white-space: nowrap;
      padding-right: 4px;
    }
  
    .bar {
      border-radius: 0;
      box-shadow: inset 0 0 4px rgb(0 0 0 / 0.1);
      cursor: pointer;
      user-select: none;
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
  