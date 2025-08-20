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
  import {getAvailabilityHistogramDataByNeighborhood} from '$lib/utils/prepareHistogram';
  import HistogramChart from "$lib/charts/HistogramChart.svelte";
  import PanelBars from '$lib/charts/PanelBars.svelte';
  import {aggregateMultipleReviewScores,columns,reviewScores} from '$lib/utils/kpiHelpers'
  import type {KPI} from '$lib/utils/kpiHelpers'
  import TopNeighborhoods from '$lib/components/TopNeighborhoods.svelte';

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
    binnedDataOverall: any;
    kpis: KPI[];
    top3Neighborhoods: any;
  };
  export let data: PageData;

  let kpis: KPI[] = []
  let neighborhoodStats: NeighborhoodStats[] = [];
  let filteredStats: NeighborhoodStats[] = [];

  onMount(async() => {
    detailedRows.set(data.detailed_data_rows); // ← inject the raw data only once
    selectedNeighborhood.set(null);
  });

  console.log("Top neighborhood data", neighborhoodStats);
  let sortColumn: keyof NeighborhoodStats = 'sentimentScore';
  let sortAscending = false; // default to descending

  let compareField = null;
  $: compareField = $selectedNeighborhood ? 'compare' : null;

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

// Update `kpis` whenever data or neighborhood changes
$: kpis = [...aggregateMultipleReviewScores(data.detailed_data_rows, columns, $selectedNeighborhood ?? null)];

// Compute selectedReviewScores conditionally based on neighborhood
$: selectedReviewScores = $selectedNeighborhood ? kpis : data.kpis;

console.log("review scores -", selectedReviewScores)
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

//availability 
let selectedData = []
$: selectedData = $selectedNeighborhood
    ? getAvailabilityHistogramDataByNeighborhood(data.detailed_data_rows, $selectedNeighborhood)
    : null;

console.log(data.binnedDataOverall);

function sortBy(column: keyof NeighborhoodStats) {
    if (column === 'neighborhood') return; // no sorting on name

    if (sortColumn === column) {
      sortAscending = !sortAscending;
    } else {
      sortColumn = column;
      sortAscending = true;
    }
    applySorting();
  }

  // Apply sorting and keep only top 5
  function applySorting() {
    filteredStats = [...neighborhoodStats]
      .sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA < valB) return sortAscending ? -1 : 1;
        if (valA > valB) return sortAscending ? 1 : -1;
        return 0;
      })
      .slice(0, 5);
  }

  function sortArrow(column: keyof NeighborhoodStats) {
    if (sortColumn !== column) return '';
    return sortAscending ? '▲' : '▼';
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
      label = "Superhost"
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
     <PanelBars scores={selectedReviewScores} />
  </div>
</section>

<section class="dashboard-row">
  <div class="map-container legend-container">
    <h2 class="text-lg font-semibold mb-2">Rental Distribution Map</h2>
    <ChloroplethMap
      geojson={data.geojson}
      values={data.touristRatingData}
      colorRange={[
  "#b3d4eb",  // slightly darker pastel blue
  "#d0e1f2",  // light powder blue
  "#a6c8e4",  // soft muted sky blue
  "#679acb",  // slate blue, mid contrast
  "#1e40af"   // your main indigo
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
    <h2 class="text-lg font-semibold mb-2">Airbnb Rental Availability Overview </h2>
    <HistogramChart 
overallBinnedData={data.binnedDataOverall}
selectedBinnedData={selectedData ?? []}
/>

  </div>
</section>

<section class="dashboard-row-2">
  <div class="chart-container legend-container">
    <h2 class="text-lg font-semibold mb-2">
        Neighborhood Popularity: Price vs. Rating
      </h2>
      <BubbleChart
        data={data.bubbleData}
        xLabel="Average Price (€)"
        yLabel="Average Rating"
      />
    </div>
    <div class="chart-container legend-container">
      <h2 class="text-xl font-bold mb-4">Top Neighborhoods for Tourists</h2>
      <div class="carousel-wrapper">
      <TopNeighborhoods neighborhoods={data.top3Neighborhoods} />
      </div>
    <!-- <div class="bg-white p-4 rounded shadow"></div> -->
  </div>
</section>
