<script lang="ts">
  import { page } from '$app/stores';
  import { currentTab } from "$lib/stores";
  import SummaryTiles from "$lib/components/SummaryTiles.svelte";
  import Map from "$lib/components/Map.svelte";
  import type { PageData } from "./$types";
  import DonutChart from "$lib/charts/DonutChart.svelte";
  import HorizontalBarChart from "$lib/charts/HorizontalBarChart.svelte";
  import ChloroplethMap from "$lib/charts/ChloroplethMap.svelte";
  import BubbleChart from "$lib/charts/BubbleChart.svelte";
  import { onMount } from "svelte";
  import { detailedRows } from "$lib/stores/chartData";
  import { propertyTypeData } from "$lib/stores/chartData";
  import { selectedNeighborhood } from "$lib/stores/selectedNeighborhood";
  import { derived } from "svelte/store";
  import SentimentMap from "$lib/charts/SentimentMap.svelte";
  import {
    aggregateRadarMetrics,
    normalizeRadarMetrics,
    findMinMaxValues,
  } from "$lib/utils/radarNormalization";
  import type { RadarInputListing } from "$lib/utils/prepareRadarData";
  import RadarChart from "$lib/charts/RadarChart.svelte";
  import TopHosts from "$lib/components/TopHosts.svelte";
