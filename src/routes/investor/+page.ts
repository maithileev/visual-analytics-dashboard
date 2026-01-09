import type { PageLoad } from './$types';
import Papa from 'papaparse';
import { base } from '$app/paths';
import {calculateOverallOccupancyRate, groupAverageRevenueByNeighborhood} from '$lib/utils/aggregate';
import { prepareBubbleChart } from '$lib/utils/prepareBubbleChart';
import { aggregatePropertyType, aggregateROIFromRevenues, getMaxValues, aggregateMetrics} from '$lib/utils/aggregate';
import { selectedNeighborhood } from '$lib/stores/selectedNeighborhood';
import {preprocessSentimentData} from '$lib/utils/mapDataHelpers';
import { extractRadarData } from '$lib/utils/prepareRadarData';
import {computeOverallRadarMetrics} from '$lib/utils/radarNormalization'
import { getTopHosts } from '$lib/utils/getTopHosts';
import { precomputeRadarData } from '$lib/utils/precomputeRadarData';


let neighborhood: string | null = null;

export const load: PageLoad =  async function load({ fetch }) {

  const geoRes = await fetch(base + '/neighbourhoods.geojson');
  const geojson = await geoRes.json();

  const summary = await fetch(base + '/listings-summary.csv');
  const listings_summary = await summary.text();
  const parsed = Papa.parse(listings_summary, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true
  });
  const data = parsed.data as Record<string, string>[];
  const rows = parsed.data as any[];

  const sentimentMapData = await fetch(base + '/sentiment-by-neighbourhood.csv')
  const sentimentMapDataText = await sentimentMapData.text();
  const sentiment_map = Papa.parse(sentimentMapDataText, {
    header: true,
    delimiter: ',',
    skipEmptyLines: true
  });
  const sentimentData = sentiment_map.data as Record<string, string>[];
  const sentimentRows = sentiment_map.data as any[];
  console.log("Sentiment data",sentimentRows);

  const processedSentimentData = preprocessSentimentData(sentimentRows);
  console.log("Sentiment data",processedSentimentData);


  const details = await fetch(base + '/listings-detailed.csv')
  const listings_detailed = await details.text();
  const detailed_parsed = Papa.parse(listings_detailed, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true
  });
  const detailed_data = detailed_parsed.data as Record<string, string>[];
  const detailed_data_rows = detailed_parsed.data as any[];

  console.log(Object.keys(parsed.data[0]));
  console.log(Object.keys(detailed_parsed.data[0]));

  //License data
  function getLicenseCategory(value: string | undefined): string {
    if (!value || value.trim() === '') return 'No Info';

    const trimmed = value.trim().toLowerCase();

    if (trimmed.includes('applied')) return 'Applied';
    if (/^it[0-9a-z]+$/i.test(value.trim())) return 'Has License'; // Starts with "IT", alphanumeric
    if (/^\d+$/.test(trimmed)) return 'No Info'; 
  
    return 'No Info';
  }

  function countLicense(data: Record<string, string>[]) {
    const counts: Record<string, number> = {};
  
    detailed_data.forEach(detailed_data_rows => {
      const category = getLicenseCategory(detailed_data_rows['license']);
      counts[category] = (counts[category] || 0) + 1;
    });
  
    return counts;
  }

  const licenseSummary = countLicense(detailed_data);
  console.log("License summary is -", licenseSummary);
  type DataRow = Record<string, string>;

  function countBooleanStatus(
    detailed_data: DataRow[], 
    uniqueKey: string, 
    status: string, 
    trueValue: string = 't'
  ): Record<string, number> {
    const idStatusMap = new Map<string, boolean>();

    detailed_data.forEach(detailed_data_rows => {
      const id = detailed_data_rows[uniqueKey];
      const statusVal = (detailed_data_rows[status] || '').toLowerCase();
      if (!idStatusMap.has(id)) {
        idStatusMap.set(id, statusVal === trueValue);
      }
    });

    const counts: Record<string, number> = {
      'True': 0,
      'False': 0
    };

    idStatusMap.forEach(isTrue => {
      if (isTrue) counts['True'] += 1;
      else counts['False'] += 1;
    });

    return counts;
  }

  const instantBookableCountsRaw = countBooleanStatus(
    detailed_data,
    'id',
    'instant_bookable',
    't'
  );
  const instantBookableCounts = {
    'Instant bookable': instantBookableCountsRaw['True'],
    'Not Instant bookable': instantBookableCountsRaw['False']
  };

  const reviewsPerMonth: number[] = data
  .map(row => parseFloat(row['reviews_per_month'] || '0'))
  .filter(n => !isNaN(n) && n > 0);

  const totalReviewsPerMonth = reviewsPerMonth.reduce((sum, val) => sum + val, 0);
  const averageReviewsPerMonth = reviewsPerMonth.length ? (totalReviewsPerMonth / reviewsPerMonth.length) : 0;
  const averageReviewsPerMonthRounded = averageReviewsPerMonth.toFixed(2);

  // Min nights
  const minNightsArray: number[] = data
  .map(row => {
    const val = row['minimum_nights']?.trim() || '0';
    const parsedVal = parseInt(val, 10);
    return isNaN(parsedVal) ? 0 : parsedVal;
  })
  .filter(val => val > 0);

const averageMinNights = minNightsArray.length
  ? minNightsArray.reduce((sum, val) => sum + val, 0) / minNightsArray.length
  : 0;

const averageMinNightsRounded = averageMinNights.toFixed(2);
const averageOccupancyRateRounded = calculateOverallOccupancyRate(detailed_data);

//Overall Revenue 
let revenueSum = 0;
let listingCount = 0;

for (const row of detailed_data) {
  let priceStr = row['price']?.trim() || '0';
  priceStr = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(priceStr);

  const nightsOccupied = parseInt(row['estimated_occupancy_l365d'] || '0', 10);
  
  if (!isNaN(price) && !isNaN(nightsOccupied)) {
    const estimatedRevenue =  price * nightsOccupied;
    revenueSum += estimatedRevenue;
    listingCount += 1;
  }
}

const avgEstimatedRevenue = listingCount > 0 ? revenueSum / listingCount : 0;
const avgEstimatedRevenueRounded = avgEstimatedRevenue.toFixed(2);

// Revenue by Neighborhood
const avgRevenueByNeighborhood = groupAverageRevenueByNeighborhood(detailed_data);
console.log("Average Revenue data - ", avgRevenueByNeighborhood)

const bubbleData = prepareBubbleChart(detailed_data_rows, 'neighbourhood_cleansed', 'estimated_occupancy_l365d', 'review_scores_rating', 'availability_365');

//ROI

const radarListings = extractRadarData(detailed_data_rows);
console.log('Extracted count:', radarListings.length); // ~10k
const precomputedData = precomputeRadarData(radarListings);

const overallRadarData = computeOverallRadarMetrics(radarListings);
console.log('Aggregated:', overallRadarData); // single object with averages


const topHostsCalculated = getTopHosts(detailed_data_rows, 3);

return {
    geojson,
   licenseSummary,
   instantBookableCounts,
   averageReviewsPerMonthRounded,
   averageMinNightsRounded,
   averageOccupancyRateRounded,
   avgEstimatedRevenueRounded,
   avgRevenueByNeighborhood,
   bubbleData,
   detailed_data_rows,
   processedSentimentData,
   radarListings,
   overallRadarData,
   topHostsCalculated,
   precomputedData
  };

}
  