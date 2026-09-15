import os
import sys
from pathlib import Path
from fpdf import FPDF

# Suppress warnings
import warnings
warnings.filterwarnings("ignore")

class BeejRakshakPDF(FPDF):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.alias_nb_pages()
        self.set_margins(15, 20, 15)
        self.set_auto_page_break(True, margin=20)
        
    def header(self):
        if self.page_no() == 1:
            return
        # Top margin spacing is 20, so print header around Y=10
        self.set_y(10)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, 'BeejRakshak Technical Architecture & Workflow Report', 0, 0, 'L')
        self.cell(0, 5, 'Version 2.0.0', 0, 1, 'R')
        self.set_draw_color(220, 220, 220)
        self.line(15, 16, 195, 16)
        # Reset Y for page content (starts below header)
        self.set_y(22)
        
    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-15)
        self.set_draw_color(220, 220, 220)
        self.line(15, self.get_y(), 195, self.get_y())
        self.set_font('Arial', 'I', 8)
        self.set_text_color(120, 120, 120)
        self.cell(90, 8, 'Confidential - Internal Project Documentation', 0, 0, 'L')
        self.cell(90, 8, f'Page {self.page_no()} of {self.pages_count()}', 0, 0, 'R')

    def pages_count(self):
        # returns total page count alias
        return "{nb}"

    def section_header(self, title):
        self.ln(6)
        self.set_font('Arial', 'B', 14)
        self.set_text_color(24, 84, 48)  # Deep Forest Green
        self.cell(0, 10, title, 0, 1, 'L')
        self.set_draw_color(24, 84, 48)
        self.set_line_width(0.5)
        self.line(15, self.get_y() - 1, 195, self.get_y() - 1)
        self.ln(3)

    def subsection_header(self, title):
        self.ln(4)
        self.set_font('Arial', 'B', 11)
        self.set_text_color(44, 62, 80)  # Charcoal
        self.cell(0, 6, title, 0, 1, 'L')
        self.ln(2)

    def paragraph(self, text, style=''):
        self.set_font('Arial', style, 10)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 5, text)
        self.ln(2)

    def bullet_point(self, label, text):
        self.set_font('Arial', 'B', 10)
        self.set_text_color(44, 62, 80)
        self.write(5, f" - {label}: ")
        self.set_font('Arial', '', 10)
        self.set_text_color(60, 60, 60)
        self.write(5, f"{text}\n")
        self.ln(1)

    def code_block(self, text):
        self.set_fill_color(245, 247, 245)
        self.set_draw_color(220, 225, 220)
        self.set_font('Courier', '', 9)
        self.set_text_color(40, 70, 40)
        
        # Calculate lines
        lines = text.strip().split('\n')
        
        # Draw background and border
        width = 180
        height = len(lines) * 4.5 + 4
        
        # Ensure block fits on page, or push to next page
        if self.get_y() + height > 270:
            self.add_page()
            
        self.rect(15, self.get_y(), width, height, 'DF')
        self.set_y(self.get_y() + 2)
        for line in lines:
            self.set_x(17)
            self.cell(0, 4.5, line, 0, 1)
        self.ln(3)

    def styled_table(self, headers, data, col_widths):
        # Header
        self.set_fill_color(24, 84, 48)  # Deep Forest Green
        self.set_text_color(255, 255, 255)
        self.set_draw_color(220, 220, 220)
        self.set_font('Arial', 'B', 9)
        
        # Calculate heights and make sure it fits
        if self.get_y() + 15 > 270:
            self.add_page()
            
        for i, header in enumerate(headers):
            self.cell(col_widths[i], 8, header, 1, 0, 'C', True)
        self.ln(8)
        
        # Data
        self.set_font('Arial', '', 9)
        self.set_text_color(60, 60, 60)
        
        fill = False
        for row in data:
            if self.get_y() + 8 > 270:
                self.add_page()
                # Re-draw headers on new page
                self.set_fill_color(24, 84, 48)
                self.set_text_color(255, 255, 255)
                self.set_font('Arial', 'B', 9)
                for i, header in enumerate(headers):
                    self.cell(col_widths[i], 8, header, 1, 0, 'C', True)
                self.ln(8)
                self.set_font('Arial', '', 9)
                self.set_text_color(60, 60, 60)
                
            self.set_fill_color(248, 250, 248) if fill else self.set_fill_color(255, 255, 255)
            for i, cell_val in enumerate(row):
                self.cell(col_widths[i], 7, str(cell_val), 1, 0, 'L', True)
            self.ln(7)
            fill = not fill
        self.ln(4)

