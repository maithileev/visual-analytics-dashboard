import pandas as pd
import numpy as np
import json
from amenities_dict import build_amenities_dict, encode_amenities  # Reuse your amenities functions

def prepare_investor_data(
    raw_csv_path,
    sentiment_csv_path,
    output_pickle_path,
    output_npz_path,
    amenities_dict_path
):
    print("Loading Airbnb data...")
    df = pd.read_csv(raw_csv_path, sep=';')

    print("Loading neighborhood sentiment data...")
    sentiment_df = pd.read_csv(sentiment_csv_path)
    sentiment_df = sentiment_df.rename(columns={'neighbourhood': 'neighbourhood_cleansed'})

    print("Merging sentiment data...")
    df = df.merge(sentiment_df[['neighbourhood_cleansed', 'avg_sentiment']], on='neighbourhood_cleansed', how='left')
    df['avg_sentiment'] = df['avg_sentiment'].fillna(0)

    # Clean price column: remove $ and commas, convert to float
    df['price'] = df['price'].fillna('$0')
    df['price'] = df['price'].str.replace(r'[\$,]', '', regex=True).astype(float)

    # Handle missing amenities as empty lists
    df['amenities'] = df['amenities'].fillna('[]')

    print("Loading existing amenities dictionary...")
    with open(amenities_dict_path, 'r') as f:
        amenities_dict = json.load(f)

    print(f"Total unique amenities from existing dict: {len(amenities_dict)}")

    print("Encoding amenities into multi-hot vectors...")
    amenities_matrix = np.stack(df.apply(encode_amenities, axis=1, args=(amenities_dict,)))
    print(f"amenities_matrix shape: {amenities_matrix.shape}")

    # Numeric columns useful for investors
    numeric_cols = [
        'price',
        'minimum_nights',
        'maximum_nights',
        'availability_30',
        'availability_60',
        'availability_90',
        'availability_365',
        'estimated_occupancy_l365d',
        'estimated_revenue_l365d',
        'number_of_reviews',
        'number_of_reviews_ltm',
        'number_of_reviews_l30d',
        'reviews_per_month',
        'host_listings_count',  # Host portfolio size
        'calculated_host_listings_count',
        'calculated_host_listings_count_entire_homes',
        'calculated_host_listings_count_private_rooms',
        'calculated_host_listings_count_shared_rooms',
        'avg_sentiment'
    ]
    print(f"Extracting numeric columns: {numeric_cols}")
    numeric_features = df[numeric_cols].fillna(0).to_numpy()
    print(f"numeric_features shape: {numeric_features.shape}")

    print("Combining amenities and numeric features...")
    amenities_numeric_features = np.hstack([amenities_matrix, numeric_features])

    # Encode booleans
    bool_cols = ['host_is_superhost', 'instant_bookable']
    for col in bool_cols:
        if col in df.columns:
            df[col] = df[col].map({'t': 1, 'f': 0}).fillna(0).astype(int)

    # Encode categorical features as codes
    categorical_cols = {
        'room_type': 'room_type_code',
        'property_type': 'property_type_code',
        'neighbourhood_cleansed': 'neighbourhood_code'
    }
    for orig_col, new_col in categorical_cols.items():
        if orig_col in df.columns:
            df[new_col] = df[orig_col].astype('category').cat.codes

    # Prepare final DataFrame with selected columns including 'id' for listing ID
    final_cols = [
        'id',
        'price',
        'minimum_nights',
        'maximum_nights',
        'availability_30',
        'availability_60',
        'availability_90',
        'availability_365',
        'estimated_occupancy_l365d',
        'estimated_revenue_l365d',
        'number_of_reviews',
        'number_of_reviews_ltm',
        'number_of_reviews_l30d',
        'reviews_per_month',
        'host_listings_count',
        'calculated_host_listings_count',
        'calculated_host_listings_count_entire_homes',
        'calculated_host_listings_count_private_rooms',
        'calculated_host_listings_count_shared_rooms',
        'avg_sentiment',
        'host_is_superhost',
        'instant_bookable',
        'room_type_code',
        'property_type_code',
        'neighbourhood_code'
    ]
    final_df = df[final_cols].copy()

    print("Saving prepared investor DataFrame as pickle...")
    final_df.to_pickle(output_pickle_path)

    print("Saving combined amenities + numeric features as npz file...")
    np.savez_compressed(output_npz_path,
                        amenities_numeric=amenities_numeric_features,
                        final_features=final_df.to_numpy())

    print(f"Investor data preparation complete.\nPickle saved to: {output_pickle_path}\nNPZ saved to: {output_npz_path}")

if __name__ == "__main__":
    raw_csv = '../../static/listings-detailed.csv'
    sentiment_csv = '../../static/sentiment-by-neighbourhood.csv'
    output_pickle = '../../static/investor_features.pkl'
    output_npz = '../../static/investor_features.npz'
    amenities_dict_file = '../../static/amenities_dict.json'

    prepare_investor_data(raw_csv, sentiment_csv, output_pickle, output_npz, amenities_dict_file)
