# sar_processing/anomaly_detection.py

def detect_moisture_anomaly(vv_delta, threshold):
    """Classify moisture change using a symmetric delta threshold."""
    if vv_delta > threshold:
        return "high"
    if vv_delta < -threshold:
        return "low"
    return "normal"

def detect_flood(vv_mean, vh_mean):
    # Very rough but defensible heuristic
    if vv_mean is None or vh_mean is None:
        return False
    return vv_mean < -18 and vh_mean < -22