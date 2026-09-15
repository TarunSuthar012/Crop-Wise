# sar_processing/feature_extractor.py

def compute_deltas(current, previous):
    """Safe 7-day deltas; missing values fall back to 0 to avoid crashes."""

    def _delta(key):
        cur = current.get(key)
        prev = previous.get(key)
        if cur is None or prev is None:
            return 0.0
        return cur - prev

    return {
        "vv_delta_7d": _delta("vv_mean"),
        "vh_delta_7d": _delta("vh_mean"),
    }