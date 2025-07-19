<script lang="ts">
  import { currentTab } from "$lib/stores";
  import AveragePrice from "$lib/components/AveragePrice.svelte";
  import SummaryTiles from "$lib/components/SummaryTiles.svelte";
  import Map from "$lib/components/Map.svelte";
  import type { PageData } from "./$types";
  import HorizontalBarChart from "$lib/charts/HorizontalBarChart.svelte";
  import BubbleChart from "$lib/charts/BubbleChart.svelte";
  import ChloroplethMap from "$lib/charts/ChloroplethMap.svelte";
  import PieChart from "$lib/charts/PieChart.svelte";
  import { onMount } from "svelte";
  import { detailedRows } from "$lib/stores/chartData";
  import { selectedNeighborhood } from "$lib/stores/selectedNeighborhood";
  import { roomTypeData } from "$lib/stores/chartData";

  type PageData = {
    geojson: any;
    availableStays: number;
    averagePricePerDayRounded: number;
    minPrice: number;
    maxPrice: number;
    averageRatingRounded: number;
    superhostCounts: Record<string, number>;
    instantBookableCounts: Record<string, number>;
    bubbleData: any;
    overallRoomTypeData: { label: string; overall: number; compare?: number }[];
    touristRatingData: any;
    detailed_data_rows: any;
  };

  export let data: PageData;
  onMount(() => {
    selectedNeighborhood.set(null);
  });
  let compareField = null;
  $: compareField = $selectedNeighborhood ? "compare" : null;

  //Available stays
  $: selectedNeighborhoodAvailableListings =
    $selectedNeighborhood && data.detailed_data_rows?.length
      ? data.detailed_data_rows
          .filter(
            (row) =>
              (row["neighbourhood_cleansed"]?.trim().toLowerCase() || "") ===
              $selectedNeighborhood.trim().toLowerCase(),
          )
          .filter((row) => parseInt(row["availability_365"] ?? "0", 10) > 0)
          .length
      : null;

  console.log(
    "selectedNeighborhoodAvailableListings = ",
    $selectedNeighborhoodAvailableListings,
  );
  console.log("selectedNeighborhood = ", $selectedNeighborhood);

  //Average price per night
  $: selectedNeighborhoodPrices =
    $selectedNeighborhood && data.detailed_data_rows?.length
      ? data.detailed_data_rows
          .filter(
            (row) =>
              (row["neighbourhood_cleansed"]?.trim().toLowerCase() || "") ===
              $selectedNeighborhood.trim().toLowerCase(),
          )
          .map((row) => {
            let priceStr = row["price"]?.trim() || "0";
            priceStr = priceStr.replace(/[^0-9.]/g, "");
            return parseFloat(priceStr);
          })
          .filter((price) => !isNaN(price) && price > 0)
      : null;

  $: selectedAveragePrice =
    selectedNeighborhoodPrices && selectedNeighborhoodPrices.length
      ? +(
          selectedNeighborhoodPrices.reduce((sum, p) => sum + p, 0) /
          selectedNeighborhoodPrices.length
        ).toFixed(2)
      : null;


      $: selectedNeighborhoodAverageRating =
  $selectedNeighborhood && data.detailed_data_rows?.length
    ? (() => {
        const ratings = data.detailed_data_rows
          .filter(row =>
            (row['neighbourhood_cleansed']?.trim().toLowerCase() || '') ===
            $selectedNeighborhood.trim().toLowerCase()
          )
          .map(row => parseFloat(row['review_scores_rating'] || '0'))
          .filter(rating => !isNaN(rating) && rating > 0);

        const total = ratings.reduce((sum, r) => sum + r, 0);
        return ratings.length ? +(total / ratings.length).toFixed(2) : null;
      })()
    : null;

    //superhost
    $: selectedNeighborhoodSuperhostCounts =
  $selectedNeighborhood && data.detailed_data_rows?.length
    ? (() => {
        const counts = {
          True: 0,
          False: 0
        };

        const seenHostIds = new Set();

        data.detailed_data_rows
          .filter(row =>
            (row['neighbourhood_cleansed']?.trim().toLowerCase() || '') ===
            $selectedNeighborhood.trim().toLowerCase()
          )
          .forEach(row => {
            const hostId = row['host_id'];
            const isSuperhost = (row['host_is_superhost'] || '').toLowerCase() === 't';

            // Count only unique host IDs
            if (hostId && !seenHostIds.has(hostId)) {
              seenHostIds.add(hostId);
              if (isSuperhost) {
                counts.True++;
              } else {
                counts.False++;
              }
            }
          });

        return {
          'Superhost': counts.True,
          'Not Superhost': counts.False
        };
      })()
    : null;


