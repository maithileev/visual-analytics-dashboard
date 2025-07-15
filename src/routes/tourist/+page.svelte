<script lang="ts">
  import { currentTab } from "$lib/stores";
  import AveragePrice from "$lib/components/AveragePrice.svelte";
  import SummaryTiles from "$lib/components/SummaryTiles.svelte";
  import Map from "$lib/components/Map.svelte";
  import type { PageData } from "./$types";
  import DonutChart from "$lib/charts/DonutChart.svelte";
  import HorizontalBarChart from "$lib/charts/HorizontalBarChart.svelte";
  import BubbleChart from "$lib/charts/BubbleChart.svelte";
  import ChloroplethMap from "$lib/charts/ChloroplethMap.svelte";
  type PageData = {
    geojson: any;
    availableStays: number;
    averagePriceRounded: number;
    minPrice: number;
    maxPrice: number;
    averageRatingRounded: number;
    superhostCounts: Record<string, number>;
    instantBookableCounts: Record<string, number>;
    bubbleData: any;
    overallRoomTypeData: { label: string; overall: number; compare?: number }[];
    touristRatingData: any;
  };

  export let data: PageData;
  const totalStaysLabel = "Available Stays";
  const totalStaysSubtext = "Actively listed rentals across the city";
  const averagePriceSubtext = "What you might spend to stay here";
  const averageRatingSubtext = "Reflecting how guests rate their stays";
</script>

<section class="kpi-grid">
  <div class="bg-white p-5 rounded shadow">
    <SummaryTiles
      value={data.availableStays}
      label={totalStaysLabel}
      subtext={totalStaysSubtext}
    />
  </div>
  <div class="bg-white p-5 rounded shadow">
    <SummaryTiles
      value={data.averagePriceRounded}
      label="Average Price per night"
      subtext={averagePriceSubtext}
    />
  </div>
  <div class="bg-white p-5 rounded shadow">
    <DonutChart summaryData={data.superhostCounts} />
  </div>
  <div class="bg-white p-5 rounded shadow">
    <SummaryTiles
      value={data.averageRatingRounded}
      label="Average Rating"
      subtext={averageRatingSubtext}
    />
  </div>
  <div class="bg-white p-5 rounded shadow">
    <AveragePrice
      value="TODO"
      label="Price range"
      subtext={averagePriceSubtext}
    />
  </div>
</section>

<section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- Left: Map  -->
  <div class="bg-white p-4 rounded shadow">
    <h2 class="text-lg font-semibold mb-2">Rental Distribution Map</h2>
    <ChloroplethMap
      geojson={data.geojson}
      values={data.touristRatingData} 
      colorRange={["#e6f2f8",  // very light sky blue
      "#a8d0e6",  // light blue
      "#5ca7c8",  // medium blue
      "#2c6b8f",  // deep blue
      "#1b3e57"   // darkest navy blue
    ]}
      label="Average Rating"
      unit="/5"
      tooltipFormatter={(v) => v.toFixed(2)}
       />
    <!-- <Map geojson={data.geojson} /> -->
  </div>

  <!-- Right: Charts -->
  <div class="space-y-4">
    <!-- <div class="bg-white p-4 rounded shadow"><HorizontalBarChart data={data.instantBookableCounts} /> -->
    <!-- </div> -->
    <div class="bg-white p-4 rounded shadow">
      <h2 class="text-lg font-semibold mb-2">
        Neighborhood Popularity: Price vs. Rating
      </h2>
      <BubbleChart
        data={data.bubbleData}
        xLabel="Average Price ($)"
        yLabel="Average Rating"
      />
    </div>
    <div class="bg-white p-4 rounded shadow">
      <h2 class="text-lg font-semibold mb-2">Room Type Distribution</h2>
      <HorizontalBarChart
        data={data.overallRoomTypeData}
        labelField="label"
        overallField="overall"
      />
    </div>
  </div>
</section>
<div class="bg-white p-4 rounded shadow">
  <h2 class="text-lg font-semibold mb-2">Recommendations</h2>
</div>
