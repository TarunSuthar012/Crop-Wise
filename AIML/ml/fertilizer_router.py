from __future__ import annotations

import csv
from difflib import get_close_matches
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query


router = APIRouter(tags=["fertilizer"])

DATA_FILE = Path(__file__).resolve().parent / "gujarat_districts.csv"

BASE_NPK_PER_HA: Dict[str, Dict[str, float]] = {
    "wheat": {"N": 120.0, "P": 60.0, "K": 40.0},
    "rice": {"N": 100.0, "P": 50.0, "K": 50.0},
    "potato": {"N": 180.0, "P": 80.0, "K": 100.0},
    "onion": {"N": 100.0, "P": 50.0, "K": 60.0},
    "maize": {"N": 150.0, "P": 75.0, "K": 40.0},
    "groundnut": {"N": 25.0, "P": 50.0, "K": 50.0},
    "soybean": {"N": 30.0, "P": 60.0, "K": 40.0},
    "soyabean": {"N": 30.0, "P": 60.0, "K": 40.0},
}

DISPLAY_CROP_NAMES: Dict[str, str] = {
    "wheat": "Wheat",
    "rice": "Rice",
    "potato": "Potato",
    "onion": "Onion",
    "maize": "Maize",
    "groundnut": "Groundnut",
    "soybean": "Soybean",
    "soyabean": "Soyabean",
}

SPECIAL_NOTES: Dict[str, str] = {
    "groundnut": (
        "Apply Rhizobium culture seed treatment. "
        "Apply gypsum at 250 kg/ha at pegging stage for calcium supply."
    ),
    "soybean": (
        "Apply Rhizobium and PSB culture seed treatment before sowing for nitrogen fixation."
    ),
    "soyabean": (
        "Apply Rhizobium and PSB culture seed treatment before sowing for nitrogen fixation."
    ),
    "onion": "Apply Sulphur at 20 kg/ha - critical for pungency and bulb development.",
    "rice": "Split urea doses are mandatory - excess N causes lodging and disease.",
    "wheat": "Ensure first irrigation within 21 days of sowing for best N uptake.",
}


def _normalize_text(value: str) -> str:
    return " ".join(str(value or "").strip().lower().split())


def _round1(value: float) -> float:
    return round(float(value), 1)


@lru_cache(maxsize=1)
def _load_district_rows() -> List[Dict[str, str]]:
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"District data file not found: {DATA_FILE}")

    with DATA_FILE.open("r", encoding="utf-8-sig", newline="") as fp:
        reader = csv.DictReader(fp)
        rows = [row for row in reader]
    return rows


def _find_district_record(district: str) -> Dict[str, str]:
    target = _normalize_text(district)
    if not target:
        raise HTTPException(status_code=400, detail="district is required")

    rows = _load_district_rows()

    for row in rows:
        if _normalize_text(row.get("District", "")) == target:
            return row

    for row in rows:
        row_name = _normalize_text(row.get("District", ""))
        if target in row_name or row_name in target:
            return row

    # Registration values may contain minor spelling mistakes (for example,
    # "mehasana" instead of the dataset value "mehsana").
    district_names = [_normalize_text(row.get("District", "")) for row in rows]
    close_matches = get_close_matches(target, district_names, n=1, cutoff=0.8)
    if close_matches:
        return rows[district_names.index(close_matches[0])]

    raise HTTPException(
        status_code=404,
        detail=f"District '{district}' was not found in gujarat_districts.csv",
    )


def _crop_schedule(crop_key: str) -> List[Dict[str, str]]:
    if crop_key in {"wheat", "maize"}:
        return [
            {
                "stage": "Stage 1",
                "timing": "At sowing",
                "description": "Basal at sowing - apply full DAP + full MOP + 1/3 Urea",
            },
            {
                "stage": "Stage 2",
                "timing": "30 days after sowing",
                "description": "Top dress at 30 days - apply 1/3 Urea",
            },
            {
                "stage": "Stage 3",
                "timing": "60 days after sowing",
                "description": "Top dress at 60 days - apply 1/3 Urea",
            },
        ]
    if crop_key == "rice":
        return [
            {
                "stage": "Stage 1",
                "timing": "At sowing",
                "description": "Basal at sowing - full DAP + full MOP + 1/3 Urea",
            },
            {
                "stage": "Stage 2",
                "timing": "21 days after sowing",
                "description": "Top dress at 21 days - 1/3 Urea",
            },
            {
                "stage": "Stage 3",
                "timing": "45 days after sowing",
                "description": "Top dress at 45 days - 1/3 Urea",
            },
        ]
    if crop_key in {"potato", "onion"}:
        return [
            {
                "stage": "Stage 1",
                "timing": "At sowing",
                "description": "Basal at sowing - full DAP + full MOP + half Urea",
            },
            {
                "stage": "Stage 2",
                "timing": "30 days after sowing",
                "description": "Top dress at 30 days - remaining half Urea",
            },
        ]
    return [
        {
            "stage": "Stage 1",
            "timing": "At sowing",
            "description": "Basal at sowing - full NPK",
        }
    ]


def _apply_multiplier(npk: Dict[str, float], factor: float) -> None:
    npk["N"] *= factor
    npk["P"] *= factor
    npk["K"] *= factor


