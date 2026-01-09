from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score, KFold
import numpy as np
import pandas as pd
import joblib
import os

def cross_validate_rf(npz_path, pkl_path, model_output_path, n_splits=5):
    print("Loading investor feature matrices...")
    data = np.load(npz_path)
    X_amenities = data['amenities_numeric']
    numeric_categorical_features = ['numeric_features', 'categorical_features']
    X_other = np.hstack([data['numeric_features'], data['categorical_features']])
    X = np.hstack([X_amenities, X_other])

    print("Loading investor target variable from pickle...")
    df = pd.read_pickle(pkl_path)

    if 'estimated_revenue_l365d' in df.columns:
        print("Column exists")
    else:
        print("Column not found")
        return 

    missing_count = df['estimated_revenue_l365d'].isna().sum()
    print(f"Missing values in estimated_revenue_l365d: {missing_count}")

    print(df['estimated_revenue_l365d'].describe())
    print(df['estimated_revenue_l365d'].head())

    valid_mask = ~df['estimated_revenue_l365d'].isna()

    X_filtered = X[valid_mask]
    y_filtered = df.loc[valid_mask, 'estimated_revenue_l365d'].values

    print(f"Running {n_splits}-fold cross-validation on {len(y_filtered)} samples...")
    model = RandomForestRegressor(n_estimators=150, max_depth=20, random_state=42)

    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)
    scores = cross_val_score(model, X_filtered, y_filtered, cv=kf, scoring='neg_root_mean_squared_error')

    print(f"Fold RMSEs: {-scores}")
    print(f"Mean RMSE: {-scores.mean():.2f} ± {scores.std():.2f}")

    print("Training final model on full investor data...")
    model.fit(X_filtered, y_filtered)

    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)

    joblib.dump(model, model_output_path)
    print(f"Investor model saved to {model_output_path}")

if __name__ == "__main__":
    cross_validate_rf(
        npz_path='../../static/preprocessed_data/investor_features.npz',
        pkl_path='../../static/preprocessed_data/investor_features.pkl',
        model_output_path='../models/investor_rf_model.joblib',
        n_splits=5
    )
