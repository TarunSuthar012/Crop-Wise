from pathlib import Path
import json

def get_recommended_schemes(user_profile):
    db_path = Path(__file__).parent / 'schemes_db.json'
    if not db_path.exists():
        return []
        
    with open(db_path, 'r') as f:
        db = json.load(f)
    
    recommendations = []
    farmer_state = str(user_profile.get('state', 'Central')).strip()
    farmer_category = user_profile.get('category', 'all_farmers') # e.g., 'small_farmer'
    try:
        land_size = float(user_profile.get('land_size_hectares', 0) or 0)
    except (TypeError, ValueError):
        land_size = 0

    for scheme in db:
        score = 0
        
        # 1. State Filter (Crucial)
        # If scheme is specific to a state, match strictly.
        if scheme['scope'] not in ["Central", "All"] and scheme['scope'] != farmer_state:
            continue 

        max_land_size = scheme.get('max_land_size_hectares')
        if max_land_size is not None and land_size > max_land_size:
            continue
            
        # 2. Scoring Logic
        if scheme['scope'] == farmer_state:
            score += 100 # Home state priority
        elif scheme['scope'] == "Central":
            score += 50
            
        if "all_farmers" in scheme['tags'] or farmer_category in scheme['tags']:
            score += 20
        else:
            # If scheme is only for small farmers but user is large, skip
            if "small_farmer" in scheme['tags'] and farmer_category == "large_farmer":
                continue

        recommendations.append({
            "scheme_name": scheme['name'],
            "description": scheme['description'],
            "match_score": score,
            "type": scheme['scope'],
            "eligible": True,
            "eligibility_text": scheme.get('eligibility_text'),
            "official_url": scheme.get('official_url'),
            "apply_url": scheme.get('apply_url'),
            "documents": scheme.get('documents', []),
        })

    # Sort best matches first
    recommendations.sort(key=lambda x: x['match_score'], reverse=True)
    return recommendations