import { pricePerM2Lookup } from '$lib/utils/pricePerM2Lookup';

const ANNUAL_EXPENSES = 2100; // $
const AVERAGE_SIZE_M2 = 60;   // m²

type AggregateResult = {
  neighborhood: string | 'Overall';
  avgAnnualRevenue: number;
  avgPricePerM2: number;
  avgPropertyPrice: number;
  roi: number;
  count: number;
};

export function aggregateROIFromRevenues(
  revenues: number[],
  selectedNeighborhood?: string | null
): AggregateResult {
  if (revenues.length === 0) {
    return {
      neighborhood: selectedNeighborhood ?? 'Overall',
      avgAnnualRevenue: 0,
      avgPricePerM2: 0,
      avgPropertyPrice: 0,
      roi: 0,
      count: 0,
    };
  }

  const totalRevenue = revenues.reduce((sum, r) => sum + r, 0);
  const avgAnnualRevenue = totalRevenue / revenues.length;

  // Look up average price per m²
  let avgPricePerM2: number;
  if (selectedNeighborhood) {
    avgPricePerM2 = pricePerM2Lookup[selectedNeighborhood] ?? 0;
  } else {
    // Use overall average of all values in lookup
    const allPrices = Object.values(pricePerM2Lookup);
    avgPricePerM2 = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
  }

  const avgPropertyPrice = avgPricePerM2 * AVERAGE_SIZE_M2;

  const roi = avgPropertyPrice > 0
    ? ((avgAnnualRevenue - ANNUAL_EXPENSES) / avgPropertyPrice) * 100
    : 0;

  return {
    neighborhood: selectedNeighborhood ?? 'Overall',
    avgAnnualRevenue,
    avgPricePerM2,
    avgPropertyPrice,
    roi,
    count: revenues.length,
  };
}

export function groupAverageRevenueByNeighborhood(data: any[]) {
  const revenueMap = new Map<string, { total: number; count: number }>();

  for (const row of data) {
    const hood = row['neighbourhood_cleansed'];
    const revenue = parseFloat(row['estimated_revenue_l365d'] ?? '0');
    if (!hood || isNaN(revenue)) continue;

    if (!revenueMap.has(hood)) {
      revenueMap.set(hood, { total: 0, count: 0 });
    }

    const current = revenueMap.get(hood)!;
    current.total += revenue;
    current.count += 1;
  }

  // Convert to final object
  const avgRevenue: Record<string, number> = {};
  for (const [hood, { total, count }] of revenueMap.entries()) {
    avgRevenue[hood] = +(total / count).toFixed(2);
  }

  return avgRevenue;
}


export function calculateOverallOccupancyRate(rows: any[]): number {
  let totalOccupiedDays = 0;
  let totalAvailability = 0;

  rows.forEach((row) => {
    let occRaw = row.estimated_occupancy_l365d;
    if (typeof occRaw === 'string') {
      occRaw = occRaw.replace(/[^0-9.]/g, '');
    }
    const occupied = parseFloat(occRaw);

    let availRaw = row.availability_365;
    if (typeof availRaw === 'string') {
      availRaw = availRaw.replace(/[^0-9.]/g, '');
    }
    const availability = parseFloat(availRaw);

    if (!isNaN(occupied) && !isNaN(availability) && availability > 0) {
      totalOccupiedDays += occupied;
      totalAvailability += availability;
    }
  });

  if (totalAvailability === 0) return 0;

  const overallRate = (totalOccupiedDays / totalAvailability) * 100;
  console.log("Total listings considered:", rows.length);
  console.log("Total occupied days:", totalOccupiedDays);
  console.log("Total availability days:", totalAvailability);
  console.log("Overall occupancy rate:", overallRate.toFixed(2));

  return parseFloat(overallRate.toFixed(2));
}



/**
 * Aggregates data by a label field, summing two numeric fields: overall and optional compare.
 * 
 * @param rows - array of data rows (objects)
 * @param labelField - field name to group by (e.g., 'neighbourhood_cleansed')
 * @param overallField - main numeric field to aggregate (e.g., 'count' or 'availability_365')
 * @param compareField - optional second numeric field to aggregate (e.g., neighborhood-specific metric)
 * @returns aggregated array suitable for generic horizontal bar chart
 */
