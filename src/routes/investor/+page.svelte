<script lang="ts">
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
    findMaxValues,
  } from "$lib/utils/radarNormalization";
  import type { RadarInputListing } from "$lib/utils/prepareRadarData";
  import RadarChart from "$lib/charts/RadarChart.svelte";
  import TopHosts from "$lib/components/TopHosts.svelte";

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
    topHosts: any;
    topHostsCalculated: any;
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
        (row) =>
          (row["neighbourhood_cleansed"]?.trim().toLowerCase() || "") ===
          $selectedNeighborhood.trim().toLowerCase(),
      )
    : null;

  // // Compute occupancy rate in %
  $: selectedNeighborhoodOccupancyRate =
    selectedNeighborhoodRowsForOccupancy &&
    selectedNeighborhoodRowsForOccupancy.length
      ? (() => {
          let totalOccupiedDays = 0;
          let listingCount = 0;

          for (const row of selectedNeighborhoodRowsForOccupancy) {
            let occRaw = row.estimated_occupancy_l365d;
            if (typeof occRaw === "string") {
              occRaw = occRaw.replace(/[^0-9.]/g, "");
            }
            const occupied = parseFloat(occRaw);
            if (!isNaN(occupied)) {
              totalOccupiedDays += occupied;
              listingCount += 1;
            }
          }

          if (listingCount === 0) return null;
          const rate = (totalOccupiedDays / listingCount) * (100 / 365);
          return +rate.toFixed(2); // Rounded to 2 decimals
        })()
      : null;

  //Licensed
  function getLicenseCategory(value: string | undefined): string {
    if (!value || value.trim() === "") return "No Info";

    const trimmed = value.trim().toLowerCase();

    if (trimmed.includes("applied")) return "Applied";
    if (trimmed.includes("exempt")) return "Exempt";
    if (/^it[0-9a-z]+$/i.test(value.trim())) return "Has License"; // Starts with "IT", alphanumeric
    if (/^\d+$/.test(trimmed)) return "No Info"; // Only numbers (invalid)

    return "No Info";
  }

  // Reactive statement to compute license summary for selected region/neighborhood
  // $: selectedRegionLicenseSummary = $selectedNeighborhood
  //   ? (() => {
  //       const filteredRows = $detailedRows.filter(row =>
  //         (row['neighbourhood_cleansed']?.trim().toLowerCase() || '') === $selectedNeighborhood.trim().toLowerCase()
  //       );
  //       const counts: Record<string, number> = {};
  //       filteredRows.forEach(row => {
  //         const category = getLicenseCategory(row['license']);
  //         counts[category] = (counts[category] || 0) + 1;
  //       });
  //       return counts;
  //     })()
  //   : null;

  //     $: console.log('summaryData', selectedRegionLicenseSummary);

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
  // 1. filter listings based on selectedNeighborhood (safe string checks)
  $: filteredListings = $selectedNeighborhood
    ? data.radarListings.filter((l) => {
        const listingNeighborhood =
          typeof l.neighborhood === "string"
            ? l.neighborhood.trim().toLowerCase()
            : "";
        const selNeighborhood =
          typeof $selectedNeighborhood === "string"
            ? $selectedNeighborhood.trim().toLowerCase()
            : "";
        return listingNeighborhood === selNeighborhood;
      })
    : data.radarListings;

  // 2. aggregate raw metrics on filtered listings
  $: neighborhoodRawMetrics = aggregateRadarMetrics(filteredListings);

  // 3. compute max values for normalization, fallback to overall maxValues
  $: neighborhoodMaxValues = filteredListings.length
    ? findMaxValues(filteredListings)
    : data.overallRadarData.maxValues;

  // 4. normalize metrics for neighborhood or null if none selected
  $: neighborhoodNormalized =
    $selectedNeighborhood && filteredListings.length > 0
      ? normalizeRadarMetrics(neighborhoodRawMetrics, neighborhoodMaxValues)
      : null;

  $: {
    console.log("Selected Neighborhood:", $selectedNeighborhood);
    console.log("Filtered Listings count:", filteredListings.length);
    console.log("Raw metrics:", neighborhoodRawMetrics);
    console.log("Max values:", neighborhoodMaxValues);
    console.log("Normalized:", neighborhoodNormalized);
  }

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
      overallData={data.overallRadarData.normalized}
      {neighborhoodNormalized}
    />
  </div>
</section>

<section class="dashboard-row-2">
  <!-- <div class="bg-white p-4 rounded shadow"><HorizontalBarChart data={data.instantBookableCounts} />
      </div> -->
  <div>
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
    <TopHosts topHosts={data.topHostsCalculated} />
  </div>
</section>