@router.get("/fertilizer/recommend")
def fertilizer_recommend(
    crop: str = Query(..., min_length=1),
    season: str = Query(..., min_length=1),
    land_size_ha: float = Query(..., gt=0),
    district: str = Query(..., min_length=1),
    ndvi: float = Query(0.40, ge=0, le=1),
    rainfall: float = Query(750.0, ge=0),
):
    season_label = _normalize_text(season)
    supported_seasons = {"kharif", "rabi", "summer", "winter", "late kharif", "zaid"}
    if season_label not in supported_seasons:
        raise HTTPException(
            status_code=400,
            detail="Unsupported season. Use Kharif, Rabi, Summer, Winter, or Late Kharif.",
        )

    crop_key = _normalize_text(crop).replace(" ", "")
    if crop_key not in BASE_NPK_PER_HA:
        supported = ", ".join(
            sorted({DISPLAY_CROP_NAMES[k] for k in BASE_NPK_PER_HA.keys()})
        )
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported crop '{crop}'. Supported crops: {supported}",
        )

    district_row = _find_district_record(district)
    soil_type = str(district_row.get("Soil_Type", "")).strip()
    try:
        soil_ph = float(district_row.get("Soil_pH", "0"))
        irrigation_ratio = float(district_row.get("Irrigation_Ratio", "0"))
    except ValueError:
        raise HTTPException(
            status_code=500,
            detail="Invalid Soil_pH or Irrigation_Ratio value in gujarat_districts.csv",
        ) from None

    npk = dict(BASE_NPK_PER_HA[crop_key])
    micronutrient_notes: List[str] = []

    # Step 3 - Soil pH adjustment
    if soil_ph < 6.0:
        npk["P"] *= 0.80
        soil_advisory = "Apply lime at 200 kg/ha before sowing. Soil is acidic."
    elif soil_ph <= 7.5:
        soil_advisory = "Soil pH is optimal for this crop."
    else:
        npk["P"] *= 1.10
        npk["K"] *= 0.85
        soil_advisory = (
            "Apply gypsum at 200 kg/ha before sowing. "
            "Soil is alkaline - common in Gujarat."
        )

    # Step 4 - Soil type adjustment
    soil_type_key = _normalize_text(soil_type)
    if "black cotton" in soil_type_key:
        npk["K"] *= 1.10
    elif "sandy" in soil_type_key or "loamy sand" in soil_type_key:
        npk["N"] *= 1.15
        npk["K"] *= 1.20
    elif "alluvial" in soil_type_key:
        pass
    elif "red laterite" in soil_type_key or "red sandy" in soil_type_key:
        npk["P"] *= 1.15
        micronutrient_notes.append(
            "Apply Zinc Sulphate at 25 kg/ha and Boron at 1 kg/ha."
        )

    # Step 5 - NDVI adjustment
    if ndvi < 0.3:
        npk["N"] *= 1.20
        micronutrient_notes.append(
            "Crop shows stress - apply Zinc Sulphate at 25 kg/ha."
        )
    elif ndvi > 0.5:
        npk["N"] *= 0.90

    # Step 6 - Irrigation adjustment
    if irrigation_ratio > 0.5:
        _apply_multiplier(npk, 1.15)
        irrigation_type = "Irrigated"
    else:
        _apply_multiplier(npk, 0.90)
        irrigation_type = "Rainfed"

    # Step 7 - Rainfall adjustment
    if rainfall > 1200:
        npk["K"] *= 0.90
    elif rainfall < 500:
        npk["N"] *= 1.10

    # Step 8 - Total NPK for land size
    npk_total = {k: npk[k] * land_size_ha for k in ("N", "P", "K")}

    # Step 9 - Product conversion
    fertilizer_products = {
        "urea_kg": _round1(npk_total["N"] / 0.46),
        "dap_kg": _round1(npk_total["P"] / 0.46),
        "mop_kg": _round1(npk_total["K"] / 0.60),
    }

    micronutrient_advisory: Optional[str] = None
    if micronutrient_notes:
        deduped: List[str] = []
        for note in micronutrient_notes:
            if note not in deduped:
                deduped.append(note)
        micronutrient_advisory = " ".join(deduped)

    display_crop = DISPLAY_CROP_NAMES[crop_key]
    special_notes = SPECIAL_NOTES.get(crop_key)
    matched_district = str(district_row.get("District", district)).strip() or district

    response = {
        "crop": display_crop,
        "district": matched_district,
        "season": season.strip(),
        "land_size_ha": _round1(land_size_ha),
        "soil_type": soil_type,
        "soil_ph": _round1(soil_ph),
        "irrigation_type": irrigation_type,
        "ndvi_used": _round1(ndvi),
        "npk_per_ha": {k: _round1(npk[k]) for k in ("N", "P", "K")},
        "npk_total_kg": {k: _round1(npk_total[k]) for k in ("N", "P", "K")},
        "fertilizer_products": fertilizer_products,
        "application_schedule": _crop_schedule(crop_key),
        "soil_advisory": soil_advisory,
        "micronutrient_advisory": micronutrient_advisory,
        "special_notes": special_notes,
        "summary": (
            f"For {display_crop} in {matched_district}, apply "
            f"{fertilizer_products['urea_kg']} kg Urea, "
            f"{fertilizer_products['dap_kg']} kg DAP, and "
            f"{fertilizer_products['mop_kg']} kg MOP over "
            f"{_round1(land_size_ha)} ha ({irrigation_type.lower()} condition)."
        ),
    }
    return response