export function aggregateRoomType(
  rows: any[],
  selectedNeighborhood: string | null = null)  {
  const roomTypeMap = new Map<string, { overall: number; compare: number }>();

  rows.forEach((row) => {
    const roomType = row.room_type;
    const neighborhood = row.neighbourhood_cleansed;

    if (!roomType) return;

    if (!roomTypeMap.has(roomType)) {
      roomTypeMap.set(roomType, { overall: 0, compare: 0 });
    }

    const entry = roomTypeMap.get(roomType)!;
    entry.overall += 1;
    if (selectedNeighborhood && neighborhood === selectedNeighborhood) {
      entry.compare += 1;
    }
  });

  return Array.from(roomTypeMap.entries()).map(([label, { overall, compare }]) => ({
    label,
    overall,
    ...(selectedNeighborhood ? { compare } : {}),
  }));
}

export function simplifyPropertyType(label: string): string {
  const l = label.toLowerCase();

  if (l.includes('rental unit') || l.includes('condo') || l.includes('apartment') || l.includes('suite') || l.includes('aparthotel')) {
    return 'Apartment / Condo';
  }
  if (l.includes('home') || l.includes('villa') || l.includes('vacation') || l.includes('cottage') || l.includes('tiny') || l.includes('farm stay') || l.includes('place') || l.includes('casa particular')) {
    return 'House / Villa / Cottage';
  }
  if (l.includes('bed and breakfast') || l.includes('guesthouse')) {
    return 'B&B / Guesthouse';
  }
  if (l.includes('hotel') || l.includes('hostel')) {
    return 'Hotel / Hostel';
  }
  if (l.includes('loft') || l.includes('tent') || l.includes('camper') || l.includes('boat') || l.includes('dome') || l.includes('houseboat') || l.includes('yurt') || l.includes('castle') ) {
    return 'Unique Stays';
  }

  return 'Other';
}

// export function aggregatePropertyType(
//   rows: any[],
//   selectedNeighborhood: string | null = null)  {
//     const typeMap = new Map<string, { overall: number; compare: number }>();

//     rows.forEach((row) => {
//       const rawType = row.property_type;
//       const neighborhood = row.neighbourhood_cleansed;
  
//       if (!rawType) return;
  
//       const simplifiedType = simplifyPropertyType(rawType);
  
//       if (!typeMap.has(simplifiedType)) {
//         typeMap.set(simplifiedType, { overall: 0, compare: 0 });
//       }
  
//       const entry = typeMap.get(simplifiedType)!;
//       entry.overall += 1;
  
//       if (selectedNeighborhood && neighborhood === selectedNeighborhood) {
//         entry.compare += 1;
//       }
//     });
  
//     return Array.from(typeMap.entries()).map(([label, { overall, compare }]) => ({
//       label,
//       overall,
//       ...(selectedNeighborhood ? { compare } : {}),
//     }));  
// }


export function aggregatePropertyType(
  rows: any[] = [],
  selectedNeighborhood: string | null = null
) {
  const typeMap = new Map<string, { overall: number; compare: number }>();

  if (!Array.isArray(rows)) return [];

  rows.forEach((row) => {
    const rawType = row.property_type;
    const neighborhood = row.neighbourhood_cleansed;

    if (!rawType) return;

    const simplifiedType = simplifyPropertyType(rawType);

    if (!typeMap.has(simplifiedType)) {
      typeMap.set(simplifiedType, { overall: 0, compare: 0 });
    }

    const entry = typeMap.get(simplifiedType)!;
    entry.overall += 1;

    if (selectedNeighborhood && neighborhood === selectedNeighborhood) {
      entry.compare += 1;
    }
  });

  return Array.from(typeMap.entries()).map(([label, { overall, compare }]) => ({
    label,
    overall,
    ...(selectedNeighborhood ? { compare } : {}),
  }));
}

