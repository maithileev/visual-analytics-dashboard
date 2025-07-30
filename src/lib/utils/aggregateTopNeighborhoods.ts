// import Papa from 'papaparse';
// import { base } from '$app/paths';


// export interface NeighborhoodStats {
//   neighborhood: string;
//   sentimentScore: number;
//   averageRating: number;
//   totalReviews: number;
//   startingPrice: number;
//   percentInstantBookable: number;
// }

// interface ListingRow {
//   neighbourhood_cleansed: string;
//   review_scores_rating: string;
//   number_of_reviews: string;
//   price: string;
//   instant_bookable: string;
// }

// interface SentimentRow {
//   neighbourhood_cleansed: string;
//   sentiment_score: string;
// }

// function parsePrice(priceStr: string): number {
//   return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
// }

// function round(n: number, digits = 2) {
//   return Math.round(n * 10 ** digits) / 10 ** digits;
// }

// export async function loadAndAggregateTopNeighborhoods(fetchFn: typeof fetch): Promise<NeighborhoodStats[]> {
//   const [listingsResp, sentimentResp] = await Promise.all([
//     fetchFn(`/listings-detailed.csv`),
//     fetchFn(`/sentiment-by-neighbourhood.csv`),
//     ]);

//   const listingsText = await listingsResp.text();
//   const sentimentText = await sentimentResp.text();

//   const listings = Papa.parse<ListingRow>(listingsText, {
//     header: true,
//     skipEmptyLines: true,
//   }).data;

//   const sentiments = Papa.parse<SentimentRow>(sentimentText, {
//     header: true,
//     skipEmptyLines: true,
//   }).data;

//   // Map neighborhood → sentiment score
//   const sentimentMap = new Map<string, number>();
//   for (const row of sentiments) {
//     const neighborhood = row.neighbourhood?.trim();
//     const score = parseFloat(row.avg_sentiment);
//     if (neighborhood && !isNaN(score)) {
//       sentimentMap.set(neighborhood, score);
//     }
//   }

//   // Aggregate stats by neighborhood
//   const neighborhoodGroups: Record<string, ListingRow[]> = {};
//   for (const row of listings) {
//     const n = row.neighbourhood_cleansed?.trim();
//     if (!n) continue;
//     if (!neighborhoodGroups[n]) neighborhoodGroups[n] = [];
//     neighborhoodGroups[n].push(row);
//   }

//   const results: NeighborhoodStats[] = [];

//   for (const [neighborhood, rows] of Object.entries(neighborhoodGroups)) {
//     const sentiment = sentimentMap.get(neighborhood) ?? 0;

//     const ratings: number[] = [];
//     const prices: number[] = [];
//     let totalReviews = 0;
//     let instantBookableCount = 0;

//     for (const r of rows) {
//       const rating = parseFloat(r.review_scores_rating);
//       const price = parsePrice(r.price);
//       const reviews = parseInt(r.number_of_reviews);
//       const isInstant = r.instant_bookable === 't';

//       if (!isNaN(rating)) ratings.push(rating);
//       if (!isNaN(price)) prices.push(price);
//       if (!isNaN(reviews)) totalReviews += reviews;
//       if (isInstant) instantBookableCount++;
//     }

//     if (ratings.length < 5 || prices.length < 5) continue; // Filter sparse data

//     // Calculate 10th percentile of price as "starting price"
//     prices.sort((a, b) => a - b);
//     const p10 = prices[Math.floor(prices.length * 0.1)];

//     results.push({
//       neighborhood,
//       sentimentScore: round(sentiment),
//       averageRating: round(ratings.reduce((a, b) => a + b, 0) / ratings.length),
//       totalReviews,
//       startingPrice: round(p10),
//       percentInstantBookable: round((instantBookableCount / rows.length) * 100),
//     });
//   }

//   // Sort by sentiment score then average rating
//   return results.sort((a, b) => b.sentimentScore - a.sentimentScore || b.averageRating - a.averageRating);
// }




