import type { PageLoad } from './$types';
import Papa from 'papaparse';
import { base } from '$app/paths';
import { prepareBubbleChart} from '$lib/utils/prepareBubbleChart';
import {getAvailabilityHistogramDataByNeighborhood} from '$lib/utils/prepareHistogram';
import { aggregateRoomType, aggregateAverageRating, getTopNeighborhoods } from '$lib/utils/aggregate';
import {aggregateMultipleReviewScores,columns,reviewScores} from '$lib/utils/kpiHelpers'
import type {KPI} from '$lib/utils/kpiHelpers'
import type {NeighborhoodStats} from '$lib/utils/aggregateTopNeighborhoods';
import { loadAndAggregateTopNeighborhoods } from '$lib/utils/aggregateTopNeighborhoods';

export const load: PageLoad =  async function load({ fetch }) {

  const geoRes = await fetch(base + '/neighbourhoods.geojson');
  const geojson = await geoRes.json();

  const summary = await fetch(base + '/listings-summary.csv');
  const listings_summary = await summary.text();

  const details = await fetch(base + '/listings-detailed.csv')
  const listings_detailed = await details.text();
  const parsed = Papa.parse(listings_summary, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true
  });

  const detailed_parsed = Papa.parse(listings_detailed, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true
  });
  console.log(Object.keys(parsed.data[0]));

  const data = parsed.data as Record<string, string>[];
  const rows = parsed.data as any[];

  const detailed_data = detailed_parsed.data as Record<string, string>[];
  const detailed_data_rows = detailed_parsed.data as any[];

  //Available listings availability_365 > 0
  const availableStays = detailed_data.filter(row => {
    const value = parseInt(row['availability_365'] ?? '0', 10);
    return value > 0;
  }).length;


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

  const superhostCountsRaw = countBooleanStatus(
    detailed_data,
    'host_id',
    'host_is_superhost',
    't'
  );
  const superhostCounts = {
    'Superhost': superhostCountsRaw['True'],
    'Not Superhost': superhostCountsRaw['False']
  };


  // instant bookable or not
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

  const PRICE_THRESHOLD = 20;
  const MAX_MIN_NIGHTS = 180; // example cap to exclude long-term rentals
  
  const pricesPerDay: number[] = detailed_data
    .map(row => {
      let priceStr = row['price']?.trim() || '0';
      priceStr = priceStr.replace(/[^0-9.]/g, '');
      const price = parseFloat(priceStr);
  
      const minNights = parseInt(row['minimum_nights'] || '1');
  
      if (
        !isFinite(price) || price <= 0 ||
        !isFinite(minNights) || minNights <= 0 ||
        price < PRICE_THRESHOLD ||
        minNights > MAX_MIN_NIGHTS // Exclude long-term rentals
      ) {
        return null;
      }
  
      return price;  // <-- Use price as-is, since it's per night
    })
    .filter(p => p !== null) as number[];
  
  const totalPricePerDay = pricesPerDay.reduce((sum, p) => sum + p, 0);
  const averagePricePerDay = pricesPerDay.length ? totalPricePerDay / pricesPerDay.length : 0;
  const averagePricePerDayRounded = averagePricePerDay.toFixed(2);
  
  const minPrice = pricesPerDay.length ? Math.min(...pricesPerDay) : 0;
  const maxPrice = pricesPerDay.length ? Math.max(...pricesPerDay) : 0;
    
// console.log("averagePricePerDayRounded", averagePricePerDayRounded)
// console.log("minPrice", minPrice)
// console.log("maxPrice", maxPrice)

  //Average Ratings
  const ratings : number[] = detailed_data.map(detailed_data_rows =>     
    {let rating = detailed_data_rows['review_scores_rating']?.trim() || '0';
    return parseFloat(rating);
    }
  )
  .filter(rating => !isNaN(rating));
  console.log('Ratings',ratings[0-10]);

  const averageRating = ratings.length
  ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
  : 0;
  const averageRatingRounded = averageRating.toFixed(2);

// Popularity of neighborhoods based on price, rating, and no. of listings(bubble size)
const bubbleData = prepareBubbleChart(detailed_data_rows, 'neighbourhood_cleansed', 'price', 'review_scores_rating');
//console.log("Bubble data length - ",bubbleData.length);

// room type distribution
const overallRoomTypeData = aggregateRoomType(detailed_data_rows); // if selected neighborhood needed, pass it in too
//console.log('Chart data:', overallRoomTypeData);

const touristRatingData = aggregateAverageRating(detailed_data_rows);

// top 3 neighborhoods
const topNeighborhoods = await loadAndAggregateTopNeighborhoods(fetch);
const top3Neighborhoods = topNeighborhoods.slice(0,3);
console.log("top3Neighborhoods" , top3Neighborhoods)

//Average Availability for 365
const binnedDataOverall = getAvailabilityHistogramDataByNeighborhood(detailed_data_rows);

console.log(binnedDataOverall.length); // should be > 0
console.log(binnedDataOverall[0]);     // should include availability_365


let kpis: KPI[] = []
kpis = [...aggregateMultipleReviewScores(detailed_data_rows, columns, null)];
console.log("Value in ts -",kpis)
return {
    geojson,
    availableStays,
    averagePricePerDayRounded,
    minPrice,
    maxPrice,
   averageRatingRounded,
   superhostCounts,
   instantBookableCounts,
   bubbleData,
   overallRoomTypeData,
   touristRatingData,
   detailed_data_rows,
   binnedDataOverall,
   kpis,
   top3Neighborhoods
  };

}
  