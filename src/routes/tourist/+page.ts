import type { PageLoad } from './$types';
import Papa from 'papaparse';
import { base } from '$app/paths';
import { prepareBubbleChart } from '$lib/utils/prepareBubbleChart';
import { aggregateRoomType, aggregateAverageRating } from '$lib/utils/aggregate';
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
  console.log('Ratings',ratings[0-10]);

  const averageRating = ratings.length
  ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
  : 0;
  const averageRatingRounded = averageRating.toFixed(2);

// Popularity of neighborhoods based on price, rating, and no. of listings(bubble size)
const bubbleData = prepareBubbleChart(detailed_data_rows, 'neighbourhood_cleansed', 'price', 'review_scores_rating');
console.log("Bubble data length - ",bubbleData.length);

// room type distribution
const overallRoomTypeData = aggregateRoomType(detailed_data_rows); // if selected neighborhood needed, pass it in too
console.log('Chart data:', overallRoomTypeData);

const touristRatingData = aggregateAverageRating(detailed_data_rows);

return {
    geojson,
    availableStays,
    averagePriceRounded,
    minPrice,
    maxPrice,
   averageRatingRounded,
   superhostCounts,
   instantBookableCounts,
   bubbleData,
   overallRoomTypeData,
   touristRatingData
  };

}
  