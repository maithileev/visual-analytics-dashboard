import type { PageLoad } from './$types';
import Papa from 'papaparse';
import { base } from '$app/paths';

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
  const availableStays = data.filter(row => {
    const value = parseInt(row['availability_365'] ?? '0', 10);
    return value > 0;
  }).length;

  //License data
  function getLicenseCategory(value: string | undefined): string {
    if (!value || value.trim() === '') return 'No Info';

    const trimmed = value.trim().toLowerCase();

    if (trimmed.includes('applied')) return 'Applied';
    if (trimmed.includes('exempt')) return 'Exempt';
    if (/^it[0-9a-z]+$/i.test(value.trim())) return 'Has License'; // Starts with "IT", alphanumeric
    if (/^\d+$/.test(trimmed)) return 'Incorrect'; // Only numbers (invalid)
  
    return 'Other';
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
  console.log(superhostCounts)
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

  console.log(instantBookableCounts)
  //Average Price
  const prices: number[] = detailed_data
  .map(detailed_data_rows => {
    let priceStr = detailed_data_rows['price']?.trim() || '0';
    priceStr = priceStr.replace(/[^0-9.]/g, '');
    return parseFloat(priceStr);
  })
  .filter(price => !isNaN(price) && price > 0);

  const totalPrice = prices.reduce((sum, p) => sum + p, 0);
  const averagePrice = prices.length ? (totalPrice / rows.length) : 0;

  const sortedPricesDesc = prices.sort((a, b) => b - a);
  //console.log("Prices" , sortedPricesDesc);
  // Round to 2 decimals
  const averagePriceRounded = averagePrice.toFixed(2);

  //Min and Max price range
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  console.log('Cleaned price values:', prices.slice(0, 10));
  console.log('Min:', minPrice, 'Max:', maxPrice);

  //Average Ratings
  const ratings : number[] = detailed_data.map(detailed_data_rows =>     
    {let rating = detailed_data_rows['review_scores_rating']?.trim() || '0';
    return parseFloat(rating);
    }
  )
  .filter(rating => !isNaN(rating));
  // console.log('Ratings',ratings[0-10]);

  const averageRating = ratings.length
  ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
  : 0;
  const averageRatingRounded = averageRating.toFixed(2);


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

// Round to 2 decimals
const averageMinNightsRounded = averageMinNights.toFixed(2);


// Occupancy Rate
const occupancyRates = data
  .map(row => {
    const availabilityStr = row['availability_365']?.trim() || '0';
    const availability = parseInt(availabilityStr, 10);
    return isNaN(availability) ? 0 : availability / 365;
  })
  .filter(rate => rate > 0);

const averageOccupancyRate = occupancyRates.length
  ? (occupancyRates.reduce((sum, r) => sum + r, 0) / occupancyRates.length) * 100
  : 0;

const averageOccupancyRateRounded = averageOccupancyRate.toFixed(2);

//Revenue 
let revenueSum = 0;
let listingCount = 0;

for (const row of detailed_data) {
  let priceStr = row['price']?.trim() || '0';
  priceStr = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(priceStr);

  const nightsAvailable = parseInt(row['availability_365'] || '0', 10);
  const occupancyRate = nightsAvailable / 365;

  if (!isNaN(price) && !isNaN(nightsAvailable)) {
    const estimatedRevenue = occupancyRate * price * nightsAvailable;
    revenueSum += estimatedRevenue;
    listingCount += 1;
  }
}

const avgEstimatedRevenue = listingCount > 0 ? revenueSum / listingCount : 0;
const avgEstimatedRevenueRounded = avgEstimatedRevenue.toFixed(2);

  return {
    geojson,
    availableStays,
    averagePriceRounded,
    minPrice,
    maxPrice,
   averageRatingRounded,
   licenseSummary,
   superhostCounts,
   instantBookableCounts,
   averageReviewsPerMonthRounded,
   averageMinNightsRounded,
   averageOccupancyRateRounded,
   avgEstimatedRevenueRounded
  };

}
  