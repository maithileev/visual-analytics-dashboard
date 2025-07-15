
<script lang="ts">
    import { currentTab } from '$lib/stores';
    import AveragePrice from '$lib/components/AveragePrice.svelte';
    import SummaryTiles from '$lib/components/SummaryTiles.svelte';
    import Map from '$lib/components/Map.svelte';
    import type { PageData } from './$types';
    import DonutChart from '$lib/charts/DonutChart.svelte';
    import HorizontalBarChart from '$lib/charts/HorizontalBarChart.svelte';
    import ChloroplethMap from '$lib/charts/ChloroplethMap.svelte';
    import BubbleChart from '$lib/charts/BubbleChart.svelte';
    type PageData  = {
      geojson : any ;
      licenseSummary: Record<string, number>;
      instantBookableCounts: Record<string, number>;
      averageReviewsPerMonthRounded: number;
      averageMinNightsRounded: number;
      averageOccupancyRateRounded: number;
      avgEstimatedRevenueRounded: number;
      avgRevenueByNeighborhood: Record<string, number>;
      bubbleData : any;
      overallPropertyTypeData : any;

    }
  
    export let data : PageData
  </script>
  
  <section class="kpi-grid">
    <div class="bg-white p-5 rounded shadow">
        <SummaryTiles 
        value={data.averageReviewsPerMonthRounded}
        label="Average Monthly Reviews" 
        subtext="How often guests write reviews each month."/>
    </div>
    <div class="bg-white p-5 rounded shadow">
        <SummaryTiles 
        value={data.averageMinNightsRounded} 
        label="Average Minimum Nights"
        subtext="Typical minimum stay guests must book." />
    </div>
    <div class="bg-white p-5 rounded shadow">
        <DonutChart summaryData={data.licenseSummary} />
    </div>
    <div class="bg-white p-5 rounded shadow">
        <SummaryTiles 
        value="{data.averageOccupancyRateRounded}%"
        label="Occupancy rate" 
        subtext="Shows how often listings are booked over the year" />
    </div>
    <div class="bg-white p-5 rounded shadow">
        <SummaryTiles 
        value={data.avgEstimatedRevenueRounded}
        label="Estimated Annual Revenue" 
        subtext="Expected income per listing based on occupancy and price" />
    </div>

  </section>
  
  <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Left: Map  -->
    <div class="bg-white p-4 rounded shadow">
      <h2 class="text-lg font-semibold mb-2">Annual Revenue Potential Across Neighborhoods      </h2>
      <ChloroplethMap geojson={data.geojson} values={data.avgRevenueByNeighborhood}       
      label="Average Revenue"
      unit=""
      tooltipFormatter={(v) => v.toFixed(2)}/>
    </div>
  
    <!-- Right: Charts -->
    <div class="space-y-4">
      <div class="bg-white p-4 rounded shadow"><HorizontalBarChart data={data.instantBookableCounts} />
      </div>
      <div class="bg-white p-4 rounded shadow">
        <h2 class="text-lg font-semibold mb-2">Neighborhood Popularity: Occupancy vs. Rating</h2>
        <BubbleChart data={data.bubbleData}  
        xLabel="Average Occupancy Rate (%)"
        yLabel="Average Rating"
            />
    </div>
    <div class="bg-white p-4 rounded shadow">
      <h2 class="text-lg font-semibold mb-2">Room Type Distribution</h2>
        <HorizontalBarChart
        data={data.overallPropertyTypeData}
        labelField="label"
        overallField="overall"/>
    </div>

  </div>
  </section>  
  <div class="bg-white p-4 rounded shadow">
    <h2 class="text-lg font-semibold mb-2">Recommendations</h2>
  </div>