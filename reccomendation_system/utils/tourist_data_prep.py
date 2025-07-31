import pandas as pd
import numpy as np
import json
import os
from amenities_dict import build_amenities_dict, encode_amenities  # Your updated module with normalization

def prepare_tourist_data(raw_csv_path, sentiment_csv_path, output_pickle_path, output_npz_path, amenities_dict_path):
    print("Loading Airbnb data...")
    df = pd.read_csv(raw_csv_path, sep=';')

    print("Loading neighborhood sentiment data...")
    sentiment_df = pd.read_csv(sentiment_csv_path)
    sentiment_df = sentiment_df.rename(columns={'neighbourhood': 'neighbourhood_cleansed'})

    print("Merging sentiment data...")
    df = df.merge(sentiment_df[['neighbourhood_cleansed', 'avg_sentiment']], on='neighbourhood_cleansed', how='left')
    df['avg_sentiment'] = df['avg_sentiment'].fillna(0)

    # Clean price column: remove $ and commas, convert to float
    df['price'] = df['price'].fillna('$0')  # fill nulls to avoid errors
    df['price'] = df['price'].str.replace(r'[\$,]', '', regex=True).astype(float)

    # Handle missing amenities as empty lists (to avoid JSON errors)
    df['amenities'] = df['amenities'].fillna('[]')

    print("Building amenities dictionary...")
    amenities_dict = build_amenities_dict(df)

    print(f"Total unique amenities found (after normalization): {len(amenities_dict)}")

    print("Encoding amenities into multi-hot vectors...")
    amenities_matrix = np.stack(df.apply(encode_amenities, axis=1, args=(amenities_dict,)))
    print(f"amenities_matrix shape: {amenities_matrix.shape}")

    # Numeric columns for rooms/accommodations
    numeric_cols = ['accommodates', 'bathrooms', 'bedrooms', 'beds']
    print(f"Extracting numeric columns: {numeric_cols}")
    numeric_features = df[numeric_cols].fillna(0).to_numpy()
    print(f"numeric_features shape: {numeric_features.shape}")

    # Combine amenities and numeric features
    print("Combining amenities and numeric features...")
    amenities_numeric_features = np.hstack([amenities_matrix, numeric_features])

    # Fill numeric missing with median for other columns
    numeric_fill_cols = [
        'price',
        'review_scores_rating',
        'review_scores_cleanliness',
        'review_scores_checkin',
        'review_scores_communication',
        'review_scores_location',
        'review_scores_value',
        'number_of_reviews',
        'reviews_per_month',
        'availability_30',
        'minimum_nights',
        'maximum_nights',
        'latitude',
        'longitude',
        'avg_sentiment'
    ]
    for col in numeric_fill_cols:
        if col in df.columns:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)

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

    print("Room Type Mapping (for frontend reference):")
    room_type_mapping = dict(enumerate(df['room_type'].astype('category').cat.categories))
    for code, label in room_type_mapping.items():
        print(f"{code}: {label}")

    # Prepare final DataFrame with selected columns
    final_cols = [
        'id',  # listing id to return in API
        'price',
        'review_scores_rating',
        'review_scores_cleanliness',
        'review_scores_checkin',
        'review_scores_communication',
        'review_scores_location',
        'review_scores_value',
        'number_of_reviews',
        'reviews_per_month',
        'avg_sentiment',
        'instant_bookable',
        'host_is_superhost',
        'room_type_code',
        'property_type_code',
        'neighbourhood_code',
        'availability_30',
        'minimum_nights',
        'maximum_nights',
        'latitude',
        'longitude',

        # Added for filtering in your API:
        'accommodates',
        'bathrooms',
        'bedrooms',
        'beds',
    ]

    final_df = df[final_cols].copy()

    print("Saving amenities dictionary...")
    with open(amenities_dict_path, 'w') as f:
        json.dump(amenities_dict, f, indent=2)

    print("Saving prepared tourist DataFrame as pickle...")
    final_df.to_pickle(output_pickle_path)

    print("Saving combined amenities + numeric features as npz file...")
    np.savez_compressed(output_npz_path,
                        amenities_numeric=amenities_numeric_features,
                        final_features=final_df.to_numpy())

    print(f"Data preparation complete.\nPickle saved to: {output_pickle_path}\nNPZ saved to: {output_npz_path}\nAmenities dict saved to: {amenities_dict_path}")


if __name__ == "__main__":
    # Adjust these paths as needed
    raw_csv = '../../static/listings-detailed.csv'
    sentiment_csv = '../../static/sentiment-by-neighbourhood.csv'
    output_pickle = '../../static/tourist_features.pkl'
    output_npz = '../../static/tourist_features.npz'
    amenities_dict_file = '../../static/amenities_dict.json'

    prepare_tourist_data(raw_csv, sentiment_csv, output_pickle, output_npz, amenities_dict_file)