def generate_report(output_paths):
    pdf = BeejRakshakPDF()
    
    # ================= PAGE 1: COVER PAGE =================
    pdf.add_page()
    
    # Deep Forest Green header band
    pdf.rect(0, 0, 210, 100, 'F')
    pdf.set_fill_color(24, 84, 48)
    pdf.rect(0, 100, 210, 5, 'F') # Small accent line
    
    # Title text (white)
    pdf.set_y(35)
    pdf.set_font('Arial', 'B', 28)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 12, 'B E E J R A K S H A K', 0, 1, 'C')
    pdf.set_font('Arial', 'B', 16)
    pdf.cell(0, 10, 'Technical Architecture & Workflow Report', 0, 1, 'C')
    pdf.ln(5)
    
    pdf.set_font('Arial', 'I', 11)
    pdf.cell(0, 8, 'A Farmer-First AgriTech Platform: Mandi Intelligence, GEE SAR Monitoring, & Schemes', 0, 1, 'C')
    
    # Cover page body / metadata
    pdf.set_y(130)
    pdf.set_font('Arial', 'B', 12)
    pdf.set_text_color(44, 62, 80)
    pdf.cell(0, 8, 'PROJECT DOCUMENTATION & ARCHITECTURE DETAILS', 0, 1, 'C')
    pdf.ln(10)
    
    # Metadata Block
    pdf.set_x(30)
    pdf.set_fill_color(248, 250, 248)
    pdf.set_draw_color(220, 225, 220)
    pdf.rect(30, pdf.get_y(), 150, 60, 'DF')
    
    pdf.set_y(pdf.get_y() + 5)
    pdf.set_font('Arial', 'B', 10)
    pdf.set_text_color(24, 84, 48)
    
    metadata = [
        ("Platform Name", "BeejRakshak (formerly CropWise)"),
        ("Version", "2.0.0 (Production Release)"),
        ("Target Users", "Farmers, Agricultural Planners, Agri-Extension Officers"),
        ("Key Features", "Spatial-Temporal Mandi Arbitrage, Scheme Scraping & Claim Gen,"),
        ("", "GEE SAR Soil Moisture Analysis, NPK Fertilizer Advisor"),
        ("Date Generated", "July 7, 2026"),
        ("Status", "Operational & Integrated (Web, Mobile, Unified API, SAR Pipeline)")
    ]
    
    for label, val in metadata:
        pdf.set_x(35)
        if label:
            pdf.set_font('Arial', 'B', 9)
            pdf.cell(40, 7, f"{label}:", 0, 0, 'L')
            pdf.set_font('Arial', '', 9)
            pdf.set_text_color(60, 60, 60)
            pdf.cell(100, 7, val, 0, 1, 'L')
        else:
            pdf.set_x(75)
            pdf.set_font('Arial', '', 9)
            pdf.cell(100, 7, val, 0, 1, 'L')
        pdf.set_text_color(24, 84, 48)
        
    # Draw simple logo icon (Leaf shape using coordinates)
    pdf.set_y(210)
    pdf.set_x(95)
    pdf.set_fill_color(34, 139, 34)
    pdf.ellipse(100, 215, 10, 15, 'F')
    pdf.ellipse(105, 222, 6, 10, 'F')
    pdf.set_draw_color(255, 255, 255)
    pdf.line(105, 215, 105, 230)
    
    pdf.set_y(245)
    pdf.set_font('Arial', 'I', 9)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 10, 'Generated by Antigravity AI Pair Programmer', 0, 1, 'C')

    # ================= PAGE 2: TABLE OF CONTENTS & OVERVIEW =================
    pdf.add_page()
    pdf.section_header('Table of Contents')
    
    tocs = [
        ("1. Executive Summary & Project Overview", 3),
        ("2. Codebase Directory Structure & Repository Layout", 4),
        ("3. Comprehensive Technology Stack", 5),
        ("4. Database Architecture & Connectivity (Supabase & PostGIS)", 6),
        ("5. API Architecture & Endpoint Registry", 7),
        ("6. AI/ML Models & Algorithmic Decision Systems", 8),
        ("7. End-to-End System Workflows & User Journeys", 10),
    ]
    
    for title, pg in tocs:
        pdf.set_font('Arial', 'B', 10)
        pdf.set_text_color(44, 62, 80)
        pdf.write(7, title)
        pdf.set_font('Arial', '', 10)
        pdf.set_text_color(150, 150, 150)
        dots = "." * (80 - len(title))
        pdf.write(7, f" {dots} ")
        pdf.set_font('Arial', 'B', 10)
        pdf.set_text_color(24, 84, 48)
        pdf.write(7, f"Page {pg}\n")
        pdf.ln(2)
        
    pdf.ln(5)
    
    pdf.section_header('1. Executive Summary & Project Overview')
    pdf.paragraph(
        "BeejRakshak is a comprehensive, farmer-first AgriTech platform designed to bridge the gap between "
        "agricultural science, market economics, and rural farmers. Developed as a multi-client ecosystem, the platform "
        "provides real-time, actionable insights directly to farmers through a responsive React Web Dashboard, a React "
        "Native Mobile App, and a Unified API Backend. The core modules of the project address major agricultural hurdles:"
    )
    
    pdf.bullet_point("Mandi Price Intelligence", "Predicts agricultural commodity prices for the next 7 days using machine learning (XGBoost) and evaluates net-profit-maximizing spatial and temporal arbitrage (where and when to sell). It factors in transportation distances, traffic congestion, daily storage fees, and crop perishability rates.")
    pdf.bullet_point("Government Scheme Assistance (Scrapbot)", "Automatically scrapes state and central agricultural schemes, caches them in a database, matches farmers based on profiles (state, land holdings, category), and generates official PMFBY insurance claim forms as downloadable PDFs.")
    pdf.bullet_point("SAR Field Monitoring", "Uses Synthetic Aperture Radar (SAR) Sentinel-1 backscatter statistics (VV/VH bands) via Google Earth Engine to remotely compute soil moisture anomalies and flood flags. This data is mapped to GIS geometries and stored in a PostGIS spatial database.")
    pdf.bullet_point("NPK Fertilizer Advisor", "Calculates customized NPK recommendations and schedules by factoring in soil pH, soil texture type, satellite NDVI crop stress, irrigation status, and rainfall levels for districts in Gujarat, converting them into precise Urea, DAP, and MOP product quantities.")
    pdf.bullet_point("Yield Prediction Batch Engine", "Integrates a specialized Java-based prediction model (using subprocess execution) to forecast expected crop yields (in tonnes per hectare) based on state, district, crop type, year, season, and area.")

    # ================= PAGE 4: CODE DIRECTORY STRUCTURE =================
    pdf.add_page()
    pdf.section_header('2. Codebase Directory Structure & Repository Layout')
    pdf.paragraph(
        "The project is structured as a monorepo consisting of distinct components separated by responsibility: "
        "the frontend clients (web and mobile), the backend API servers, the AI/ML python engines, and the SAR "
        "satellite processing pipelines. Below is the comprehensive structure of the repository:"
    )
    
    repo_structure = """BeejRakshak/ (Root Monorepo)
|-- package.json                   # Root config, contains install:all & concurrently runner
|-- run-servers.bat                # Windows batch utility to start web client & FastAPI together
|-- client/                        # React Web Frontend (Vite, Tailwind CSS, Supabase SDK)
|   |-- package.json               # Frontend dependencies & scripts
|   |-- vite.config.js             # Vite configuration with proxy settings
|   |-- index.html                 # Entry HTML template
|   \-- src/
|       |-- main.jsx               # React DOM bootstrapping
|       |-- App.jsx                # Layout, Routes, and Supabase auth state binding
|       |-- index.css              # Custom styling definitions
|       |-- components/            # Reusable UI widgets
|       |   |-- FertilizerAdvisor.jsx   # Form and advisor for soil NPK & product conversions
|       |   \-- GovernmentSchemes.jsx   # Scheme finder and PDF claim downloader
|       |-- hooks/
|       |   \-- useAuth.js         # Supabase Authentication state hook
|       |-- lib/
|       |   |-- supabase.js        # Supabase Client instantiation and custom query error formatter
|       |   |-- registration.js    # Interface for loading, saving, updating farmer profile records
|       |   \-- localDb.js         # Offline fallback localStorage interface for farmers & registrations
|       |-- pages/
|       |   |-- Login.jsx          # Mobile OTP or Email/Password login page
|       |   |-- Registration.jsx   # Farmer onboarding profile details form
|       |   \-- Dashboard.jsx      # Heavy dashboard container managing Mandi, Weather, and SAR details
|       \-- translation/           # Multilingual translation subsystem
|           |-- googleTranslateWidget.jsx # Google Translate i18n overlay integration
|           \-- TranslationProvider.jsx   # Context wrapper translating text locally
|-- mobile/                        # React Native Mobile App (Expo, AsyncStorage, Expo-Location)
|   |-- App.js                     # Root entry binding Contexts and AppNavigator
|   |-- app.json / app.config.js   # Expo application descriptors
|   |-- package.json               # Mobile dependency declarations
|   \-- src/
|       |-- theme.js               # Styled system theme configuration
|       |-- components/            # StatCard, Section, Badge mobile components
|       |-- context/
|       |   \-- AuthContext.js     # React Context wrapper managing Supabase mobile authentication
|       |-- lib/
|       |   |-- supabase.js        # React Native Supabase client with AsyncStorage persistency
|       |   |-- registration.js    # Mobile client registration loader/uploader
|       |   \-- farmWeather.js     # Live weather API integrations
|       |-- navigation/
|       |   \-- AppNavigator.js    # Stack navigator separating Login, Registration, & Dashboard
|       \-- screens/
|           |-- LoginScreen.js     # Authentication screen (SMS OTP / Password entry)
|           |-- RegistrationScreen.js # Profile setup form
|           \-- DashboardScreen.js # Profile overview, Mandi recommender, and weather metrics
|-- AIML/                          # Unified Python AI/ML Service
|   |-- main.py                    # Master FastAPI server. Mounts mandi, schemes, & fertilizer routers
|   |-- pyproject.toml / requirements.txt # Python package manifests
|   |-- mandi_intelligence/        # Mandi Price Prediction & Arbitrage Module
|   |   |-- dataset/
|   |   |   \-- commodity_price.csv # Historical market dataset (AGMARKNET style)
|   |   |-- ml_arbitrage/          # Machine learning and decision logic
|   |   |   |-- data_loader.py     # Filters and processes CSV records, generates stubs
|   |   |   |-- distance_calculator.py # Geopy and Haversine-based mandi distance resolver
|   |   |   |-- price_predictor.py # Trains and serves recursive XGBoost regressors
|   |   |   |-- arbitrage_engine.py # Core spatial-temporal net-profit arbitrage optimizer
|   |   |   \-- models/            # Pickle serialized (.pkl) models per Mandi-Crop
|   |   \-- api/
|   |       \-- main.py            # Mandi-specific FastAPI sub-app with routes and Static mounts
|   \-- scrapbot/                  # Government Scheme Scraping and Matching Module
|       |-- src/
|       |   |-- main.py            # Scheme FastAPI sub-app mounting routes
|       |   |-- schemes_db.json    # Cached scraped schemes database
|       |   |-- scheme_scraper.py  # Mock/live scraper digesting Vikaspedia entries
|       |   |-- scheme_matcher.py  # Profile criteria matcher logic
|       |   \-- claim_generator.py # Formats PMFBY insurance claims using FPDF
|       \-- static/                # Directory storing generated claim PDFs
|-- sar_processing/                # GEE Sentinel-1 SAR Backscatter & GIS Pipeline
|   |-- worker.py                  # Cron-worker pulling field polygons, fetching GEE statistics
|   |-- config.py                  # Configurations (GEE keys, DB URLs, thresholds)
|   |-- db.py                      # Database cursor connections, inserts, updates
|   |-- bootstrap_db.py            # Script executing PostGIS schema definitions and extension setups
|   |-- gee_client.py              # Interface triggering Earth Engine imagery aggregates
|   |-- feature_extractor.py       # Computes 7-day backscatter means and deltas
|   |-- anomaly_detection.py       # Classifies soil moisture states and flood metrics
|   \-- pyproject.toml             # Python packaging dependencies
\-- docs/
    \-- registration-table.sql     # SQL Schema scripts setup for Supabase DB"""
    pdf.code_block(repo_structure)

    # ================= PAGE 5: TECHNOLOGY STACK =================
    pdf.add_page()
    pdf.section_header('3. Comprehensive Technology Stack')
    pdf.paragraph(
        "BeejRakshak leverages a modern, decoupled, yet cohesive technology stack to ensure high scalability, "
        "robustness under offline conditions, and fast calculations of ML models. The table below outlines the "
        "modules, technologies used, and their exact roles in the project:"
    )
    
    tech_headers = ["Layer / Module", "Core Technology", "Role / Implementation Details"]
    tech_data = [
        ["Web Frontend", "React 18, Vite 5, Tailwind CSS 3, React Router", "Provides an interactive, responsive dashboard for desktop and mobile web viewports. Uses Vite proxy to route API queries."],
        ["Mobile App", "React Native 0.73, Expo 50, React Navigation", "Delivers a native mobile client for Android & iOS. Uses AsyncStorage to cache credentials and Expo Location for GPS coords."],
        ["Auth Provider", "Supabase Auth (SMS OTP & Email)", "Manages user login and registration sessions securely. Integrates custom RLS policies to restrict farmer profiles."],
        ["Unified API Server", "FastAPI, Uvicorn, Python 3.10+", "Unified API gateway running on port 8000. Mounts the Mandi App, Scrapbot App, and includes the Fertilizer router."],
        ["Mandi Prediction", "XGBoost, Pandas, Scikit-Learn, Pickle", "Per-mandi-crop regression models trained on AGMARKNET dataset. Forecasts prices 1-7 days ahead recursively."],
        ["Arbitrage Optimizer", "Python, Custom mathematical engine", "Decision algorithm maximizing: Profit = Revenue - Transport - Storage - Spoilage - Traffic Delay costs."],
        ["Scheme Scrapbot", "Python, JSON database, FPDF Library", "Scrapes, caches, matches schemes, and formats PMFBY claim PDFs. Auto-fills bank details and prints signed consent."],
        ["SAR Worker Pipeline", "Google Earth Engine, Shapely, Python", "Computes Sentinel-1 backscatter (VV/VH bands) statistics per field polygon to identify flooding and moisture drops."],
        ["Database Layer", "Supabase PostgreSQL, PostGIS", "Stores farmer user details (Supabase) and spatial field GIS polygons/SAR features (local/cloud PostGIS)."],
        ["Yield Engine", "Java (subprocess), PredictYield.bin", "Batch forecast program called as a subprocess by FastAPI, predicting yields based on historical regional records."]
    ]
    pdf.styled_table(tech_headers, tech_data, [35, 45, 100])

    # ================= PAGE 6: DATABASE ARCHITECTURE =================
    pdf.add_page()
    pdf.section_header('4. Database Architecture & Connectivity')
    pdf.paragraph(
        "BeejRakshak operates on a dual-database pattern consisting of: (1) Supabase (managed PostgreSQL) "
        "to handle authentication profiles, farmer registrations, and application configurations, and (2) A spatial PostGIS "
        "database to store geographical field boundaries and historical SAR features."
    )
    
    pdf.subsection_header('A. Supabase Database Schema (User Profiles)')
    pdf.paragraph(
        "The relational database schema inside Supabase consists of two primary tables: public.farmers (which is "
        "automatically synchronized or created upon user registration) and public.registrations (which contains the "
        "complete onboarding profile of the farmer). They are mapped via a 1-to-1 foreign key relation:"
    )
    
    supabase_sql = """-- Farmers Table
CREATE TABLE public.farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Registrations (Profile details after onboarding)
CREATE TABLE public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE UNIQUE,
    farmer_name TEXT,
    aadhaar TEXT NOT NULL,
    mobile TEXT,
    preferred_language TEXT NOT NULL,
    village TEXT,
    district TEXT,
    state TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    land_area NUMERIC,
    land_unit TEXT,
    primary_crop TEXT,
    crop_stage TEXT,
    satellite_consent BOOLEAN NOT NULL DEFAULT FALSE,
    market_preference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);"""
    pdf.code_block(supabase_sql)
    
    pdf.paragraph(
        "Row Level Security (RLS) is enabled on both tables to prevent unauthorized read/write access. "
        "The policy maps auth.uid() directly to user_id to enforce data isolation: each logged-in farmer "
        "can modify and view only their own registration rows."
    )
    
    pdf.subsection_header('B. PostGIS Spatial Database Schema (SAR Monitoring)')
    pdf.paragraph(
        "The SAR pipeline utilises PostGIS features to handle field geometries (polygons) and store computed VV/VH "
        "backscatter characteristics. The bootstrap process creates the following primary tables:"
    )
    
    postgis_sql = """-- PostGIS Spatial tables
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE fields (
    id UUID PRIMARY KEY,
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    name TEXT,
    geometry GEOGRAPHY(POLYGON), -- Geo-coordinate polygon for GEE
    area_acres FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sar_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    vv_mean FLOAT,
    vh_mean FLOAT,
    vv_delta_7d FLOAT,
    vh_delta_7d FLOAT,
    moisture_anomaly TEXT CHECK (moisture_anomaly IN ('low', 'normal', 'high')),
    flood_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(field_id, date)
);"""
    pdf.code_block(postgis_sql)

    # ================= PAGE 7: API ARCHITECTURE =================
    pdf.add_page()
    pdf.section_header('5. API Architecture & Endpoint Registry')
    pdf.paragraph(
        "BeejRakshak coordinates components using a FastAPI master gateway (port 8000) that mounts sub-modules "
        "and handles CORS origins dynamically. Vite serves the frontend (port 5173/5174) and proxies requests to "
        "port 8000 via its configuration."
    )
    
    pdf.subsection_header('A. Connection Configuration (Vite Proxy)')
    pdf.paragraph(
        "To bypass cross-origin restrictions in local development, Vite proxies API requests to the Python API:"
    )
    
    vite_proxy = """// vite.config.js snippet
export default defineConfig({
  server: {
    proxy: {
      '/mandi-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\\/mandi-api/, '/mandi')
      },
      '/schemes-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\\/schemes-api/, '/schemes')
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})"""
    pdf.code_block(vite_proxy)
    
    pdf.subsection_header('B. Complete Unified API Endpoint Registry')
    
    api_headers = ["Method", "Endpoint", "Module", "Request Body / Params", "Response Structure"]
    api_data = [
        ["GET", "/", "Root Gateway", "None", "{'message': 'Welcome...', 'status': 'operational'}"],
        ["GET", "/health", "Root Gateway", "None", "{'status': 'ok'}"],
        ["GET", "/mandi/mandis", "Mandi Predictor", "None", "List of all mandis, distances, crops, record counts"],
        ["POST", "/mandi/response", "Mandi Predictor", "{'crop': str, 'quantity': float, 'latitude': float, 'longitude': float}", "Best selling option (net profit, transport cost, strategy), alternatives, summary"],
        ["POST", "/mandi/respond", "Mandi Feedback", "{'farmer_id': str, 'mandi_name': str, 'crop': str, 'quantity': float, 'actual_price': float, 'sale_date': str}", "{'status': 'success', 'message': 'Thank you...', 'farmer_id': str}"],
        ["POST", "/schemes/api/v1/schemes/recommend", "Scheme Finder", "{'state': str, 'land_size_hectares': float, 'category': str}", "Matched schemes (PM-Kisan, Rythu Bandhu, etc.) based on profile tags & scope"],
        ["POST", "/schemes/api/v1/claims/generate", "Claim PDF Gen", "{'farmer': dict, 'crop': dict, 'incident': dict} ?format=pdf/json", "Generates PMFBY claim PDF. Returns Base64 PDF string + AI assessment, or raw PDF attachment"],
        ["GET", "/api/fertilizer/recommend", "NPK Advisor", "Params: crop, season, land_size_ha, district, ndvi, rainfall", "NPK totals, product weights (Urea/DAP/MOP), split schedules, and soil advisory"],
        ["POST", "/api/yield/predict-batch", "Yield Prediction", "{'state': str, 'district': str, 'season': str, 'year': str, 'area': float, 'crops': List[str]}", "List of crop predictions containing estimated yields in tonnes using Java executable"]
    ]
    pdf.styled_table(api_headers, api_data, [15, 43, 27, 45, 50])

    # ================= PAGE 8: ML MODELS & SYSTEMS =================
    pdf.add_page()
    pdf.section_header('6. AI/ML Models & Algorithmic Decision Systems')
    pdf.paragraph(
        "BeejRakshak integrates mathematical modeling and machine learning to power its core decision-making "
        "engines. These systems range from predictive time-series models to rule-based multi-criteria optimizers."
    )
    
    pdf.subsection_header('A. Mandi Price Prediction (XGBoost Regressor)')
    pdf.paragraph(
        "Price forecasting is modeled as a supervised time-series regression task. The project trains a separate "
        "XGBoost model for each distinct Mandi-Crop combination (e.g. Ahmedabad-Onion, Mehsana-Wheat) to capture "
        "micro-market variations. The model maps features from historical AGMARKNET-style records:"
    )
    
    pdf.bullet_point("Temporal Features", "day_of_week, day_of_month, week_of_year, month, and days_since_start (trend).")
    pdf.bullet_point("Lag Features", "Commodity prices from 1, 7, and 14 days ago to capture short-term memory.")
    pdf.bullet_point("Rolling Statistics", "7-day and 14-day rolling price averages, and 7-day price volatility (rolling std).")
    pdf.bullet_point("Price Momentum", "7-day rate-of-change percentage.")
    
    pdf.paragraph(
        "Forecasting is executed recursively for 7 days ahead: the model predicts Day 1's price, appends it as the "
        "lagged feature, and recursively feeds it back to predict Day 2, continuing up to Day 7. Serialized models "
        "are saved as .pkl files under the ml_arbitrage/models/ directory."
    )
    
    pdf.subsection_header('B. Net Profit Arbitrage Optimization Algorithm')
    pdf.paragraph(
        "The Arbitrage Engine processes the predicted prices alongside geographic and operational costs to maximize "
        "net revenue. It compares two options: (A) Spatial Arbitrage (sell today at the best mandi), and (B) Temporal "
        "Arbitrage (store and wait to sell). The engine evaluates the mathematical profit formula:"
    )
    
    profit_formula = """Net Profit = (Price * Qty) - (Distance * FuelCost) - (Days * Qty * StorageCost) 
             - (Days * PerishabilityFactor * GrossRevenue)
             - (TrafficCongestion * PerishabilityFactor * GrossRevenue * 0.5)

Parameters:
- Fuel Cost: Constant at Rs. 5.0 per km.
- Storage Cost: Constant at Rs. 0.50 per kg per day.
- Perishability Factor: Daily crop decay rate (Onion: 3%, Potato: 2%, Wheat/Rice: <1%).
- Traffic Congestion Score: 0-1 scale. Delays increase decay cost for perishables."""
    pdf.code_block(profit_formula)

    # ================= PAGE 9: ML MODELS PART 2 =================
    pdf.add_page()
    pdf.subsection_header('C. NPK Fertilizer Recommendation Heuristics')
    pdf.paragraph(
        "The Fertilizer Advisor is a rule-based expert system that calculates nitrogen (N), phosphorus (P), "
        "and potassium (K) needs based on baseline crop requirements and applies environmental modifiers. "
        "The calculation proceeds as follows:"
    )
    
    fertilizer_logic = """1. Retrieve base crop NPK per hectare (e.g., Potato: N=180, P=80, K=100 kg/ha).
2. Query soil properties of the farmer's district from gujarat_districts.csv (pH, Soil Type, Irrigation).
3. Apply multipliers based on conditions:
   - Soil pH < 6.0 (acidic) -> Reduce P by 20% (due to fixation). Suggest lime at 200 kg/ha.
   - Soil pH > 7.5 (alkaline) -> Increase P by 10%, reduce K by 15%. Suggest gypsum.
   - Sandy Soil Type -> Increase N by 15%, K by 20% (due to leaching).
   - Black Cotton Soil Type -> Increase K by 10%.
   - Crop stress (NDVI < 0.3) -> Increase N by 20%, recommend Zinc Sulphate.
   - Irrigated (Irrigation ratio > 50%) -> Increase all NPK by 15% (higher yield capability).
   - Rainfed -> Decrease all NPK by 10%.
4. Convert NPK total requirements (NPK * land size) to raw fertilizer weights:
   - DAP (Di-Ammonium Phosphate) weight = Total P / 0.46
   - Urea weight = (Total N - (DAP weight * 0.18)) / 0.46
   - MOP (Muriate of Potash) weight = Total K / 0.60"""
    pdf.code_block(fertilizer_logic)
    
    pdf.subsection_header('D. SAR (Synthetic Aperture Radar) Remote Heuristics')
    pdf.paragraph(
        "Remote crop health and soil moisture anomalies are assessed without a trained ML model to maintain high "
        "computational speed. The GEE-worker fetches Sentinel-1 Ground Range Detected (GRD) imagery, extracts backscatter "
        "coefficients in decibels (dB), and executes the following rules:"
    )
    pdf.bullet_point("Moisture Anomaly", "Compares the current 7-day average VV backscatter against the historical 7-day baseline delta. If delta > 1.5 dB, soil moisture is classified as 'high' (waterlogged/irrigation event). If delta < -1.5 dB, it is classified as 'low' (drought stress). Otherwise, it is 'normal'.")
    pdf.bullet_point("Flood Classification", "If both polarization bands drop below threshold limits: VV mean < -18 dB and VH mean < -22 dB, the field is flagged as flooded. Under water cover, specular reflection dominates, causing backscatter returns to drop drastically.")

    pdf.subsection_header('E. Yield Prediction Subprocess (Java Integration)')
    pdf.paragraph(
        "FastAPI integrates with an external pre-compiled Java binary PredictYield to calculate regional "
        "yield estimates. The backend issues a subprocess call passing state, district, crop, year, season, and area: "
        "java PredictYield --model model.bin --crop Wheat... It parses the stdout return buffer using regular expressions "
        "to extract the float yield prediction."
    )

    # ================= PAGE 10: WORKFLOWS & CONCLUSION =================
    pdf.add_page()
    pdf.section_header('7. End-to-End System Workflows & User Journeys')
    pdf.paragraph(
        "To understand the operations of BeejRakshak, the diagram below maps out the interaction between the farmer, "
        "the database systems, and the analytical modules:"
    )
    
    workflow_ascii = """[Farmer] ---------> 1. Signs Up / Log In (Supabase OTP) ----------> [Authentication]
   |
   +--------------> 2. Complete Profile Onboarding ---------------> [Supabase DB]
   |                (State, District, Crops, Coordinates, Area)
   |
   +--------------> 3. Requests Mandi Recommendation -------------> [FastAPI Gateway]
   |                (Crop, Quantity, Location coords)                      |
   |                                                                       v
   |                Arbitrage Engine calculates costs <----------- [Arbitrage Engine]
   |                (Gross profit - transport - storage - spoilage)       ^
   |                                                                       |
   |                XGBoost predicts prices recursively <---------- [XGBoost Models]
   |                                                                       |
   |<-- Returns Best Mandi + Sale Day Summary -----------------------------+
   |
   +--------------> 4. Views Field Soil Moisture / Flood Alert ----> [PostGIS Spatial]
   |                                                                       ^
   |                                                                       |
   |                Cron Worker queries GEE Sentinel-1 and updates --------+
   |                soil moisture deltas and flood heuristics
   |
   +--------------> 5. Crop Damaged -> Triggers Insurance Claim --> [FastAPI Gateway]
                    (Fills out PMFBY form, parses GEE rain/moisture)       |
                                                                           v
   |<-- Downloads digitally-signed official PMFBY claim PDF <----- [claim_generator.py]"""
    pdf.code_block(workflow_ascii)
    
    pdf.subsection_header('Summary of Core Workflow Paths')
    pdf.bullet_point("Onboarding Path", "The farmer authenticates via Mobile OTP. They fill out their farm parameters (e.g. 2 hectares of Onions in Rajkot, Gujarat). The React client upserts this record to Supabase, validating Aadhaar and caching it locally for offline resilience.")
    pdf.bullet_point("Arbitrage Decision Path", "The farmer requests a selling strategy for Onions. The FastAPI server retrieves current mandi prices, calls the XGBoost engine to project prices for 7 days, evaluates storage/decay trade-offs, and recommends the best spatial-temporal option (e.g., 'Hold 3 days, sell at Mehsana').")
    pdf.bullet_point("Monitoring Path", "A daily background worker executes Python/GEE scripts. It translates PostGIS field geometries to Earth Engine coordinate filters, calculates VV/VH decibel means, detects anomalies, and updates DB tables. If a flood is flagged, an alert row is populated.")
    pdf.bullet_point("Insurance Relief Path", "If a crop is lost, the farmer generates a PMFBY claim. The assistant grabs the farmer's registered profile, loads incident details, performs an AI damage check (matching GEE rain records), and creates a signed PDF ready for claim submission.")
    
    pdf.ln(5)
    pdf.paragraph(
        "Through this integration of mobile client, web dashboard, Python FastAPI backend, and spatial GIS pipelines, "
        "BeejRakshak provides a modern technical framework to improve agricultural profits and secure farmers against "
        "climate risks."
    )
    
    # Write to files
    for path in output_paths:
        try:
            pdf.output(str(path))
            print(f"Successfully generated PDF at: {path}")
        except Exception as e:
            print(f"Error saving PDF to {path}: {e}")

if __name__ == "__main__":
    # Outputs: one in artifacts directory, one in workspace, one in Downloads
    artifacts_dir = Path(r"C:\Users\Tarun Suthar\.gemini\antigravity\brain\18ae63eb-be85-4e67-957c-6e38db6551af")
    workspace_dir = Path(r"D:\CropWise-main\CropWise-main")
    downloads_dir = Path(os.path.expanduser('~')) / 'Downloads'
    
    paths = [
        artifacts_dir / "BeejRakshak_System_Architecture_and_Workflow.pdf",
        workspace_dir / "BeejRakshak_System_Architecture_and_Workflow.pdf",
        downloads_dir / "BeejRakshak_System_Architecture_and_Workflow.pdf"
    ]
    
    generate_report(paths)
