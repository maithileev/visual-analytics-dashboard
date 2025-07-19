
<script lang="ts">
    import { currentTab } from '$lib/stores';
    import SummaryTiles from '$lib/components/SummaryTiles.svelte';
    import Map from '$lib/components/Map.svelte';
    import type { PageData } from './$types';
    import DonutChart from '$lib/charts/DonutChart.svelte';
    import HorizontalBarChart from '$lib/charts/HorizontalBarChart.svelte';
    import ChloroplethMap from '$lib/charts/ChloroplethMap.svelte';
    import BubbleChart from '$lib/charts/BubbleChart.svelte';
    import { onMount } from 'svelte';
    import { detailedRows } from '$lib/stores/chartData';
    import { propertyTypeData } from '$lib/stores/chartData';
    import { selectedNeighborhood } from '$lib/stores/selectedNeighborhood';
    import { derived } from 'svelte/store';


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
      detailed_data_rows : any;
    }
  
    export let data : PageData
    onMount(() => {
    detailedRows.set(data.detailed_data_rows); // ← inject the raw data only once
    selectedNeighborhood.set(null);
    });

    //for horizontal bar chaart
    let compareField = null;
    $: compareField = $selectedNeighborhood ? 'compare' : null;

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
  ? $detailedRows.filter(row =>
      (row['neighbourhood_cleansed']?.trim().toLowerCase() || '') === $selectedNeighborhood.trim().toLowerCase()
    )
  : null;