export function aggregateAverageRating(rows: any[]) {
  const ratingMap = new Map<string, { total: number; count: number }>();

  rows.forEach(row => {
    const hoodRaw = row.neighbourhood_cleansed;
    const rating = parseFloat(row.review_scores_rating);

    if (!hoodRaw || isNaN(rating)) return;

    const hood = hoodRaw.trim().toLowerCase(); // Normalize

    if (!ratingMap.has(hood)) {
      ratingMap.set(hood, { total: 0, count: 0 });
    }

    const entry = ratingMap.get(hood)!;
    entry.total += rating;
    entry.count += 1;
  });

  const result: Record<string, number> = {};
  ratingMap.forEach((val, key) => {
    result[key] = +(val.total / val.count).toFixed(2); // rounded average
  });

  return result;
}


// lib/utils/aggregate.ts
export function getTopNeighborhoods(data: any[], topN: number = 3) {
  const neighborhoodStats = new Map<string, {
    count: number;
    totalPrice: number;
    totalReviews: number;
    totalRating: number;
    superhostCount: number;
  }>();

  data.forEach(row => {
    const name = row['neighbourhood_cleansed']?.trim() || '';
    if (!name) return;

    let stats = neighborhoodStats.get(name);
    if (!stats) {
      stats = { count: 0, totalPrice: 0, totalReviews: 0, totalRating: 0, superhostCount: 0 };
      neighborhoodStats.set(name, stats);
    }

    const price = parseFloat(row['price']?.replace(/[^0-9.]/g, '') || '0');
    const reviews = parseInt(row['number_of_reviews'] || '0', 10);
    const rating = parseFloat(row['review_scores_rating'] || '0');
    const isSuperhost = row['host_is_superhost'] === 't' || row['host_is_superhost'] === true;

    stats.count += 1;
    stats.totalPrice += isNaN(price) ? 0 : price;
    stats.totalReviews += isNaN(reviews) ? 0 : reviews;
    stats.totalRating += isNaN(rating) ? 0 : rating;
    stats.superhostCount += isSuperhost ? 1 : 0;
  });

  // Convert map to array with calculated averages and percentages
  const neighborhoodArray = Array.from(neighborhoodStats.entries()).map(([name, stats]) => ({
    name,
    avgPrice: stats.count ? stats.totalPrice / stats.count : 0,
    totalListings: stats.count,
    totalReviews: stats.totalReviews,
    avgRating: stats.count ? stats.totalRating / stats.count : 0,
    pctSuperhost: stats.count ? (stats.superhostCount / stats.count) * 100 : 0,
  }));

  // Sort by avgRating desc and limit to topN
  neighborhoodArray.sort((a, b) => b.avgRating - a.avgRating);

  return neighborhoodArray.slice(0, topN);
}

//Aggregation Metrics for ROI
type Listing = {
  roi: number;                          // computed ROI %
  estimated_occupancy_l365d: number;   // days occupied in last 365
  minimum_nights: number;
  number_of_reviews: number;
  review_scores_rating: number;
};

type RawMetrics = {
  roi: number;
  occupancyDays: number;
  minNights: number;
  reviewCount: number;
  rating: number;
};

type MaxValues = {
  maxMinNights: number;
  maxReviewCount: number;
};


export function aggregateMetrics(listings: Listing[]): RawMetrics {
  const count = listings.length;
  if (count === 0) {
    return { roi: 0, occupancyDays: 0, minNights: 0, reviewCount: 0, rating: 0 };
  }

  return {
    roi: listings.reduce((sum, l) => sum + l.roi, 0) / count,
    occupancyDays: listings.reduce((sum, l) => sum + l.estimated_occupancy_l365d, 0) / count,
    minNights: listings.reduce((sum, l) => sum + l.minimum_nights, 0) / count,
    reviewCount: listings.reduce((sum, l) => sum + l.number_of_reviews, 0) / count,
    rating: listings.reduce((sum, l) => sum + l.review_scores_rating, 0) / count,
  };
}

export function getMaxValues(allListings: Listing[]): MaxValues {
  return {
    maxMinNights: allListings.reduce((max, l) => Math.max(max, l.minimum_nights), 0),
    maxReviewCount: allListings.reduce((max, l) => Math.max(max, l.number_of_reviews), 0),
  };
}
