import pandas as pd
import numpy as np
import json
import os
from sklearn.preprocessing import OrdinalEncoder
import joblib
from amenities_dict import build_amenities_dict, encode_amenities

def simplify_property_type(label):
    if not isinstance(label, str):
        return 'Other'
    l = label.lower()
    if any(x in l for x in ['rental unit', 'condo', 'apartment', 'suite', 'aparthotel']):
        return 'Apartment / Condo'
    if any(x in l for x in ['home', 'villa', 'vacation', 'cottage', 'tiny', 'farm stay', 'place', 'casa particular']):
        return 'House / Villa / Cottage'
    if any(x in l for x in ['bed and breakfast', 'guesthouse']):
        return 'B&B / Guesthouse'
    if any(x in l for x in ['hotel', 'hostel']):
        return 'Hotel / Hostel'
    if any(x in l for x in ['loft', 'tent', 'camper', 'boat', 'dome', 'houseboat', 'yurt', 'castle']):
        return 'Unique Stays'
    return 'Other'

def prepare_investor_data(raw_csv_path, sentiment_csv_path, output_dir, amenities_dict_path):
    os.makedirs(output_dir, exist_ok=True)
    
    print("Loading Airbnb data...")
    df = pd.read_csv(raw_csv_path, sep=';')
    original_length = len(df)

    print("Loading and merging sentiment data...")
    sentiment_df = pd.read_csv(sentiment_csv_path).rename(columns={'neighbourhood': 'neighbourhood_cleansed'})
    df = df.merge(sentiment_df[['neighbourhood_cleansed', 'avg_sentiment']], 
                  on='neighbourhood_cleansed', how='left')
    assert len(df) == original_length, f"Merge changed row count from {original_length} to {len(df)}"
    df['avg_sentiment'] = df['avg_sentiment'].fillna(0)

    print("Cleaning price column...")
    df['price'] = df['price'].fillna('$0').str.replace(r'[\$,]', '', regex=True).astype(float)

    print("Loading amenities dictionary...")
    with open(amenities_dict_path, 'r') as f:
        amenities_dict = json.load(f)
    amenities_matrix = np.stack(df.apply(encode_amenities, axis=1, args=(amenities_dict,)))

    numeric_cols = [
        'price', 'minimum_nights', 'maximum_nights',
        'availability_30', 'availability_60', 'availability_90', 'availability_365',
        'estimated_occupancy_l365d', 'estimated_revenue_l365d',
        'number_of_reviews', 'number_of_reviews_ltm', 'number_of_reviews_l30d',
        'reviews_per_month', 'host_listings_count',
        'calculated_host_listings_count',
        'calculated_host_listings_count_entire_homes',
        'calculated_host_listings_count_private_rooms',
        'calculated_host_listings_count_shared_rooms',
        'avg_sentiment'
    ]
    numeric_features = df[numeric_cols].fillna(0).to_numpy()

    bool_cols = ['host_is_superhost', 'instant_bookable']
    for col in bool_cols:
        df[col] = df[col].map({'t': 1, 'f': 0}).fillna(0).astype(int)

    print("Simplifying property_type...")
    df['property_type_simplified'] = df['property_type'].apply(simplify_property_type)

    df['property_type_code'] = df['property_type_simplified'].astype('category').cat.codes
    df['room_type_code'] = df['room_type'].astype('category').cat.codes
    df['neighbourhood_code'] = df['neighbourhood_cleansed'].astype('category').cat.codes

    final_cols = [
        'id', 'listing_url', 'price', 'minimum_nights', 'maximum_nights',
        'availability_30', 'availability_60', 'availability_90', 'availability_365',
        'estimated_occupancy_l365d', 'estimated_revenue_l365d',
        'number_of_reviews', 'number_of_reviews_ltm', 'number_of_reviews_l30d',
        'reviews_per_month', 'host_listings_count', 'calculated_host_listings_count',
        'calculated_host_listings_count_entire_homes',
        'calculated_host_listings_count_private_rooms',
        'calculated_host_listings_count_shared_rooms', 'avg_sentiment',
        'host_is_superhost', 'instant_bookable', 'room_type_code', 'property_type_code', 'neighbourhood_code'
    ]
    final_df = df[final_cols].copy()

    print("Saving artifacts...")
    final_df.to_pickle(os.path.join(output_dir, 'investor_features.pkl'))
    np.savez_compressed(
        os.path.join(output_dir, 'investor_features.npz'),
        amenities_numeric=amenities_matrix,
        numeric_features=numeric_features,
        categorical_features=final_df[['room_type_code', 'property_type_code', 'neighbourhood_code']].to_numpy(),
        listing_ids=final_df['id'].to_numpy(),
        listing_urls=final_df['listing_url'].fillna('').to_numpy(dtype='U256'),
        feature_names=numeric_cols
    )
    
    print(f"Investor data preprocessing complete. Artifacts saved to: {output_dir}")

if __name__ == "__main__":
    raw_csv = '../../static/listings-detailed.csv'
    sentiment_csv = '../../static/sentiment-by-neighbourhood.csv'
    output_dir = '../../static/preprocessed_data'
    amenities_dict_file = '../../static/amenities_dict.json'

    prepare_investor_data(raw_csv, sentiment_csv, output_dir, amenities_dict_file)
