import json
import logging

try:
    import ee

    ee.Initialize()
    _EE_AVAILABLE = True
except Exception as exc:  # pragma: no cover - dev fallback
    logging.warning("Earth Engine unavailable, using stub SAR means: %s", exc)
    _EE_AVAILABLE = False

from config import SAR_SCALE_METERS


def _to_ee_geometry(field_geometry):
    """Accept dict or GeoJSON string and return ee.Geometry."""
    if isinstance(field_geometry, str):
        field_geometry = json.loads(field_geometry)
    return ee.Geometry(field_geometry)


def get_sar_means(field_geometry, start_date, end_date, scale_meters=SAR_SCALE_METERS):
    """Fetch mean VV/VH backscatter for a polygon between dates."""
    if not _EE_AVAILABLE:
        return {"vv_mean": -12.3, "vh_mean": -18.1}

    geom = _to_ee_geometry(field_geometry)

    collection = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterBounds(geom)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .select(["VV", "VH"])
    )

    mean_image = collection.mean()

    stats = mean_image.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=geom,
        scale=scale_meters,
        maxPixels=1e9,
    )

    return {
        "vv_mean": stats.get("VV").getInfo(),
        "vh_mean": stats.get("VH").getInfo(),
    }