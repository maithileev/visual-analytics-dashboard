import pandas as pd
import numpy as np
import joblib
import json

from utils.amenities_dict import encode_amenities

# Load everything once to avoid reloading per request
MODEL_PATH = 'models/tourist_rf_model.joblib'
PICKLE_PATH = '../static/tourist_features.pkl'
NPZ_PATH = '../static/tourist_features.npz'
AMENITIES_DICT_PATH = '../static/amenities_dict.json'
RAW_DATA_PATH = '..static/listings-detailed.csv'

print("Loading model and data...")
model = joblib.load(MODEL_PATH)
df_meta = pd.read_pickle(PICKLE_PATH)
data = np.load(NPZ_PATH)
amenities_dict = json.load(open(AMENITIES_DICT_PATH))
raw_df = pd.read_csv(RAW_DATA_PATH)

# Ensure raw_df and df_meta align in order
assert len(raw_df) == len(df_meta)

def recommend_for_tourist(user_filters: dict, top_n=10):
    df = raw_df.copy()

    # === Apply User Filters ===
    if 'min_beds' in user_filters:
        df = df[df['beds'] >= user_filters['min_beds']]
    
    if 'price_range' in user_filters:
        min_p, max_p = user_filters['price_range']
        df = df[df['price'] >= min_p]
        df = df[df['price'] <= max_p]

    if 'instant_bookable' in user_filters:
        df = df[df['instant_bookable'].map({'t': 1, 'f': 0}).fillna(0) == int(user_filters['instant_bookable'])]

    if 'room_type' in user_filters:
        df = df[df['room_type'] == user_filters['room_type']]

    if 'must_have_amenities' in user_filters:
        def has_all_amenities(amenity_list_str):
            try:
                amenity_list = json.loads(amenity_list_str.replace("'", '"'))
                return all(am in amenity_list for am in user_filters['must_have_amenities'])
            except:
                return False
        df = df[df['amenities'].apply(has_all_amenities)]

    if df.empty:
        return []

    # === Re-encode filtered listings ===
    # Rebuild encoded features from scratch (based on previous prep logic)
    encoded_amenities = np.array(df.apply(encode_amenities, axis=1, args=(amenities_dict,)))
    numeric_cols = ['accommodates', 'bathrooms', 'bedrooms', 'beds']
    numeric_features = df[numeric_cols].fillna(0).to_numpy()

    # The other features used in training:
    df_temp = df.copy()

    # Categorical encodings (same as prep)
    df_temp['room_type_code'] = df_temp['room_type'].astype('category').cat.codes
    df_temp['property_type_code'] = df_temp['property_type'].astype('category').cat.codes
    df_temp['neighbourhood_code'] = df_temp['neighbourhood_cleansed'].astype('category').cat.codes

    df_temp['instant_bookable'] = df_temp['instant_bookable'].map({'t': 1, 'f': 0}).fillna(0)
    df_temp['host_is_superhost'] = df_temp['host_is_superhost'].map({'t': 1, 'f': 0}).fillna(0)

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
        df_temp[col] = df_temp[col].fillna(df_temp[col].median())

    final_cols = [
        'price', 'review_scores_rating', 'review_scores_cleanliness',
        'review_scores_checkin', 'review_scores_communication',
        'review_scores_location', 'review_scores_value',
        'number_of_reviews', 'reviews_per_month', 'avg_sentiment',
        'instant_bookable', 'host_is_superhost', 'room_type_code',
        'property_type_code', 'neighbourhood_code',
        'availability_30', 'minimum_nights', 'maximum_nights',
        'latitude', 'longitude'
    ]

    other_features = df_temp[final_cols].to_numpy()
    final_X = np.hstack([encoded_amenities, numeric_features, other_features])

    # === Predict and sort ===
    scores = model.predict(final_X)
    df['predicted_rating'] = scores

    top_listings = df.sort_values(by='predicted_rating', ascending=False).head(top_n)

    # Return selected fields
    return top_listings[[
        'name', 'neighbourhood_cleansed', 'price', 'predicted_rating', 'beds', 'accommodates', 'room_type', 'amenities'
    ]].to_dict(orient='records')
