type Listing = Record<string, any>;

export interface KPI {
  label: string;
  overviewValue: number;
  selectedValue: number | null;
  unit: string;
}

export const columns = [
  { columnName: "review_scores_cleanliness", label: "Cleanliness", unit: "/5" },
  { columnName: "review_scores_location", label: "Location", unit: "/5" },
  { columnName: "review_scores_value", label: "Value", unit: "/5" },
  { columnName: "review_scores_checkin", label: "Checkin", unit: "/5" },
];

export const reviewScores = [
  { label: 'Cleanliness', overviewValue: 4.7, selectedValue:null, unit: '/5' },
  { label: 'Location', overviewValue: 4.8, selectedValue: 4.5, unit: '/5' },
  { label: 'Value', overviewValue: 4.96, selectedValue: 4.83, unit: '/5' },
  { label: 'Checkin', overviewValue: 4.96, selectedValue: 4.83, unit: '/5' }
];


export function aggregateMultipleReviewScores(
  data: Listing[],
  columns: { columnName: string; label: string; unit: string }[],
  neighborhood: string | null | undefined
): KPI[] {
  // Helper to compute average of numeric values in a column for given data
  function average(items: Listing[], columnName: string): number {
    const values = items
      .map((item) => Number(item[columnName]))
      .filter((val) => !isNaN(val));
    if (values.length === 0) return 0;
    return Number((values.reduce((acc, val) => acc + val, 0) / values.length).toFixed(2));
  }

  return columns.map(({ columnName, label, unit }) => {
    const overviewValue = average(data, columnName);

    let selectedValue: number | null = null;
    console.log("Neighborhood -",neighborhood)
    if (neighborhood) {
      const filtered = data.filter((item) => item.neighbourhood_cleansed === neighborhood);
      selectedValue = filtered.length > 0 ? average(filtered, columnName) : null;
    }
    return { label, overviewValue, selectedValue, unit };
  });
}
