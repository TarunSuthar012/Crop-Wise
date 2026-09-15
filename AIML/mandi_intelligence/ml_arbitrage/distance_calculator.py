"""
Distance Calculator for Gujarat Mandis
======================================

Calculates distances between any two locations in Gujarat.
Uses a distance matrix of major cities and mandis, and Haversine formula for coordinates.
"""

import math
from typing import Dict, Tuple, Union, Optional

# Distance matrix: distances in km between major Gujarat locations
# Based on actual road distances via major highways
DISTANCE_MATRIX = {
    # Format: (city1, city2): distance_km
    ('Gandhinagar', 'Ahmedabad'): 26,
    ('Gandhinagar', 'Mehsana'): 62,
    ('Gandhinagar', 'Rajkot'): 237,
    ('Gandhinagar', 'Surat'): 273,
    ('Gandhinagar', 'Anand'): 98,
    ('Gandhinagar', 'Bharuch'): 211,
    ('Gandhinagar', 'Amreli'): 277,
    ('Gandhinagar', 'Vadodara'): 100,
    ('Gandhinagar', 'Bhavnagar'): 200,
    ('Gandhinagar', 'Jamnagar'): 330,
    ('Gandhinagar', 'Junagadh'): 330,
    
    ('Ahmedabad', 'Mehsana'): 64,
    ('Ahmedabad', 'Rajkot'): 216,
    ('Ahmedabad', 'Surat'): 263,
    ('Ahmedabad', 'Anand'): 89,
    ('Ahmedabad', 'Bharuch'): 192,
    ('Ahmedabad', 'Vadodara'): 110,
    ('Ahmedabad', 'Bhavnagar'): 189,
    ('Ahmedabad', 'Jamnagar'): 315,
    ('Ahmedabad', 'Amreli'): 255,
    
    ('Rajkot', 'Surat'): 296,
    ('Rajkot', 'Jamnagar'): 92,
    ('Rajkot', 'Bhavnagar'): 165,
    ('Rajkot', 'Amreli'): 117,
    ('Rajkot', 'Junagadh'): 104,
    
    ('Surat', 'Vadodara'): 145,
    ('Surat', 'Bharuch'): 66,
    ('Surat', 'Anand'): 176,
    
    ('Vadodara', 'Anand'): 46,
    ('Vadodara', 'Bharuch'): 66,
    ('Vadodara', 'Mehsana'): 148,
    
    # Add more as needed
}

# Coordinates for Major Cities and Districts in Gujarat (Lat, Lon)
LOCATION_COORDINATES = {
    'Ahmedabad': (23.0225, 72.5714),
    'Amreli': (21.6032, 71.2221),
    'Anand': (22.5645, 72.9289),
    'Banaskanth': (24.3167, 71.7455), # Palanpur approx
    'Bharuch': (21.7051, 72.9959),
    'Bhavnagar': (21.7645, 72.1519),
    'Botad': (22.1706, 71.6644),
    'Chhota Udaipur': (22.3072, 74.0106),
    'Dahod': (22.8304, 74.2464),
    'Dang': (20.9167, 73.7000), # Ahwa
    'Devbhoomi Dwarka': (22.2442, 68.9685),
    'Gandhinagar': (23.2156, 72.6369),
    'Gir Somnath': (20.9029, 70.3664),
    'Jamnagar': (22.4707, 70.0577),
    'Junagadh': (21.5222, 70.4579),
    'Kheda': (22.7548, 72.6853), # Nadiad approx
    'Kutch': (23.2420, 69.6669), # Bhuj approx
    'Mahisagar': (23.1664, 73.5852), # Lunawada
    'Mehsana': (23.5880, 72.3693),
    'Morbi': (22.8120, 70.8276),
    'Narmada': (21.8906, 73.5135), # Rajpipla
    'Navsari': (20.9467, 72.9520),
    'Panchmahal': (22.7760, 73.6139), # Godhra
    'Patan': (23.8493, 72.1266),
    'Porbandar': (21.6417, 69.6293),
    'Rajkot': (22.3039, 70.8022),
    'Sabarkantha': (23.6843, 72.9696), # Himmatnagar
    'Surat': (21.1702, 72.8311),
    'Surendranagar': (22.7237, 71.6372),
    'Tapi': (21.1437, 73.4184), # Vyara
    'Vadodara': (22.3072, 73.1812),
    'Valsad': (20.5992, 72.9342),
    'Mansa': (23.4276, 72.6582),
    'Kalol': (23.2413, 72.4930),
    'Dehgam': (23.1670, 72.8228),
    'Sanand': (22.9934, 72.3789),
    'Bavla': (22.8396, 72.3551),
    'Dholka': (22.7169, 72.4590),
    'Dhandhluka': (22.3725, 71.9961),
    'Viramgam': (23.1189, 72.0520),
    'Mandal': (23.2840, 71.9168),
    'Detroj': (23.3667, 72.1833),
}

