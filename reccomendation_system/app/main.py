from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import joblib

app = FastAPI(
    title="Naples Airbnb Recommendation API",
    description="API for tourist and investor Airbnb recommendations",
    version="1.0"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models and data at startup
df_tourist = pd.read_pickle('../../static/preprocessed_data/tourist_features.pkl')
df_investor = pd.read_pickle('../../static/preprocessed_data/investor_features.pkl')

npz_tourist = np.load('../../static/preprocessed_data/tourist_features.npz')
npz_investor = np.load('../../static/preprocessed_data/investor_features.npz')

model_tourist = joblib.load('../models/tourist_rf_model.joblib')
model_investor = joblib.load('../models/investor_rf_model.joblib')


@app.get("/recommend/tourist")
async def recommend_tourist(
    accommodates: int = Query(None, ge=1),
    host_is_superhost: int = Query(None, ge=0, le=1),
    room_type_code: int = Query(None, ge=0),
    minimum_nights: int = Query(None, ge=0),
    min_price: float = Query(None, ge=0),
    max_price: float = Query(None, ge=0),
    review_scores_rating: float = Query(None, ge=0, le=5),
    limit: int = Query(10, ge=1, le=50)
):
    
    # 1. Apply filters directly to DataFrame
    filtered = df_tourist.copy()
    
    if accommodates is not None:
        filtered = filtered[filtered['accommodates'] >= accommodates]
    if host_is_superhost is not None:
        filtered = filtered[filtered['host_is_superhost'] == host_is_superhost]
    if room_type_code is not None:
        filtered = filtered[filtered['room_type_code'] == room_type_code]
    if minimum_nights is not None:
        filtered = filtered[filtered['minimum_nights'] <= minimum_nights]
    if min_price is not None:
        filtered = filtered[filtered['price'] >= min_price]
    if max_price is not None:
        filtered = filtered[filtered['price'] <= max_price]
    if review_scores_rating is not None:
        filtered = filtered[filtered['review_scores_rating'] >= review_scores_rating]

    # If no results, relax filters progressively
    if len(filtered) == 0:
        filtered = df_tourist.copy()
        if review_scores_rating is not None:
            filtered = filtered[filtered['review_scores_rating'] >= max(3.0, review_scores_rating - 0.5)]
        if min_price is not None:
            filtered = filtered[filtered['price'] >= max(10, min_price * 0.7)]
        if max_price is not None:
            filtered = filtered[filtered['price'] <= max_price * 1.3]
        if accommodates is not None:
            filtered = filtered[filtered['accommodates'] >= max(1, accommodates - 1)]

    # 2. Get features and predict
    valid_indices = filtered.index
    amenities = npz_tourist['amenities_numeric'][valid_indices]
    numeric = npz_tourist['numeric_features'][valid_indices]
    categorical = npz_tourist['categorical_features'][valid_indices]
    X = np.hstack([amenities, numeric, categorical])
    
    preds = model_tourist.predict(X)
    listing_ids = npz_tourist['listing_ids'][valid_indices]
    listing_urls = npz_tourist['listing_urls'][valid_indices]  # <-- add urls

    filtered = filtered.copy()
    filtered['predicted_score'] = preds
    filtered['listing_id'] = listing_ids  # <-- align predictions with real IDs
    filtered['listing_url'] = listing_urls  # <-- include urls


    top = filtered.sort_values(by='predicted_score', ascending=False).head(limit)
    recommendations = top[['listing_id', 'listing_url', 'predicted_score']].to_dict(orient='records')

    return {"recommendations": recommendations}

@app.get("/recommend/investor")
async def recommend_investor(
    min_price: float = Query(None, ge=0),
    max_price: float = Query(None, ge=0),
    min_occupancy: float = Query(None, ge=0, le=1),
    minimum_nights: int = Query(None, ge=0),
    property_type_code: int = Query(None, ge=0),
    neighbourhood_code: int = Query(None, ge=0),
    limit: int = Query(10, ge=1, le=50)
):
    filtered = df_investor.copy()

    # Apply filters
    if min_price is not None:
        filtered = filtered[filtered['price'] >= min_price]
    if max_price is not None:
        filtered = filtered[filtered['price'] <= max_price]
    if min_occupancy is not None:
        filtered = filtered[filtered['estimated_occupancy_l365d'] >= min_occupancy]
    if minimum_nights is not None:
        filtered = filtered[filtered['minimum_nights'] <= minimum_nights]
    if property_type_code is not None:
        filtered = filtered[filtered['property_type_code'] == property_type_code]
    if neighbourhood_code is not None:
        filtered = filtered[filtered['neighbourhood_code'] == neighbourhood_code]

    valid_indices = filtered.index

    # Build feature matrix
    amenities = npz_investor['amenities_numeric'][valid_indices]
    numeric = npz_investor['numeric_features'][valid_indices]
    categorical = npz_investor['categorical_features'][valid_indices]
    X = np.hstack([amenities, numeric, categorical])

    # Predict
    preds = model_investor.predict(X)
    listing_ids = npz_investor['listing_ids'][valid_indices]
    listing_urls = npz_investor['listing_urls'][valid_indices]

    filtered = filtered.copy()
    filtered['predicted_score'] = preds
    filtered['listing_id'] = listing_ids
    filtered['listing_url'] = listing_urls

    top = filtered.sort_values(by='predicted_score', ascending=False).head(limit)
    recommendations = top[['listing_id', 'listing_url', 'predicted_score']].to_dict(orient='records')

    return {"recommendations": recommendations}

@app.get("/test")
async def test_connection():
    return {"message": "Backend is up and reachable!"}