import Papa from 'papaparse';
import { base } from '$app/paths';

export interface NeighborhoodStats {
  neighborhood: string;
  sentimentScore: number;
  averageRating: number;
  totalReviews: number;
  startingPrice: number;
  percentInstantBookable: number;
}

interface ListingRow {
  neighbourhood_cleansed: string;
  review_scores_rating: string;
  number_of_reviews: string;
  price: string;
  instant_bookable: string;
}

interface SentimentRow {
  neighbourhood: string;
  avg_sentiment: string;
}

function parsePrice(priceStr: string): number {
  return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
}

function round(n: number, digits = 2) {
  return Math.round(n * 10 ** digits) / 10 ** digits;
}

export async function loadAndAggregateTopNeighborhoods(fetchFn: typeof fetch): Promise<NeighborhoodStats[]> {
  const [listingsResp, sentimentResp] = await Promise.all([
    fetchFn(`/listings-detailed.csv`),
    fetchFn(`/sentiment-by-neighbourhood.csv`),
  ]);

  const listingsText = await listingsResp.text();
  const sentimentText = await sentimentResp.text();

  const listings = Papa.parse<ListingRow>(listingsText, {
    header: true,
    skipEmptyLines: true,
  }).data;

  const sentiments = Papa.parse<SentimentRow>(sentimentText, {
    header: true,
    skipEmptyLines: true,
  }).data;

  console.log('Parsed listings count:', listings.length);
  console.log('Parsed sentiments count:', sentiments.length);

  // Map neighborhood → sentiment score
  const sentimentMap = new Map<string, number>();
  for (const row of sentiments) {
    const neighborhood = row.neighbourhood?.trim();
    const score = parseFloat(row.avg_sentiment);
    if (neighborhood && !isNaN(score)) {
      sentimentMap.set(neighborhood, score);
    }
  }

  console.log('Sentiment map size:', sentimentMap.size);
  console.log('Example sentiments:', Array.from(sentimentMap.entries()).slice(0, 3));

  // Aggregate stats by neighborhood
  const neighborhoodGroups: Record<string, ListingRow[]> = {};
  for (const row of listings) {
    const n = row.neighbourhood_cleansed?.trim();
    if (!n) continue;
    if (!neighborhoodGroups[n]) neighborhoodGroups[n] = [];
    neighborhoodGroups[n].push(row);
  }

  const results: NeighborhoodStats[] = [];

  for (const [neighborhood, rows] of Object.entries(neighborhoodGroups)) {
    const sentiment = sentimentMap.get(neighborhood) ?? 0;

    const ratings: number[] = [];
    const prices: number[] = [];
    let totalReviews = 0;
    let instantBookableCount = 0;

    for (const r of rows) {
      const rating = parseFloat(r.review_scores_rating);
      const price = parsePrice(r.price);
      const reviews = parseInt(r.number_of_reviews);
      const isInstant = r.instant_bookable === 't';

      if (!isNaN(rating)) ratings.push(rating);
      if (!isNaN(price)) prices.push(price);
      if (!isNaN(reviews)) totalReviews += reviews;
      if (isInstant) instantBookableCount++;
    }

    if (ratings.length < 5 || prices.length < 5) continue; // Filter sparse data

    // Calculate 10th percentile of price as "starting price"
    prices.sort((a, b) => a - b);
    const p10 = prices[Math.floor(prices.length * 0.1)];

    results.push({
      neighborhood,
      sentimentScore: round(sentiment),
      averageRating: round(ratings.reduce((a, b) => a + b, 0) / ratings.length),
      totalReviews,
      startingPrice: round(p10),
      percentInstantBookable: round((instantBookableCount / rows.length) * 100),
    });
  }

  return results.sort((a, b) => b.sentimentScore - a.sentimentScore || b.averageRating - a.averageRating);
}

