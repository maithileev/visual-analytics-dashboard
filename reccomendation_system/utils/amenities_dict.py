import pandas as pd
import json
import numpy as np

def build_amenities_dict(df, amenities_col='amenities'):
    all_amenities = set()
    for val in df[amenities_col].fillna('[]'):
        try:
            amenities_list = json.loads(val)
            all_amenities.update([amenity.strip() for amenity in amenities_list])
        except:
            continue
    amen_dict = {amenity: idx for idx, amenity in enumerate(sorted(all_amenities))}
    return amen_dict

def encode_amenities(row, amen_dict, amenities_col='amenities'):
    vec = np.zeros(len(amen_dict), dtype=int)
    val = row.get(amenities_col, None)
    if pd.isna(val):
        return vec
    try:
        amenities_list = json.loads(val)
        amenities_list = [amenity.strip() for amenity in amenities_list]
    except:
        return vec
    for amenity in amenities_list:
        idx = amen_dict.get(amenity)
        if idx is not None:
            vec[idx] = 1
    return vec