import type {RawMetrics, NormalizedMetrics} from "$lib/utils/radarNormalization"


  type PageData = {
    geojson: any;
    licenseSummary: Record<string, number>;
    instantBookableCounts: Record<string, number>;
    averageReviewsPerMonthRounded: number;
    averageMinNightsRounded: number;
    averageOccupancyRateRounded: number;
    avgEstimatedRevenueRounded: number;
    avgRevenueByNeighborhood: Record<string, number>;
    bubbleData: any;
    detailed_data_rows: any;
    processedSentimentData: any;
    radarListings: any;
    overallRadarData: any;
    topHostsCalculated: any;
    precomputedData: any;
  };

  export let data: PageData;
  onMount(() => {
    detailedRows.set(data.detailed_data_rows); // ← inject the raw data only once
    selectedNeighborhood.set(null);
  });

  let showSentiment = false;

  //for horizontal bar chaart
  let compareField = null;
  $: compareField = $selectedNeighborhood ? "compare" : null;

  //     //KPIS
  //     // Reviews
  // $: selectedNeighborhoodReviews = $selectedNeighborhood
  // ? $detailedRows
  //   .filter(row =>
  //     (row['neighbourhood_cleansed']?.trim().toLowerCase() || '') === $selectedNeighborhood.trim().toLowerCase()
  //   )
  //   .map(row => parseFloat(row['reviews_per_month'] || '0'))
  //   .filter(n => !isNaN(n) && n > 0)
  // : null;

  // $: selectedAverageReviewsPerMonth =
  // selectedNeighborhoodReviews && selectedNeighborhoodReviews.length
  // ? + (
  //     selectedNeighborhoodReviews.reduce((sum, val) => sum + val, 0) /
  //     selectedNeighborhoodReviews.length
  //   ).toFixed(2)
  // : null;

  //     console.log("geojson",data.geojson);

  //     //Min nights
  // $: selectedNeighborhoodMinNights = $selectedNeighborhood
  //   ? $detailedRows
  //       .filter(row =>
  //         (row['neighbourhood_cleansed']?.trim().toLowerCase() || '') ===
  //         $selectedNeighborhood.trim().toLowerCase()
  //       )
  //       .map(row => {
  //         const val = row['minimum_nights']?.trim() || '0';
  //         const parsedVal = parseInt(val, 10);
  //         return isNaN(parsedVal) ? 0 : parsedVal;
  //       })
  //       .filter(val => val > 0)
  //   : null;

  // $: selectedAverageMinNights =
  //   selectedNeighborhoodMinNights && selectedNeighborhoodMinNights.length
  //     ? (selectedNeighborhoodMinNights.reduce((sum, val) => sum + val, 0) /
  //       selectedNeighborhoodMinNights.length).toFixed(2)
  //     : null;

  //     //Average revenue
  //     $: selectedNeighborhoodRevenueData = $selectedNeighborhood
  //   ? $detailedRows.filter(row =>
  //       (row['neighbourhood_cleansed']?.trim().toLowerCase() || '') ===
  //       $selectedNeighborhood.trim().toLowerCase()
  //     )
  //   : null;

  // $: selectedNeighborhoodAverageEstimatedRevenue = selectedNeighborhoodRevenueData
  //   ? (() => {
  //       let revenueSum = 0;
  //       let listingCount = 0;

  //       for (const row of selectedNeighborhoodRevenueData) {
  //         let priceStr = (row['price']?.trim() || '0').replace(/[^0-9.]/g, '');
  //         const price = parseFloat(priceStr);
  //         const nightsOccupied = parseInt(row['estimated_occupancy_l365d'] || '0', 10);

  //         if (!isNaN(price) && !isNaN(nightsOccupied)) {
  //           revenueSum += price * nightsOccupied;
  //           listingCount += 1;
  //         }
  //       }

  //       const avgEstimatedRevenue = listingCount > 0 ? revenueSum / listingCount : 0;
  //       return +avgEstimatedRevenue.toFixed(2);  // Return number rounded to 2 decimals
  //     })()
  //   : null;

  //   //Occupancy Rate
  //   // Filter rows belonging to the selected neighborhood
  $: selectedNeighborhoodRowsForOccupancy = $selectedNeighborhood
    ? $detailedRows.filter(
        (row) => {
          const rowId = row.id ?? "(no id)";
          const neighborhoodName = row["neighbourhood_cleansed"]?.trim().toLowerCase() || "";
          
          if (neighborhoodName === $selectedNeighborhood.trim().toLowerCase()) {
            return true;
          } else {
            return false;
          }
        })
      : null;
  // // Compute occupancy rate in %
  $: selectedNeighborhoodOccupancyRate =
  selectedNeighborhoodRowsForOccupancy &&
  selectedNeighborhoodRowsForOccupancy.length
    ? (() => {
        let totalOccupiedDays = 0;
        let totalAvailability = 0;

        for (const [index, row] of selectedNeighborhoodRowsForOccupancy.entries()) {
          let occRaw = row.estimated_occupancy_l365d;
          if (typeof occRaw === "string") {
            occRaw = occRaw.replace(/[^0-9.]/g, "");
          }
          const occupied = parseFloat(occRaw);

          let availRaw = row.availability_365;
          if (typeof availRaw === "string") {
            availRaw = availRaw.replace(/[^0-9.]/g, "");
          }
          const availability = parseFloat(availRaw);

          if (!isNaN(occupied) && !isNaN(availability) && availability > 0) {
            totalOccupiedDays += occupied;
            totalAvailability += availability;
          } else {
            console.log(`Row ${index} skipped in occupancy calc: occupied=${occRaw} (${occupied}), availability=${availRaw} (${availability})`);
          }
        }

        if (totalAvailability === 0) return null;
        const rate = (totalOccupiedDays / totalAvailability) * 100;
        return +rate.toFixed(2); // Rounded to 2 decimals
      })()
    : null;

  //Licensed
  function getLicenseCategory(value: string | undefined): string {
    if (!value || value.trim() === "") return "No Info";

    const trimmed = value.trim().toLowerCase();

    if (trimmed.includes("applied")) return "Applied";
    if (/^it[0-9a-z]+$/i.test(value.trim())) return "Has License"; // Starts with "IT", alphanumeric
    if (/^\d+$/.test(trimmed)) return "No Info"; // Only numbers (invalid)

    return "No Info";
  }

  // Reviews
  $: selectedNeighborhoodReviews =
    $selectedNeighborhood && $detailedRows
      ? $detailedRows
          .filter(
            (row) =>
              (row["neighbourhood_cleansed"]?.trim().toLowerCase() || "") ===
              $selectedNeighborhood.trim().toLowerCase(),
          )
          .map((row) => parseFloat(row["reviews_per_month"] || "0"))
          .filter((n) => !isNaN(n) && n > 0)
      : null;

  $: selectedAverageReviewsPerMonth =
    selectedNeighborhoodReviews && selectedNeighborhoodReviews.length
      ? +(
          selectedNeighborhoodReviews.reduce((sum, val) => sum + val, 0) /
          selectedNeighborhoodReviews.length
        ).toFixed(2)
      : null;

  // Min nights
  $: selectedNeighborhoodMinNights =
    $selectedNeighborhood && $detailedRows
      ? $detailedRows
          .filter(
            (row) =>
              (row["neighbourhood_cleansed"]?.trim().toLowerCase() || "") ===
              $selectedNeighborhood.trim().toLowerCase(),
          )
          .map((row) => {
            const val = row["minimum_nights"]?.trim() || "0";
            const parsedVal = parseInt(val, 10);
            return isNaN(parsedVal) ? 0 : parsedVal;
          })
          .filter((val) => val > 0)
      : null;

  $: selectedAverageMinNights =
    selectedNeighborhoodMinNights && selectedNeighborhoodMinNights.length
      ? (
          selectedNeighborhoodMinNights.reduce((sum, val) => sum + val, 0) /
          selectedNeighborhoodMinNights.length
        ).toFixed(2)
      : null;

  // Average revenue data
  $: selectedNeighborhoodRevenueData =
    $selectedNeighborhood && $detailedRows
      ? $detailedRows.filter(
          (row) =>
            (row["neighbourhood_cleansed"]?.trim().toLowerCase() || "") ===
            $selectedNeighborhood.trim().toLowerCase(),
        )
      : null;

  $: selectedNeighborhoodAverageEstimatedRevenue =
    selectedNeighborhoodRevenueData
      ? (() => {
          let revenueSum = 0;
          let listingCount = 0;

          for (const row of selectedNeighborhoodRevenueData) {
            let priceStr = (row["price"]?.trim() || "0").replace(
              /[^0-9.]/g,
              "",
            );
            const price = parseFloat(priceStr);
            const nightsOccupied = parseInt(
              row["estimated_occupancy_l365d"] || "0",
              10,
            );

            if (!isNaN(price) && !isNaN(nightsOccupied)) {
              revenueSum += price * nightsOccupied;
              listingCount += 1;
            }
          }

          const avgEstimatedRevenue =
            listingCount > 0 ? revenueSum / listingCount : 0;
          return +avgEstimatedRevenue.toFixed(2); // Return number rounded to 2 decimals
        })()
      : null;

  //ROI
