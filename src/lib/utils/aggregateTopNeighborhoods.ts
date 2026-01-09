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

const listing_url = `${base}/listings-detailed.csv`;
const sentiment_url = `${base}/sentiment-by-neighbourhood.csv`;

function normalize(value: number, min: number, max: number) {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

function calculateStartingPrice(raw: number[]): number {
  const prices = raw.filter(p => Number.isFinite(p) && p > 0).sort((a, b) => a - b);
  if (prices.length === 0) return 0;
  if (prices.length < 10) return prices[0];

  const rank = 0.10 * (prices.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  const w = rank - lo;
  return lo === hi ? prices[lo] : prices[lo] * (1 - w) + prices[hi] * w;
}

export async function loadAndAggregateTopNeighborhoods(fetchFn: typeof fetch): Promise<NeighborhoodStats[]> {
  const [listingsResp, sentimentResp] = await Promise.all([
    fetchFn(listing_url),
    fetchFn(sentiment_url),
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

  const sentimentMap = new Map<string, number>();
  for (const row of sentiments) {
    const neighborhood = row.neighbourhood?.trim();
    const score = parseFloat(row.avg_sentiment);
    if (neighborhood && !isNaN(score)) sentimentMap.set(neighborhood, score);
  }

  const neighborhoodGroups: Record<string, ListingRow[]> = {};
  for (const row of listings) {
    const n = row.neighbourhood_cleansed?.trim();
    if (!n) continue;
    if (!neighborhoodGroups[n]) neighborhoodGroups[n] = [];
    neighborhoodGroups[n].push(row);
  }

  const results: (NeighborhoodStats & { totalListings: number })[] = [];

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
      if (!isNaN(price) && price > 0) prices.push(price);
      if (!isNaN(reviews)) totalReviews += reviews;
      if (isInstant) instantBookableCount++;
    }

    if (ratings.length < 5 || prices.length < 5) continue;

    const p10 = calculateStartingPrice(prices);

    results.push({
      neighborhood,
      sentimentScore: round(sentiment),
      averageRating: round(ratings.reduce((a, b) => a + b, 0) / ratings.length),
      totalReviews,
      startingPrice: round(p10),
      percentInstantBookable: round((instantBookableCount / rows.length) * 100),
      totalListings: rows.length, 
    });
  }

  if (results.length === 0) return [];

  // Compute min/max for normalization
  const minSentiment = Math.min(...results.map(r => r.sentimentScore));
  const maxSentiment = Math.max(...results.map(r => r.sentimentScore));
  const minRating = Math.min(...results.map(r => r.averageRating));
  const maxRating = Math.max(...results.map(r => r.averageRating));
  const minReviews = Math.min(...results.map(r => r.totalReviews));
  const maxReviews = Math.max(...results.map(r => r.totalReviews));
  const minPrice = Math.min(...results.map(r => r.startingPrice));
  const maxPrice = Math.max(...results.map(r => r.startingPrice));
  const minInstant = Math.min(...results.map(r => r.percentInstantBookable));
  const maxInstant = Math.max(...results.map(r => r.percentInstantBookable));
  const minListings = Math.min(...results.map(r => r.totalListings));
  const maxListings = Math.max(...results.map(r => r.totalListings));

  const scoredResults = results.map(r => {
    const sentimentNorm = normalize(r.sentimentScore, minSentiment, maxSentiment);
    const ratingNorm = normalize(r.averageRating, minRating, maxRating);
    const reviewsNorm = normalize(r.totalReviews, minReviews, maxReviews);
    const priceNorm = 1 - normalize(r.startingPrice, minPrice, maxPrice); // lower better
    const instantNorm = normalize(r.percentInstantBookable, minInstant, maxInstant);
    const listingsNorm = normalize(r.totalListings, minListings, maxListings);

    const compositeScore =
      sentimentNorm * 0.25 +
      ratingNorm * 0.25 +
      reviewsNorm * 0.1 +
      priceNorm * 0.15 +
      instantNorm * 0.1 +
      listingsNorm * 0.15;

    return { ...r, compositeScore };
  });

  // Sort by composite score and take top 3
  return scoredResults
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 3)
    .map(r => {
      const { compositeScore, totalListings, ...rest } = r; 
      return rest;
    });
}