//min and max price
let regionMin: number | undefined = undefined;
let regionMax: number | undefined = undefined;
let regionAverage: number | undefined = undefined;

const PRICE_THRESHOLD = 20;
const MAX_MIN_NIGHTS = 180;

$: if ($selectedNeighborhood) {
  const filtered = data.detailed_data_rows.filter(
    row => row['neighbourhood_cleansed'] === $selectedNeighborhood
  );

  const pricesPerDay: number[] = filtered
    .map(row => {
      let priceStr = row['price']?.trim() || '0';
      priceStr = priceStr.replace(/[^0-9.]/g, '');
      const price = parseFloat(priceStr);

      const minNights = parseInt(row['minimum_nights'] || '1');

      if (
        !isFinite(price) || price <= 0 ||
        !isFinite(minNights) || minNights <= 0 ||
        price < PRICE_THRESHOLD ||
        minNights > MAX_MIN_NIGHTS
      ) {
        return null;
      }

      return price;
    })
    .filter(p => p !== null) as number[];

  regionMin = pricesPerDay.length ? Math.min(...pricesPerDay) : undefined;
  regionMax = pricesPerDay.length ? Math.max(...pricesPerDay) : undefined;

  // Calculate average region price per day
  const totalPrice = pricesPerDay.reduce((sum, p) => sum + p, 0);
  regionAverage = pricesPerDay.length ? parseFloat((totalPrice / pricesPerDay.length).toFixed(2)) : undefined;
}


</script>

<section class="kpi-grid">
  <div class="bg-white p-5 rounded shadow">
    <SummaryTiles
      overviewValue={data.availableStays}
      label="Available Stays"
      selectedValue={selectedNeighborhoodAvailableListings}
    />
  </div>
  <div class="bg-white p-5 rounded shadow">
    <SummaryTiles
      overviewValue={data.averagePricePerDayRounded}
      selectedValue={regionAverage}
      label="Average Price per night"
    />
  </div>
  <div class="bg-white p-5 rounded shadow">
    <PieChart
      summaryData={{
        overview: data.superhostCounts,
        region: selectedNeighborhoodSuperhostCounts || undefined,
      }}
    />
  </div>
  <div class="bg-white p-5 rounded shadow">
    <SummaryTiles
      overviewValue={data.averageRatingRounded}
      selectedValue={selectedNeighborhoodAverageRating}
      label="Average Rating"
    />
  </div>
  <div class="bg-white p-5 rounded shadow">
    <AveragePrice
    overviewMin={data.minPrice}
    overviewMax={data.maxPrice}
    regionMin={regionMin}
    regionMax={regionMax}
    unit="$"
  />
  </div>
</section>

<section class="dashboard-row">
  <div class="map-container legend-container">
    <h2 class="text-lg font-semibold mb-2">Rental Distribution Map</h2>
    <ChloroplethMap
      geojson={data.geojson}
      values={data.touristRatingData}
      colorRange={[
        "#e6f2f8", // very light sky blue
        "#a8d0e6", // light blue
        "#5ca7c8", // medium blue
        "#2c6b8f", // deep blue
        "#1b3e57", // darkest navy blue
      ]}
      label="Average Rating"
      unit="/5"
      tooltipFormatter={(v) => v.toFixed(2)}
    />
  </div>
  <div class="chart-container legend-container">
    <h2 class="text-lg font-semibold mb-2">Room Type Distribution</h2>
    <HorizontalBarChart
      data={$roomTypeData}
      labelField="label"
      overallField="overall"
      {compareField}
    />
  </div>
  <div class="chart-container legend-container">
    <h2 class="text-lg font-semibold mb-2">Chart 2 here</h2>
  </div>
</section>

<section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- Left: Map  -->
  <div class="bg-white p-4 rounded shadow">
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
    <div class="bg-white p-4 rounded shadow"></div>
  </div>
</section>
<div class="bg-white p-4 rounded shadow">
  <h2 class="text-lg font-semibold mb-2">Recommendations</h2>
</div>
