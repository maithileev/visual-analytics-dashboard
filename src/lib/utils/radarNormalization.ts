
// import { pricePerM2Lookup } from './pricePerM2Lookup';

// export const AVERAGE_SIZE_M2 = 75;
// export const ANNUAL_EXPENSES = 2000;

// export type MinMax = { min: number; max: number };
// export type Ranges = {
//   roi: MinMax;
//   occupancyRate: MinMax;
//   minNights: MinMax;
//   reviewCount: MinMax;
//   rating: MinMax;
// };


// export function normalizeROI(roi: number): number {
//   const min = -5;
//   const max = 20;
//   return Math.max(0, Math.min((roi - min) / (max - min), 1));
// }

// export function normalizeOccupancy(occupancyDays: number): number {
//   return Math.min(Math.max(occupancyDays / 365, 0), 1);
// }

// export function normalizeMinNights(minNights: number, maxMinNights: number): number {
//   if (maxMinNights === 0) return 0;
//   return 1 - Math.min(Math.max(minNights, 0), maxMinNights) / maxMinNights;
// }

// export function normalizeReviewCount(reviewCount: number, maxReviewCount: number): number {
//   if (maxReviewCount === 0) return 0;
//   return Math.min(Math.max(reviewCount / maxReviewCount, 0), 1);
// }

// export function normalizeRating(rating: number): number {
//   return Math.min(Math.max(rating / 5, 0), 1);
// }

// export type RawMetrics = {
//   roi: number;
//   occupancyRate: number;
//   minNights: number;
//   reviewCount: number;
//   rating: number;
// };

// export type NormalizedMetrics = {
//   roi: number;
//   occupancyRate: number;
//   minNights: number;
//   reviewCount: number;
//   rating: number;
// };

// export function normalizeRadarMetrics(
//   raw: RawMetrics,
//   maxValues: RawMetrics): NormalizedMetrics {
//   return {
//     roi: normalizeROI(raw.roi),
//     occupancyRate: normalizeOccupancy(raw.occupancyRate),
//     minNights: normalizeMinNights(raw.minNights, maxValues.minNights),
//     reviewCount: normalizeReviewCount(raw.reviewCount, maxValues.reviewCount),
//     rating: normalizeRating(raw.rating),
//   };
// }

// export type RadarInputListing = {
//   annualRevenue: number;
//   neighborhood: string;
//   estimated_occupancy_l365d: number;
//   minimum_nights: number;
//   number_of_reviews: number;
//   review_scores_rating: number;
// };

// export function aggregateRadarMetrics(listings: RadarInputListing[]): RawMetrics {
//   const fallbackPricePerM2 =
//     Object.values(pricePerM2Lookup).reduce((a, b) => a + b, 0) / Object.values(pricePerM2Lookup).length;

//   const count = listings.length;
//   if (count === 0) {
//     return { roi: 0, occupancyRate: 0, minNights: 0, reviewCount: 0, rating: 0 };
//   }

//   let totalROI = 0;
//   let totalOccupancy = 0;
//   let totalMinNights = 0;
//   let totalReviews = 0;
//   let totalRating = 0;

//   for (const listing of listings) {
//     const pricePerM2 = pricePerM2Lookup[listing.neighborhood] ?? fallbackPricePerM2;
//     const propertyPrice = pricePerM2 * AVERAGE_SIZE_M2;
//     const roi =
//       propertyPrice > 0
//         ? ((listing.annualRevenue - ANNUAL_EXPENSES) / propertyPrice) * 100
//         : 0;

//     totalROI += roi;
//     totalOccupancy += listing.estimated_occupancy_l365d;
//     totalMinNights += listing.minimum_nights;
//     totalReviews += listing.number_of_reviews;
//     totalRating += listing.review_scores_rating;
//   }

//   return {
//     roi: totalROI / count,
//     occupancyRate: totalOccupancy / count,  // renamed here
//     minNights: totalMinNights / count,
//     reviewCount: totalReviews / count,
//     rating: totalRating / count,
//   };
// }

// export function findMinMaxValues(listings: RadarInputListing[]): Ranges {
//   const init: MinMax = { min: Infinity, max: -Infinity };

//   const ranges: Ranges = {
//     roi: { ...init },
//     occupancyRate: { ...init },
//     minNights: { ...init },
//     reviewCount: { ...init },
//     rating: { ...init },
//   };

