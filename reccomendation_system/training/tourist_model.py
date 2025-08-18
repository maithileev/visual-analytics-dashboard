from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score, KFold
from sklearn.dummy import DummyRegressor  # New: for baseline comparison
import numpy as np
import pandas as pd
import joblib
import os

def cross_validate_rf(npz_path, pkl_path, model_output_path, n_splits=5):
    """Original functionality with key academic enhancements"""
    
    # 1. Data Loading (unchanged)
    print("Loading feature matrices...")
    data = np.load(npz_path)
    print(data.files)

    X_amenities = data['amenities_numeric']
    X_numeric = data['numeric_features']
    X_categorical = data['categorical_features']

    print("Loading target variable from pickle...")
    df = pd.read_pickle(pkl_path)
    df = df.dropna(subset=['review_scores_rating'])

    y = df['review_scores_rating'].values
    valid_indices = df.index

    listing_ids = data['listing_ids']
    listing_urls = data['listing_urls']  # not used in X, just for output
  
    X = np.hstack([X_amenities[valid_indices], X_numeric[valid_indices], X_categorical[valid_indices]])

    # New: Baseline model for academic context
    print("\n[Academic Enhancement] Baseline Model Comparison:")
    baseline = DummyRegressor(strategy="mean")
    baseline_rmse = -cross_val_score(baseline, X, y, cv=n_splits, 
                                   scoring='neg_root_mean_squared_error').mean()
    print(f"Baseline RMSE (always predict mean): {baseline_rmse:.2f}")

    # 2. Original RF Training (unchanged)
    print(f"\nRunning {n_splits}-fold cross-validation...")
    model = RandomForestRegressor(n_estimators=150, max_depth=20, random_state=42)
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)
    scores = cross_val_score(model, X, y, cv=kf, scoring='neg_root_mean_squared_error')

    # Enhanced output formatting
    print("\nValidation Results:")
    print(f"Fold RMSEs: {[f'{x:.2f}' for x in -scores]}")
    print(f"Mean RMSE: {(-scores.mean()):.2f} ± {scores.std():.2f}")
    print(f"Improvement over baseline: {baseline_rmse - (-scores.mean()):.2f} RMSE points")

    # 3. Save Model (unchanged paths)
    print("\nTraining final model on full data...")
    model.fit(X, y)
    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    joblib.dump(model, model_output_path)
    
    # New: Academic note
    print(f"\nModel saved to {model_output_path}")
    print("Note for report: RMSE measures average prediction error in 1-5 rating scale")

if __name__ == "__main__":
    # Original file locations preserved exactly
    cross_validate_rf(
        npz_path='../../static/preprocessed_data/tourist_features.npz',
        pkl_path='../../static/preprocessed_data/tourist_features.pkl',
        model_output_path='../models/tourist_rf_model.joblib',
        n_splits=5
    )