# City aliases and standardization
CITY_ALIASES = {
    'gandhinagar': 'Gandhinagar',
    'ahmedabad': 'Ahmedabad',
    'amd': 'Ahmedabad',
    'mehsana': 'Mehsana',
    'mahesana': 'Mehsana',
    'rajkot': 'Rajkot',
    'surat': 'Surat',
    'anand': 'Anand',
    'bharuch': 'Bharuch',
    'vadodara': 'Vadodara',
    'baroda': 'Vadodara',
    'bhavnagar': 'Bhavnagar',
    'jamnagar': 'Jamnagar',
    'amreli': 'Amreli',
    'junagadh': 'Junagadh',
    'banaskanth': 'Banaskanth',
    'banaskantha': 'Banaskanth',
    'sabarkantha': 'Sabarkantha',
    'sabarkanth': 'Sabarkantha',
    'panchmahal': 'Panchmahal',
    'panchamahal': 'Panchmahal',
    'kutch': 'Kutch',
    'kachchh': 'Kutch',
}


def standardize_location(location: str) -> str:
    """Standardize location name"""
    if not location:
        return 'Gandhinagar'
    
    location_lower = location.lower().strip()
    return CITY_ALIASES.get(location_lower, location.title())


def get_coordinates(location: str) -> Optional[Tuple[float, float]]:
    """Get coordinates for a location string."""
    loc = standardize_location(location)
    return LOCATION_COORDINATES.get(loc) or LOCATION_COORDINATES.get(loc.split('(')[0].strip())


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers. Use 3956 for miles
    
    # Calculate distance and add 20% for road curvature vs straight line
    crow_flies_dist = c * r
    road_dist = crow_flies_dist * 1.2
    
    return road_dist


def get_distance(from_location: Union[str, Tuple[float, float]], to_location: str) -> float:
    """
    Get distance between two locations in km.
    
    Args:
        from_location: Starting location (name string OR (lat, lon) tuple)
        to_location: Destination location name
        
    Returns:
        Distance in kilometers
    """
    to_loc_std = standardize_location(to_location)
    
    # CASE 1: from_location is a tuple (lat, lon)
    if isinstance(from_location, tuple) and len(from_location) == 2:
        lat1, lon1 = from_location
        # Try to get coordinates for destination
        coords2 = get_coordinates(to_loc_std)
        
        if coords2:
            lat2, lon2 = coords2
            return haversine_distance(lat1, lon1, lat2, lon2)
        else:
            # Fallback for destination without coordinates:
            # Calculate distance to Gandhinagar and add distance from Gandhinagar to destination
            # This is a rough approximation
            gn_coords = LOCATION_COORDINATES['Gandhinagar']
            dist_to_gn = haversine_distance(lat1, lon1, gn_coords[0], gn_coords[1])
            dist_gn_to_target = get_distance('Gandhinagar', to_loc_std)
            return dist_to_gn + dist_gn_to_target

    # CASE 2: from_location is a string
    from_loc_std = standardize_location(from_location)
    
    # Same location
    if from_loc_std == to_loc_std:
        return 0.0
    
    # Try direct lookup in distance matrix
    key1 = (from_loc_std, to_loc_std)
    key2 = (to_loc_std, from_loc_std)
    
    if key1 in DISTANCE_MATRIX:
        return DISTANCE_MATRIX[key1]
    elif key2 in DISTANCE_MATRIX:
        return DISTANCE_MATRIX[key2]
    
    # Try coordinate based calculation if both have coordinates
    coords1 = get_coordinates(from_loc_std)
    coords2 = get_coordinates(to_loc_std)
    
    if coords1 and coords2:
        return haversine_distance(coords1[0], coords1[1], coords2[0], coords2[1])
    
    # If not found, try to estimate using triangulation
    # Find common city and calculate via that route
    estimated = estimate_distance_via_hub(from_loc_std, to_loc_std)
    if estimated:
        return estimated
    
    # Fallback: use approximate estimation based on coordinates
    return estimate_distance_fallback(from_loc_std, to_loc_std)