//   for (const listing of listings) {
//     const pricePerM2 = pricePerM2Lookup[listing.neighborhood] ?? 0;
//     const propertyPrice = pricePerM2 * AVERAGE_SIZE_M2;
//     const roi =
//       propertyPrice > 0
//         ? ((listing.annualRevenue - ANNUAL_EXPENSES) / propertyPrice) * 100
//         : 0;

//     // roi
//     ranges.roi.min = Math.min(ranges.roi.min, roi);
//     ranges.roi.max = Math.max(ranges.roi.max, roi);

//     // occupancy (days in last 365)
//     const occ = listing.estimated_occupancy_l365d ?? 0;
//     ranges.occupancyRate.min = Math.min(ranges.occupancyRate.min, occ);
//     ranges.occupancyRate.max = Math.max(ranges.occupancyRate.max, occ);

//     // min nights (lower is better => we’ll invert later)
//     const mn = listing.minimum_nights ?? 0;
//     ranges.minNights.min = Math.min(ranges.minNights.min, mn);
//     ranges.minNights.max = Math.max(ranges.minNights.max, mn);

//     // reviews
//     const rc = listing.number_of_reviews ?? 0;
//     ranges.reviewCount.min = Math.min(ranges.reviewCount.min, rc);
//     ranges.reviewCount.max = Math.max(ranges.reviewCount.max, rc);

//     // rating (0..5)
//     const rating = listing.review_scores_rating ?? 0;
//     ranges.rating.min = Math.min(ranges.rating.min, rating);
//     ranges.rating.max = Math.max(ranges.rating.max, rating);
//   }

//   // Handle empty lists gracefully
//   const fix = (p: MinMax): MinMax =>
//     (p.min === Infinity || p.max === -Infinity) ? { min: 0, max: 0 } : p;

//   return {
//     roi: fix(ranges.roi),
//     occupancyRate: fix(ranges.occupancyRate),
//     minNights: fix(ranges.minNights),
//     reviewCount: fix(ranges.reviewCount),
//     rating: fix(ranges.rating),
//   };
// }

// // Compute overall max values from all listings
// export function computeOverallMaxValues(listings: RadarInputListing[]) {
//   return findMaxValues(listings);
// }

// export function computeOverallRanges(listings: RadarInputListing[]): Ranges {
//   return findMinMaxValues(listings);
// }

// // Compute overall normalized radar metrics
// export function computeOverallRadarMetrics(listings: RadarInputListing[]) {
//   const ranges = findMinMaxValues(listings); // for minNights, reviewCount
//   const rawMetrics = aggregateRadarMetrics(listings);
//   const normalized = normalizeRadarMetrics(rawMetrics, maxValues);
//   return {
//     rawMetrics,
//     ranges,
//     normalized,
//   };
// }


import { pricePerM2Lookup } from './pricePerM2Lookup';

export const AVERAGE_SIZE_M2 = 75;
export const ANNUAL_EXPENSES = 2000;

export type MinMax = { min: number; max: number };

export type Ranges = {
  roi: MinMax;
  occupancyRate: MinMax;
  minNights: MinMax;
  reviewCount: MinMax;
  rating: MinMax;
};

export type RawMetrics = {
  roi: number;
  occupancyRate: number;
  minNights: number;
  reviewCount: number;
  rating: number;
};

export type NormalizedMetrics = {
  roi: number;
  occupancyRate: number;
  minNights: number;
  reviewCount: number;
  rating: number;
};

export type RadarInputListing = {
  annualRevenue: number;
  neighborhood: string;
  estimated_occupancy_l365d: number;
  minimum_nights: number;
  number_of_reviews: number;
  review_scores_rating: number;
};

// ------------------- Normalization Functions -------------------

export function normalizeROI(roi: number): number {
  const min = -2;
  const max = 20;
  return Math.max(0, Math.min((roi - min) / (max - min), 1));
}

export function normalizeOccupancy(occupancyDays: number): number {
  return Math.min(Math.max(occupancyDays / 365, 0), 1);
}

export function normalizeMinNights(minNights: number, maxMinNights: number): number {
  if (maxMinNights === 0) return 0;
  return 1 - Math.min(Math.max(minNights, 0), maxMinNights) / maxMinNights;
}

export function normalizeReviewCount(reviewCount: number, maxReviewCount: number): number {
  if (maxReviewCount === 0) return 0;
  return Math.min(Math.max(reviewCount / maxReviewCount, 0), 1);
}

export function normalizeRating(rating: number): number {
  return Math.min(Math.max(rating / 5, 0), 1);
}

