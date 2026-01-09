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

export function precomputeRadarData(listings: RadarInputListing[]): PrecomputedRadarData {
  const overallRaw = aggregateRadarMetrics(listings);

  const ranges = findMinMaxValues(listings);

  const overallNormalized = normalizeRadarMetrics(overallRaw, {
    roi: ranges.roi.max,
    occupancyRate: ranges.occupancyRate.max,
    minNights: ranges.minNights.max,
    reviewCount: ranges.reviewCount.max,
    rating: ranges.rating.max,
  });

  const neighborhoodsMap: Record<string, RadarInputListing[]> = {};
  listings.forEach((listing) => {
    const n = listing.neighborhood;
    if (!neighborhoodsMap[n]) neighborhoodsMap[n] = [];
    neighborhoodsMap[n].push(listing);
  });

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