// // Compute occupancy rate in %
$: selectedNeighborhoodOccupancyRate = selectedNeighborhoodRowsForOccupancy && selectedNeighborhoodRowsForOccupancy.length
  ? (() => {
      let totalOccupiedDays = 0;
      let listingCount = 0;

      for (const row of selectedNeighborhoodRowsForOccupancy) {
        let occRaw = row.estimated_occupancy_l365d;
        if (typeof occRaw === 'string') {
          occRaw = occRaw.replace(/[^0-9.]/g, '');
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
    if (!value || value.trim() === '') return 'No Info';

    const trimmed = value.trim().toLowerCase();

    if (trimmed.includes('applied')) return 'Applied';
    if (trimmed.includes('exempt')) return 'Exempt';
    if (/^it[0-9a-z]+$/i.test(value.trim())) return 'Has License'; // Starts with "IT", alphanumeric
    if (/^\d+$/.test(trimmed)) return 'No Info'; // Only numbers (invalid)
  
    return 'No Info';
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
$: selectedNeighborhoodReviews = $selectedNeighborhood && $detailedRows
  ? $detailedRows
      .filter(row =>
        (row['neighbourhood_cleansed']?.trim().toLowerCase() || '') === $selectedNeighborhood.trim().toLowerCase()
      )
      .map(row => parseFloat(row['reviews_per_month'] || '0'))
      .filter(n => !isNaN(n) && n > 0)
  : null;

  $: selectedAverageReviewsPerMonth =
    selectedNeighborhoodReviews && selectedNeighborhoodReviews.length
    ? + (
        selectedNeighborhoodReviews.reduce((sum, val) => sum + val, 0) /
        selectedNeighborhoodReviews.length
      ).toFixed(2)
    : null;

// Min nights
$: selectedNeighborhoodMinNights = $selectedNeighborhood && $detailedRows
  ? $detailedRows
      .filter(row =>
        (row['neighbourhood_cleansed']?.trim().toLowerCase() || '') === $selectedNeighborhood.trim().toLowerCase()
      )
      .map(row => {
        const val = row['minimum_nights']?.trim() || '0';
        const parsedVal = parseInt(val, 10);
        return isNaN(parsedVal) ? 0 : parsedVal;
      })
      .filter(val => val > 0)
  : null;

  $: selectedAverageMinNights =
  selectedNeighborhoodMinNights && selectedNeighborhoodMinNights.length
    ? (selectedNeighborhoodMinNights.reduce((sum, val) => sum + val, 0) /
      selectedNeighborhoodMinNights.length).toFixed(2)
    : null;

// Average revenue data
$: selectedNeighborhoodRevenueData = $selectedNeighborhood && $detailedRows
  ? $detailedRows.filter(row =>
      (row['neighbourhood_cleansed']?.trim().toLowerCase() || '') === $selectedNeighborhood.trim().toLowerCase()
    )
  : null;

  $: selectedNeighborhoodAverageEstimatedRevenue = selectedNeighborhoodRevenueData
  ? (() => {
      let revenueSum = 0;
      let listingCount = 0;

      for (const row of selectedNeighborhoodRevenueData) {
        let priceStr = (row['price']?.trim() || '0').replace(/[^0-9.]/g, '');
        const price = parseFloat(priceStr);
        const nightsOccupied = parseInt(row['estimated_occupancy_l365d'] || '0', 10);

        if (!isNaN(price) && !isNaN(nightsOccupied)) {
          revenueSum += price * nightsOccupied;
          listingCount += 1;
        }
      }

      const avgEstimatedRevenue = listingCount > 0 ? revenueSum / listingCount : 0;
      return +avgEstimatedRevenue.toFixed(2);  // Return number rounded to 2 decimals
    })()
  : null;

// License summary
$: selectedRegionLicenseSummary = $selectedNeighborhood && $detailedRows
  ? (() => {
      const filteredRows = $detailedRows.filter(row =>
        (row['neighbourhood_cleansed']?.trim().toLowerCase() || '') === $selectedNeighborhood.trim().toLowerCase()
      );
      const counts: Record<string, number> = {};
      filteredRows.forEach(row => {
        const category = getLicenseCategory(row['license']);
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
        unit="" />
      </div>
    <div class="bg-white p-5 rounded shadow">
        <SummaryTiles 
        overviewValue={data.averageMinNightsRounded} 
        label="Minimum Nights"
        selectedValue={selectedAverageMinNights} 
        unit=""/>
    </div>
    <div class="bg-white p-5 rounded shadow">
        <DonutChart summaryData={{overview: data.licenseSummary,
        region: selectedRegionLicenseSummary || undefined }} />
    </div>
    <div class="bg-white p-5 rounded shadow">
        <SummaryTiles 
        overviewValue={data.averageOccupancyRateRounded}
        selectedValue = {selectedNeighborhoodOccupancyRate}
        label="Occupancy rate"
        unit="%"/>
    </div>
    <div class="bg-white p-5 rounded shadow">
        <SummaryTiles 
        overviewValue={data.avgEstimatedRevenueRounded}
        selectedValue={selectedNeighborhoodAverageEstimatedRevenue}
        label="Estimated Annual Revenue"  />
    </div>

  </section>
  
  <section class="dashboard-row">
    <div class="map-container legend-container">
      <h2 class="text-lg font-semibold mb-2">Annual Revenue Potential Across Neighborhoods</h2>
      <ChloroplethMap geojson={data.geojson}
        values={data.avgRevenueByNeighborhood}       
        label="Average Revenue"
        unit="$"
        tooltipFormatter={(v) => v.toFixed(2)} 
        colorRange={["#e6f2f8",  // very light sky blue
        "#a8d0e6",  // light blue
        "#5ca7c8",  // medium blue
        "#2c6b8f",  // deep blue
        "#1b3e57"   // darkest navy blue
        ]} />   
    </div>
    <div class="chart-container legend-container">
      <h2 class="text-lg font-semibold mb-2">Property Type Distribution</h2>
        <HorizontalBarChart
        data={$propertyTypeData}
        labelField="label"
        overallField="overall"
        compareField={compareField}/>
    </div>
    <div class="chart-container legend-container">
      <h2 class="text-lg font-semibold mb-2">Chart 2 here</h2>
    </div>
  </section>
  
  <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- <div class="bg-white p-4 rounded shadow"><HorizontalBarChart data={data.instantBookableCounts} />
      </div> -->
      <div class="bg-white p-4 rounded shadow">
        <h2 class="text-lg font-semibold mb-2">Neighborhood Popularity: Occupancy vs. Rating</h2>
        <BubbleChart data={data.bubbleData}  
        xLabel="Average Occupancy Rate (%)"
        yLabel="Average Rating"
            />
      </div>
  </section> 
  <div class="bg-white p-4 rounded shadow">
    <h2 class="text-lg font-semibold mb-2">Recommendations</h2>
  </div>