type PrecomputedNeighborhoodData = {
  raw: RawMetrics;
  normalized: NormalizedMetrics;
};

// Empty fallback metrics
const emptyRaw: RawMetrics = {
  roi: 0,
  occupancyRate: 0,
  minNights: 0,
  reviewCount: 0,
  rating: 0,
};

const emptyNormalized: NormalizedMetrics = {
  roi: 0,
  occupancyRate: 0,
  minNights: 0,
  reviewCount: 0,
  rating: 0,
};

// Type guard
function isNeighborhoodData(obj: any): obj is PrecomputedNeighborhoodData {
  return obj && obj.raw && obj.normalized;
}

// Get neighborhood data safely
$: neighborhoodData = $selectedNeighborhood
  ? data.precomputedData.neighborhoods[$selectedNeighborhood]
  : null;

// Assign metrics with safe fallback
$: neighborhoodRawMetrics = isNeighborhoodData(neighborhoodData)
  ? neighborhoodData.raw
  : emptyRaw;

$: neighborhoodNormalized = isNeighborhoodData(neighborhoodData)
  ? neighborhoodData.normalized
  : emptyNormalized;

// Fallback ranges for chart axis scaling
$: neighborhoodRanges = data.precomputedData.ranges;

console.log("Precomputed Radar data", data.precomputedData.overall
);

data.precomputedData.overall
$: {
  console.log("Selected Neighborhood:", $selectedNeighborhood);
  console.log("Neighborhood Data:", neighborhoodData);
  console.log("Raw metrics:", neighborhoodRawMetrics);
  console.log("Normalized metrics:", neighborhoodNormalized);
}

console.log("Top Host data -",data.topHostsCalculated);
  // License summary
  $: selectedRegionLicenseSummary =
    $selectedNeighborhood && $detailedRows
      ? (() => {
          const filteredRows = $detailedRows.filter(
            (row) =>
              (row["neighbourhood_cleansed"]?.trim().toLowerCase() || "") ===
              $selectedNeighborhood.trim().toLowerCase(),
          );
          const counts: Record<string, number> = {};
          filteredRows.forEach((row) => {
            const category = getLicenseCategory(row["license"]);
            counts[category] = (counts[category] || 0) + 1;
          });
          return counts;
        })()
      : null;
