import pandas as pd
import numpy as np
import json
import os
from sklearn.preprocessing import OrdinalEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import joblib
from amenities_dict import build_amenities_dict, encode_amenities

def prepare_tourist_data(raw_csv_path, sentiment_csv_path, output_dir):
    """Enhanced data preprocessing pipeline with proper feature engineering and validation"""
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Load and Validate Raw Data
    print("Loading and validating raw data...")
    
    df = pd.read_csv(raw_csv_path, sep=';')
    print(df.columns)

    original_length = len(df)
    
    # 2. Handle Sentiment Data Merge
    print("Merging sentiment data with validation...")
    sentiment_df = pd.read_csv(sentiment_csv_path).rename(columns={'neighbourhood': 'neighbourhood_cleansed'})
    df = df.merge(sentiment_df[['neighbourhood_cleansed', 'avg_sentiment']], 
                 on='neighbourhood_cleansed', 
                 how='left')
    
    # Validate merge didn't drop rows unexpectedly
    assert len(df) == original_length, f"Merge changed row count from {original_length} to {len(df)}"
    df['avg_sentiment'] = df['avg_sentiment'].fillna(0)

    # 3. Clean and Transform Features
    print("Cleaning and transforming features...")
    
    # Price cleaning
    df['price'] = (df['price'].fillna('$0')
                      .str.replace(r'[\$,]', '', regex=True)
                      .astype(float))
    
    # Amenities processing
    df['amenities'] = df['amenities'].fillna('[]')
    amenities_dict = build_amenities_dict(df)
    amenities_matrix = np.stack(df.apply(encode_amenities, axis=1, args=(amenities_dict,)))
    
    # 4. Prepare Feature Engineering Pipeline
    print("Setting up feature engineering pipeline...")
    
    # Numeric features with median imputation
    numeric_features = [
        'accommodates', 'bathrooms', 'bedrooms', 'beds',
        'price', 'review_scores_rating', 'review_scores_cleanliness',
        'review_scores_checkin', 'review_scores_communication',
        'review_scores_location', 'review_scores_value',
        'number_of_reviews', 'reviews_per_month', 'availability_30',
        'minimum_nights', 'maximum_nights', 'latitude', 'longitude',
        'avg_sentiment'
    ]
    
    # Categorical features with ordinal encoding
    categorical_features = {
        'room_type': 'room_type_code',
        'property_type': 'property_type_code',
        'neighbourhood_cleansed': 'neighbourhood_code'
    }
    
    # Boolean features
    boolean_features = {
        'host_is_superhost': {'t': 1, 'f': 0},
        'instant_bookable': {'t': 1, 'f': 0}
    }
    
    # 5. Apply Transformations
    # Boolean conversions
    for col, mapping in boolean_features.items():
        df[col] = df[col].map(mapping).fillna(0).astype(int)
    
    # Categorical encoding (with saved encoders)
    encoders = {}
    for orig_col, new_col in categorical_features.items():
        encoder = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
        df[new_col] = encoder.fit_transform(df[[orig_col]])
        encoders[new_col] = encoder
    
    # 6. Create Final Feature Set
    print("Creating final feature set...")
    
    # Selected features (excluding ID and raw categoricals)
    final_features = [
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
        'accommodates',
        'bathrooms',
        'bedrooms',
        'beds'
    ]
    
    # 7. Save All Artifacts
    print("Saving artifacts...")
    
    listing_ids = df['id'].to_numpy()  # <-- ADD THIS HERE

    # Save amenities dictionary
    with open(os.path.join(output_dir, 'amenities_dict.json'), 'w') as f:
        json.dump(amenities_dict, f, indent=2)
    
    # Save encoders
    for feature_name, encoder in encoders.items():
        joblib.dump(encoder, os.path.join(output_dir, f'{feature_name}_encoder.joblib'))
    
    # Save final DataFrame (with IDs)
    final_df = df[['id', 'listing_url'] + final_features].copy()
    final_df.rename(columns={'id': 'listing_ids'}, inplace=True)
    final_df.to_pickle(os.path.join(output_dir, 'tourist_features.pkl'))
    
    # Save feature matrices with IDs
    np.savez_compressed(
        os.path.join(output_dir, 'tourist_features.npz'),
        amenities_numeric=amenities_matrix,
        numeric_features=df[numeric_features].to_numpy(),
        categorical_features=df[list(categorical_features.values())].to_numpy(),
        listing_urls=np.array(df['listing_url'].values, dtype='U256'),  # Store as Unicode strings
        listing_ids=listing_ids,
        feature_names=final_features
    )

    
    print(f"Data preprocessing complete. Artifacts saved to: {output_dir}")

if __name__ == "__main__":
    prepare_tourist_data(
        raw_csv_path='../../static/listings-detailed.csv',
        sentiment_csv_path='../../static/sentiment-by-neighbourhood.csv',
        output_dir='../../static/preprocessed_data'
    )

    with np.load('../../static/preprocessed_data/tourist_features.npz', allow_pickle=True) as data:
        print(data.files)
