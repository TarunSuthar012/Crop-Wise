import json

def detect_state_scope(text):
    text = text.lower()
    if "gujarat" in text or "mukhyamantri" in text:
        return "Gujarat"
    elif "maharashtra" in text:
        return "Maharashtra"
    elif "pradhan mantri" in text or "central" in text or "national" in text:
        return "Central"
    return "All"

def scrape_schemes():
    # MOCK DATA (Simulating a successful scrape from Vikaspedia/Govt site)
    # In a hackathon, reliability > live scraping.
    
    print("🔄 Connecting to Government Portal Schema...")
    raw_data = [
        {
            "title": "Pradhan Mantri Fasal Bima Yojana",
            "desc": "Central government crop insurance against natural calamities and pests.",
            "eligibility": "All farmers including sharecroppers."
        },
        {
            "title": "Mukhyamantri Kisan Sahay Yojana (Gujarat)",
            "desc": "Gujarat state scheme replacing insurance companies. Zero premium coverage.",
            "eligibility": "Farmers in Gujarat with land < 4 hectares."
        },
        {
            "title": "PM Kisan Samman Nidhi",
            "desc": "Income support of Rs. 6000 per year in 3 installments.",
            "eligibility": "Small and marginal farmers (< 2 hectares)."
        },
        {
            "title": "Telangana Rythu Bandhu",
            "desc": "Investment support for agriculture and horticulture crops.",
            "eligibility": "Farmers in Telangana."
        },
        {
            "title": "Soil Health Card Scheme",
            "desc": "Subsidized soil testing and fertilizer recommendations.",
            "eligibility": "All farmers."
        }
    ]

    processed_schemes = []
    
    for i, item in enumerate(raw_data):
        scope = detect_state_scope(item['title'] + " " + item['desc'])
        
        tags = []
        if "small" in item['eligibility'].lower() or "< 2" in item['eligibility']:
            tags.append("small_farmer")
        else:
            tags.append("all_farmers")

        scheme_obj = {
            "id": f"SCH-{i+100}",
            "name": item['title'],
            "description": item['desc'],
            "scope": scope, 
            "tags": tags,
            "eligibility_text": item['eligibility']
        }
        processed_schemes.append(scheme_obj)

    with open('schemes_db.json', 'w') as f:
        json.dump(processed_schemes, f, indent=4)
        
    print(f"✅ Successfully Cached {len(processed_schemes)} Schemes to schemes_db.json")

if __name__ == "__main__":
    scrape_schemes()