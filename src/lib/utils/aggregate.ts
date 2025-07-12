
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
    let listingCount = 0;
  
    rows.forEach((row) => {
      let occRaw = row.estimated_occupancy_l365d;
      if (typeof occRaw === 'string') {
        occRaw = occRaw.replace(/[^0-9.]/g, '');
      }
      const occupied = parseFloat(occRaw);
      if (!isNaN(occupied)) {
        totalOccupiedDays += occupied;
        listingCount += 1;
      }
    });
  
    if (listingCount === 0) return 0;
    console.log("Listings ",listingCount)
    console.log("Occupancy rate", totalOccupiedDays)
    const overallRate = (totalOccupiedDays / listingCount) * (100/365);
    return parseFloat(overallRate.toFixed(2));
  }
  