def estimate_distance_via_hub(from_loc: str, to_loc: str) -> float:
    """
    Estimate distance by routing through a hub city (Ahmedabad or Gandhinagar).
    """
    hubs = ['Gandhinagar', 'Ahmedabad', 'Vadodara']
    
    for hub in hubs:
        # Try to find route: from_loc -> hub -> to_loc
        dist1_key1 = (from_loc, hub)
        dist1_key2 = (hub, from_loc)
        dist2_key1 = (hub, to_loc)
        dist2_key2 = (to_loc, hub)
        
        dist1 = DISTANCE_MATRIX.get(dist1_key1) or DISTANCE_MATRIX.get(dist1_key2)
        dist2 = DISTANCE_MATRIX.get(dist2_key1) or DISTANCE_MATRIX.get(dist2_key2)
        
        if dist1 and dist2:
            # Route via hub (add 10% overhead for non-direct route)
            return (dist1 + dist2) * 1.1
    
    return None


def estimate_distance_fallback(from_loc: str, to_loc: str) -> float:
    """
    Fallback distance estimation.
    Uses average distance to Gandhinagar as reference.
    """
    # Get distances to Gandhinagar for both locations
    from_to_gn = get_distance_to_gandhinagar(from_loc)
    to_to_gn = get_distance_to_gandhinagar(to_loc)
    
    # Rough estimate using triangle inequality
    # This is very approximate but better than nothing
    return abs(from_to_gn - to_to_gn) if from_to_gn and to_to_gn else 150.0


def get_distance_to_gandhinagar(location: str) -> float:
    """Get distance from any location to Gandhinagar"""
    loc = standardize_location(location)
    
    if loc == 'Gandhinagar':
        return 0.0
    
    # Check direct distance
    key1 = ('Gandhinagar', loc)
    key2 = (loc, 'Gandhinagar')
    
    if key1 in DISTANCE_MATRIX:
        return DISTANCE_MATRIX[key1]
    if key2 in DISTANCE_MATRIX:
        return DISTANCE_MATRIX[key2]
        
    # Check coords
    coords = get_coordinates(loc)
    if coords:
        gn_coords = LOCATION_COORDINATES['Gandhinagar']
        return haversine_distance(coords[0], coords[1], gn_coords[0], gn_coords[1])
    
    return None


def calculate_distances_from_location(
    farmer_location: Union[str, Tuple[float, float]], 
    mandis: list
) -> Dict[str, float]:
    """
    Calculate distances from farmer's location to all mandis.
    
    Args:
        farmer_location: Farmer's current location (string or (lat, lon) tuple)
        mandis: List of mandi names
        
    Returns:
        Dictionary mapping mandi_name -> distance in km
    """
    distances = {}
    
    for mandi in mandis:
        distances[mandi] = get_distance(farmer_location, mandi)
    
    return distances


# Example usage
if __name__ == "__main__":
    print("Distance Calculator Test")
    print("=" * 50)
    
    # Test cases
    test_cases = [
        ('Gandhinagar', 'Ahmedabad'),
        ('Ahmedabad', 'Rajkot'),
        ('Surat', 'Rajkot'),
        ('Ahmedabad', 'Surat'), 
    ]
    
    for from_loc, to_loc in test_cases:
        distance = get_distance(from_loc, to_loc)
        print(f"{from_loc} -> {to_loc}: {distance:.1f} km")
        
    print("-" * 30)
    print("Testing Coordinate Based Logic:")
    # Test custom coords (e.g., location in North Gujarat approx near Palanpur)
    my_loc = (24.1724, 72.4346) # Palanpur area
    dist_to_ahmedabad = get_distance(my_loc, 'Ahmedabad')
    print(f"Custom Coords (Palanpur) -> Ahmedabad: {dist_to_ahmedabad:.1f} km")
