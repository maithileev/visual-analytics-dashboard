import Papa from "papaparse";
import { base } from '$app/paths';

export type ListingDetails = {
  id: string;
  name: string;
  picture_url?: string;
  price?: string;
  review_scores_rating?: number;
  description?: string;
  url: string;
};

/**
 * Fetch listing details from CSV by listing_url
 * @param path - path to CSV file in `static/` folder
 * @param listingUrl - URL to search for
 */
export async function fetchListingByUrl(listingUrl: string): Promise<ListingDetails | null> {
  try {
    const details = await fetch(base + '/listings-detailed.csv')
    if (!details.ok) throw new Error(`Failed to fetch CSV`);

    const csvText = await details.text();

    const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length) console.warn("CSV parsing errors:", errors);

    const row = data.find(r => r.listing_url === listingUrl);
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      picture_url: row.picture_url,
      price: row.price ? Number(row.price) : undefined,
      review_scores_rating: row.review_scores_rating ? Number(row.review_scores_rating) : undefined,
      description: row.description,
      url: listingUrl,
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}