</script>

<section class="kpi-grid">
  <div class="bg-white p-5 rounded shadow">
    <SummaryTiles
      label="Reviews Per Month"
      overviewValue={data.averageReviewsPerMonthRounded}
      selectedValue={selectedAverageReviewsPerMonth}
      unit=""
    />
  </div>
  <div class="bg-white p-5 rounded shadow">
    <SummaryTiles
      overviewValue={data.averageMinNightsRounded}
      label="Minimum Nights"
      selectedValue={selectedAverageMinNights}
      unit=""
    />
  </div>
  <div class="bg-white p-5 rounded shadow">
    <DonutChart
      summaryData={{
        overview: data.licenseSummary,
        region: selectedRegionLicenseSummary || undefined,
      }}
    />
  </div>
  <div class="bg-white p-5 rounded shadow">
    <SummaryTiles
      overviewValue={data.averageOccupancyRateRounded}
      selectedValue={selectedNeighborhoodOccupancyRate}
      label="Occupancy rate"
      unit="%"
    />
  </div>
  <div class="bg-white p-5 rounded shadow">
    <SummaryTiles
      overviewValue={data.avgEstimatedRevenueRounded}
      selectedValue={selectedNeighborhoodAverageEstimatedRevenue}
      label="Estimated Annual Revenue"
    />
  </div>
</section>

<section class="dashboard-row">
  <div class="map-container legend-container">
    <div class="flex items-center justify-between mb-2 w-full">
      <h2 class="whitespace-nowrap overflow-hidden text-ellipsis max-w-[80%]">
        {showSentiment
          ? "Sentiment Across Neighborhoods"
          : "Annual Revenue Potential Across Neighborhoods"}
      </h2>
      <button
        on:click={() => (showSentiment = !showSentiment)}
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {showSentiment ? "View Revenue" : "View Sentiment"}
      </button>
    </div>
    {#if showSentiment}
      <SentimentMap
        geojson={data.geojson}
        sentimentData={data.processedSentimentData}
      />
    {:else}
      <ChloroplethMap
        geojson={data.geojson}
        values={data.avgRevenueByNeighborhood}
        label="Average Revenue"
        unit="$"
        tooltipFormatter={(v) => v.toFixed(2)}
        colorRange={[
          "#f5f8fc", // pastel icy blue
          "#d0e1f2", // light powder blue
          "#a6c8e4", // soft muted sky blue
          "#679acb", // slate blue, mid contrast
          "#1e40af", // your main indigo
        ]}
      />
    {/if}
  </div>
  <div class="chart-container legend-container">
    <h2 class="text-lg font-semibold mb-2">Property Type Distribution</h2>
    <HorizontalBarChart
      data={$propertyTypeData}
      labelField="label"
      overallField="overall"
      {compareField}
    />
  </div>
  <div class="chart-container legend-container">
    <h2 class="text-lg font-semibold mb-2">
      Neighborhood Performance & ROI Radar
    </h2>
    <RadarChart
    overallData={{
      rawMetrics: data.precomputedData.overall.raw,
      normalized: data.precomputedData.overall.normalized
    }}
      neighborhoodNormalized={neighborhoodNormalized}
    neighborhoodRawMetrics={neighborhoodRawMetrics}/> 
    </div>
</section>

<section class="dashboard-row-2">
  <!-- <div class="bg-white p-4 rounded shadow"><HorizontalBarChart data={data.instantBookableCounts} />
      </div> -->
  <div class="chart-container legend-container">
    <h2 class="text-lg font-semibold mb-2">
      Neighborhood Popularity: Occupancy vs. Rating
    </h2>
    <BubbleChart
      data={data.bubbleData}
      xLabel="Average Occupancy Rate (%)"
      yLabel="Average Rating"
    />
  </div>
  <div class="chart-container legend-container">
    <h2 class="text-lg font-semibold mb-2">Top Earning Hosts</h2>
    <TopHosts topHosts={[...data.topHostsCalculated]}/>
  </div>
</section>
