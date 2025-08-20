// src/lib/utils/radarPrecompute.ts
import type { RadarInputListing, RawMetrics, NormalizedMetrics, Ranges } from './radarNormalization';
import { aggregateRadarMetrics, normalizeRadarMetrics, findMinMaxValues } from './radarNormalization';

// Type for precomputed neighborhood radar data
export type NeighborhoodRadarData = {
  raw: RawMetrics;
  normalized: NormalizedMetrics;
};

export type PrecomputedRadarData = {
  overall: NeighborhoodRadarData;
  neighborhoods: Record<string, NeighborhoodRadarData>;
  ranges: Ranges;
};

// Precompute radar data
export function precomputeRadarData(listings: RadarInputListing[]): PrecomputedRadarData {
  // 1️⃣ Compute overall metrics
  const overallRaw = aggregateRadarMetrics(listings);

  // 2️⃣ Compute min/max ranges across all listings
  const ranges = findMinMaxValues(listings);

  // 3️⃣ Normalize overall metrics
  const overallNormalized = normalizeRadarMetrics(overallRaw, {
    roi: ranges.roi.max,
    occupancyRate: ranges.occupancyRate.max,
    minNights: ranges.minNights.max,
    reviewCount: ranges.reviewCount.max,
    rating: ranges.rating.max,
  });

  // 4️⃣ Group listings by neighborhood
  const neighborhoodsMap: Record<string, RadarInputListing[]> = {};
  listings.forEach((listing) => {
    const n = listing.neighborhood;
    if (!neighborhoodsMap[n]) neighborhoodsMap[n] = [];
    neighborhoodsMap[n].push(listing);
  });

  // 5️⃣ Compute metrics per neighborhood
  const neighborhoods: Record<string, NeighborhoodRadarData> = {};
  Object.entries(neighborhoodsMap).forEach(([neighborhood, nListings]) => {
    const raw = aggregateRadarMetrics(nListings);
    const normalized = normalizeRadarMetrics(raw, {
      roi: ranges.roi.max,
      occupancyRate: ranges.occupancyRate.max,
      minNights: ranges.minNights.max,
      reviewCount: ranges.reviewCount.max,
      rating: ranges.rating.max,
    });
    neighborhoods[neighborhood] = { raw, normalized };
  });

  console.log("Overall data raw - ",overallRaw)
  console.log("Overall data normalised - ",overallNormalized)
  console.log("Neighborhoodwise data - ",neighborhoods)
  console.log("Ranges", ranges)

  return {
    overall: { raw: overallRaw, normalized: overallNormalized },
    neighborhoods,
    ranges,
  };
}
