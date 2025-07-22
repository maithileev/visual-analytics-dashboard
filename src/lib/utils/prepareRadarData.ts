export type RawRow = Record<string, any>; // generic row type from your CSV/JSON

export type RadarInputListing = {
  annualRevenue: number;
  neighborhood: string;
  estimated_occupancy_l365d: number;
  minimum_nights: number;
  number_of_reviews: number;
  review_scores_rating: number;
};

/**
 * Extracts required fields from raw detailed rows
 * @param rows - array of raw listing objects (CSV parsed)
 * @returns array of cleaned RadarInputListing objects
 */
export function extractRadarData(rows: RawRow[]): RadarInputListing[] {
  return rows
    .map((row) => {
      // Parse and clean each required field

      const annualRevenue = Number(row['estimated_revenue_l365d']);
      const neighborhood = row['neighbourhood_cleansed']?.trim() ?? '';
      const estimated_occupancy_l365d = Number(row['estimated_occupancy_l365d']);
      const minimum_nights = Number(row['minimum_nights']);
      const number_of_reviews = Number(row['number_of_reviews']);
      const review_scores_rating = Number(row['review_scores_rating']);

      // Filter out rows with missing critical data
      if (
        isNaN(annualRevenue) ||
        !neighborhood ||
        isNaN(estimated_occupancy_l365d) ||
        isNaN(minimum_nights) ||
        isNaN(number_of_reviews) ||
        isNaN(review_scores_rating)
      ) {
        return null;
      }

      return {
        annualRevenue,
        neighborhood,
        estimated_occupancy_l365d,
        minimum_nights,
        number_of_reviews,
        review_scores_rating,
      };
    })
    .filter((listing): listing is RadarInputListing => listing !== null);
}