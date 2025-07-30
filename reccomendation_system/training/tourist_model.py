from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score, KFold
import numpy as np
import pandas as pd
import joblib
import os

def cross_validate_rf(npz_path, pkl_path, model_output_path, n_splits=5):
    print("Loading feature matrices...")
    data = np.load(npz_path)
    X_amenities = data['amenities_numeric']
    X_other = data['final_features']
    X = np.hstack([X_amenities, X_other])

    print("Loading target variable from pickle...")
    df = pd.read_pickle(pkl_path)
    y = df['review_scores_rating'].values

    print(f"Running {n_splits}-fold cross-validation...")
    model = RandomForestRegressor(n_estimators=150, max_depth=20, random_state=42)

    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)
    scores = cross_val_score(model, X, y, cv=kf, scoring='neg_root_mean_squared_error')

    print(f"Fold RMSEs: {-scores}")
    print(f"Mean RMSE: {-scores.mean():.2f} ± {scores.std():.2f}")

    # Optionally train on full dataset and save model
    print("Training final model on full data...")
    model.fit(X, y)

    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)

    joblib.dump(model, model_output_path)
    print(f"Model saved to {model_output_path}")

if __name__ == "__main__":
    cross_validate_rf(
        npz_path='../../static/tourist_features.npz',
        pkl_path='../../static/tourist_features.pkl',
        model_output_path='../models/tourist_rf_model.joblib',
        n_splits=5
    )