export function normalizeRadarMetrics(raw: RawMetrics, maxValues: RawMetrics): NormalizedMetrics {
  return {
    roi: normalizeROI(raw.roi),
    occupancyRate: normalizeOccupancy(raw.occupancyRate),
    minNights: normalizeMinNights(raw.minNights, maxValues.minNights),
    reviewCount: normalizeReviewCount(raw.reviewCount, maxValues.reviewCount),
    rating: normalizeRating(raw.rating),
  };
}

// ------------------- Aggregation Functions -------------------

export function aggregateRadarMetrics(listings: RadarInputListing[]): RawMetrics {
  const fallbackPricePerM2 =
    Object.values(pricePerM2Lookup).reduce((a, b) => a + b, 0) / Object.values(pricePerM2Lookup).length;

  const count = listings.length;
  if (count === 0) {
    return { roi: 0, occupancyRate: 0, minNights: 0, reviewCount: 0, rating: 0 };
  }

  let totalROI = 0;
  let totalOccupancy = 0;
  let totalMinNights = 0;
  let totalReviews = 0;
  let totalRating = 0;

  for (const listing of listings) {
    const pricePerM2 = pricePerM2Lookup[listing.neighborhood] ?? fallbackPricePerM2;
    const propertyPrice = pricePerM2 * AVERAGE_SIZE_M2;
    const roi =
      propertyPrice > 0
        ? ((listing.annualRevenue - ANNUAL_EXPENSES) / propertyPrice) * 100
        : 0;

    totalROI += roi;
    totalOccupancy += listing.estimated_occupancy_l365d;
    totalMinNights += listing.minimum_nights;
    totalReviews += listing.number_of_reviews;
    totalRating += listing.review_scores_rating;
  }

  return {
    roi: totalROI / count,
    occupancyRate: totalOccupancy / count,
    minNights: totalMinNights / count,
    reviewCount: totalReviews / count,
    rating: totalRating / count,
  };
}

// ------------------- Min/Max Computation -------------------

export function findMinMaxValues(listings: RadarInputListing[]): Ranges {
  const init: MinMax = { min: Infinity, max: -Infinity };

  const ranges: Ranges = {
    roi: { ...init },
    occupancyRate: { ...init },
    minNights: { ...init },
    reviewCount: { ...init },
    rating: { ...init },
  };

  for (const listing of listings) {
    const pricePerM2 = pricePerM2Lookup[listing.neighborhood] ?? 0;
    const propertyPrice = pricePerM2 * AVERAGE_SIZE_M2;
    const roi =
      propertyPrice > 0
        ? ((listing.annualRevenue - ANNUAL_EXPENSES) / propertyPrice) * 100
        : 0;

    ranges.roi.min = Math.min(ranges.roi.min, roi);
    ranges.roi.max = Math.max(ranges.roi.max, roi);

    const occ = listing.estimated_occupancy_l365d ?? 0;
    ranges.occupancyRate.min = Math.min(ranges.occupancyRate.min, occ);
    ranges.occupancyRate.max = Math.max(ranges.occupancyRate.max, occ);

    const mn = listing.minimum_nights ?? 0;
    ranges.minNights.min = Math.min(ranges.minNights.min, mn);
    ranges.minNights.max = Math.max(ranges.minNights.max, mn);

    const rc = listing.number_of_reviews ?? 0;
    ranges.reviewCount.min = Math.min(ranges.reviewCount.min, rc);
    ranges.reviewCount.max = Math.max(ranges.reviewCount.max, rc);

    const rating = listing.review_scores_rating ?? 0;
    ranges.rating.min = Math.min(ranges.rating.min, rating);
    ranges.rating.max = Math.max(ranges.rating.max, rating);
  }

  const fix = (p: MinMax): MinMax =>
    p.min === Infinity || p.max === -Infinity ? { min: 0, max: 0 } : p;

  return {
    roi: fix(ranges.roi),
    occupancyRate: fix(ranges.occupancyRate),
    minNights: fix(ranges.minNights),
    reviewCount: fix(ranges.reviewCount),
    rating: fix(ranges.rating),
  };
}

// ------------------- Compute Overall Metrics -------------------

export function computeOverallRadarMetrics(listings: RadarInputListing[]) {
  const ranges = findMinMaxValues(listings);
  const rawMetrics = aggregateRadarMetrics(listings);
  const normalized = normalizeRadarMetrics(rawMetrics, {
    roi: ranges.roi.max,
    occupancyRate: ranges.occupancyRate.max,
    minNights: ranges.minNights.max,
    reviewCount: ranges.reviewCount.max,
    rating: ranges.rating.max,
  });

  return {
    rawMetrics,
    ranges,
    normalized,
  };
}
