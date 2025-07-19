// utils/aggregate.ts

type Bin = {
    label: string;
    min: number;
    max: number;
  };
  
  export type AggregatedBin = {
    label: string;
    min: number;
    max: number;
    count: number;
    cumulativeCount: number;
    cumulativePercent: number;
  };
  
  export function getAvailabilityHistogramDataByNeighborhood(
    listings: Record<string, any>[],
    selectedNeighborhood?: string | null
  ): AggregatedBin[] {
    const bins: Bin[] = [
      { label: "0-30", min: 0, max: 30 },
      { label: "31-90", min: 31, max: 90 },
      { label: "91-180", min: 91, max: 180 },
      { label: "181-365", min: 181, max: 365 }
    ];
  
    // Filter & validate
    const filtered = listings
      .filter((row) => {
        const avail = Number(row.availability_365);
        const neighborhood = row.neighbourhood_cleansed;
        const validAvail = Number.isFinite(avail);
  
        if (!validAvail) return false;
        if (!selectedNeighborhood) return true;
        return neighborhood === selectedNeighborhood;
      })
      .map((row) => ({
        availability_365: Number(row.availability_365)
      }));
  
    const total = filtered.length;
    let cumulative = 0;
  
    return bins.map((bin) => {
      const count = filtered.filter(d => d.availability_365 >= bin.min && d.availability_365 <= bin.max).length;
      cumulative += count;
  
      return {
        ...bin,
        count,
        cumulativeCount: cumulative,
        cumulativePercent: total === 0 ? 0 : (cumulative / total) * 100
      };
    });
  }
  