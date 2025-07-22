// src/lib/utils/radarNormalization.ts

import { pricePerM2Lookup } from './pricePerM2Lookup';

export const AVERAGE_SIZE_M2 = 75;
export const ANNUAL_EXPENSES = 2000;

export function normalizeROI(roi: number): number {
  return Math.min(Math.max(roi, 0), 100) / 100;
}

export function normalizeOccupancy(occupancyDays: number): number {
  return Math.min(Math.max(occupancyDays, 0), 365) / 365;
}

export function normalizeMinNights(minNights: number, maxMinNights: number): number {
  if (maxMinNights === 0) return 0;
  return 1 - Math.min(Math.max(minNights, 0), maxMinNights) / maxMinNights;
}

export function normalizeReviewCount(reviewCount: number, maxReviewCount: number): number {
  if (maxReviewCount === 0) return 0;
  return Math.min(Math.max(reviewCount, 0), maxReviewCount) / maxReviewCount;
}

export function normalizeRating(rating: number): number {
  return Math.min(Math.max(rating, 0), 5) / 5;
}

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

export function normalizeRadarMetrics(
  raw: RawMetrics,
  maxValues: {
    maxROI: number;
    maxOccupancyRate: number;
    maxMinNights: number;
    maxReviewCount: number;
    maxRating: number;
  }
): NormalizedMetrics {
  return {
    roi: maxValues.maxROI > 0 ? raw.roi / maxValues.maxROI : 0,
    occupancyRate:
      maxValues.maxOccupancyRate > 0 ? raw.occupancyRate / maxValues.maxOccupancyRate : 0,
    minNights: maxValues.maxMinNights > 0 ? raw.minNights / maxValues.maxMinNights : 0,
    reviewCount:
      maxValues.maxReviewCount > 0 ? raw.reviewCount / maxValues.maxReviewCount : 0,
    rating: maxValues.maxRating > 0 ? raw.rating / maxValues.maxRating : 0,
  };
}

export type RadarInputListing = {
  annualRevenue: number;
  neighborhood: string;
  estimated_occupancy_l365d: number;
  minimum_nights: number;
  number_of_reviews: number;
  review_scores_rating: number;
};

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
    occupancyRate: totalOccupancy / count,  // renamed here
    minNights: totalMinNights / count,
    reviewCount: totalReviews / count,
    rating: totalRating / count,
  };
}

export function findMaxValues(listings: RadarInputListing[]): {
  maxROI: number;
  maxOccupancyRate: number;
  maxMinNights: number;
  maxReviewCount: number;
  maxRating: number;
} {
  let maxROI = 0;
  let maxOccupancyRate = 0;
  let maxMinNights = 0;
  let maxReviewCount = 0;
  let maxRating = 0;

  for (const listing of listings) {
    const pricePerM2 = pricePerM2Lookup[listing.neighborhood] ?? 0;
    const propertyPrice = pricePerM2 * AVERAGE_SIZE_M2;
    const roi =
      propertyPrice > 0
        ? ((listing.annualRevenue - ANNUAL_EXPENSES) / propertyPrice) * 100
        : 0;

    if (roi > maxROI) maxROI = roi;
    if (listing.estimated_occupancy_l365d > maxOccupancyRate)
      maxOccupancyRate = listing.estimated_occupancy_l365d;
    if (listing.minimum_nights > maxMinNights) maxMinNights = listing.minimum_nights;
    if (listing.number_of_reviews > maxReviewCount) maxReviewCount = listing.number_of_reviews;
    if ((listing.review_scores_rating ?? 0) > maxRating)
      maxRating = listing.review_scores_rating ?? 0;
  }

  return {
    maxROI,
    maxOccupancyRate,
    maxMinNights,
    maxReviewCount,
    maxRating,
  };
}

// Compute overall max values from all listings
export function computeOverallMaxValues(listings: RadarInputListing[]) {
  return findMaxValues(listings);
}

// Compute overall normalized radar metrics
export function computeOverallRadarMetrics(listings: RadarInputListing[]) {
  const maxValues = computeOverallMaxValues(listings);
  const rawMetrics = aggregateRadarMetrics(listings);
  const normalized = normalizeRadarMetrics(rawMetrics, maxValues);
  return {
    rawMetrics,
    maxValues,
    normalized,
  };
}
