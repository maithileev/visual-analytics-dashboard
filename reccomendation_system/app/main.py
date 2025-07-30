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
    "http://localhost:4174"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models and data at startup
df_tourist = pd.read_pickle('../../static/tourist_features.pkl')
df_investor = pd.read_pickle('../../static/investor_features.pkl')

npz_tourist = np.load('../../static/tourist_features.npz')
npz_investor = np.load('../../static/investor_features.npz')

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

    valid_indices = filtered.index
    amenities = npz_tourist['amenities_numeric'][valid_indices]
    features = npz_tourist['final_features'][valid_indices]
    X = np.hstack([amenities, features])

    preds = model_tourist.predict(X)
    filtered = filtered.copy()
    filtered['predicted_score'] = preds

    top = filtered.sort_values(by='predicted_score', ascending=False).head(limit)
    recommendations = top[['id', 'predicted_score']].to_dict(orient='records')

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
    amenities = npz_investor['amenities_numeric'][valid_indices]
    features = npz_investor['final_features'][valid_indices]
    X = np.hstack([amenities, features])

    preds = model_investor.predict(X)
    filtered = filtered.copy()
    filtered['predicted_score'] = preds

    top = filtered.sort_values(by='predicted_score', ascending=False).head(limit)
    recommendations = top[['id', 'predicted_score']].to_dict(orient='records')

    return {"recommendations": recommendations}


@app.get("/test")
async def test_connection():
    return {"message": "Backend is up and reachable!"}
