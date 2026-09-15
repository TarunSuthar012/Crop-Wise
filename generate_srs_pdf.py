import os
import sys
from pathlib import Path
from fpdf import FPDF
import warnings

warnings.filterwarnings("ignore")

class ComprehensiveCropWisePDF(FPDF):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.alias_nb_pages()
        self.set_margins(15, 20, 15)
        self.set_auto_page_break(True, margin=20)
        
    def header(self):
        if self.page_no() == 1:
            return
        self.set_y(10)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, 'CropWise (BeejRakshak) - Comprehensive System Specification & Future Roadmap', 0, 0, 'L')
        self.cell(0, 5, 'Version 2.0.0', 0, 1, 'R')
        self.set_draw_color(220, 220, 220)
        self.line(15, 16, 195, 16)
        self.set_y(22)
        
    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-15)
        self.set_draw_color(220, 220, 220)
        self.line(15, self.get_y(), 195, self.get_y())
        self.set_font('Arial', 'I', 8)
        self.set_text_color(120, 120, 120)
        self.cell(90, 8, 'CropWise Project Documentation & Architectural Blueprint', 0, 0, 'L')
        self.cell(90, 8, f'Page {self.page_no()} of {{nb}}', 0, 0, 'R')

    def section_header(self, title):
        self.ln(5)
        self.set_font('Arial', 'B', 13)
        self.set_text_color(24, 84, 48)  # Forest Green
        self.cell(0, 8, title, 0, 1, 'L')
        self.set_draw_color(24, 84, 48)
        self.set_line_width(0.5)
        self.line(15, self.get_y() - 1, 195, self.get_y() - 1)
        self.ln(3)

    def subsection_header(self, title):
        self.ln(3)
        self.set_font('Arial', 'B', 10.5)
        self.set_text_color(44, 62, 80)
        self.cell(0, 6, title, 0, 1, 'L')
        self.ln(1)

    def paragraph(self, text, style=''):
        self.set_font('Arial', style, 9.5)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 4.8, text)
        self.ln(2)

    def bullet_point(self, label, text):
        self.set_font('Arial', 'B', 9.5)
        self.set_text_color(44, 62, 80)
        self.write(4.8, f" - {label}: ")
        self.set_font('Arial', '', 9.5)
        self.set_text_color(60, 60, 60)
        self.write(4.8, f"{text}\n")
        self.ln(1)

    def code_block(self, text):
        self.set_fill_color(245, 247, 245)
        self.set_draw_color(220, 225, 220)
        self.set_font('Courier', '', 8.5)
        self.set_text_color(40, 70, 40)
        lines = text.strip().split('\n')
        height = len(lines) * 4 + 4
        if self.get_y() + height > 270:
            self.add_page()
        self.rect(15, self.get_y(), 180, height, 'DF')
        self.set_y(self.get_y() + 2)
        for line in lines:
            self.set_x(17)
            self.cell(0, 4, line, 0, 1)
        self.ln(3)

    def styled_table(self, headers, data, col_widths):
        self.set_fill_color(24, 84, 48)
        self.set_text_color(255, 255, 255)
        self.set_draw_color(220, 220, 220)
        self.set_font('Arial', 'B', 8.5)
        
        if self.get_y() + 15 > 270:
            self.add_page()
            
        for i, header in enumerate(headers):
            self.cell(col_widths[i], 7, header, 1, 0, 'C', True)
        self.ln(7)
        
        self.set_font('Arial', '', 8.5)
        self.set_text_color(60, 60, 60)
        fill = False
        for row in data:
            if self.get_y() + 8 > 270:
                self.add_page()
                self.set_fill_color(24, 84, 48)
                self.set_text_color(255, 255, 255)
                self.set_font('Arial', 'B', 8.5)
                for i, header in enumerate(headers):
                    self.cell(col_widths[i], 7, header, 1, 0, 'C', True)
                self.ln(7)
                self.set_font('Arial', '', 8.5)
                self.set_text_color(60, 60, 60)
                
            self.set_fill_color(248, 250, 248) if fill else self.set_fill_color(255, 255, 255)
            for i, cell_val in enumerate(row):
                self.cell(col_widths[i], 6.5, str(cell_val), 1, 0, 'L', True)
            self.ln(6.5)
            fill = not fill
        self.ln(3)

    def diagram_box(self, title, items):
        self.set_fill_color(240, 245, 240)
        self.set_draw_color(24, 84, 48)
        self.set_line_width(0.4)
        height = len(items) * 5 + 10
        if self.get_y() + height > 270:
            self.add_page()
        self.rect(15, self.get_y(), 180, height, 'DF')
        self.set_y(self.get_y() + 3)
        self.set_font('Arial', 'B', 10)
        self.set_text_color(24, 84, 48)
        self.cell(0, 5, f"[ DIAGRAM REFERENCE ]: {title}", 0, 1, 'C')
        self.set_font('Arial', '', 8.5)
        self.set_text_color(60, 60, 60)
        for item in items:
            self.set_x(20)
            self.cell(0, 4.5, item, 0, 1, 'L')
        self.ln(4)

def generate_srs_pdf(output_path):
    pdf = ComprehensiveCropWisePDF()
    
    # ---------------- COVER PAGE ----------------
    pdf.add_page()
    pdf.rect(0, 0, 210, 105, 'F')
    pdf.set_fill_color(24, 84, 48)
    pdf.rect(0, 105, 210, 5, 'F')
    
    pdf.set_y(32)
    pdf.set_font('Arial', 'B', 26)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 12, 'C R O P W I S E', 0, 1, 'C')
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 8, '(BeejRakshak AgriTech Platform)', 0, 1, 'C')
    pdf.ln(3)
    pdf.set_font('Arial', 'I', 11)
    pdf.cell(0, 8, 'Comprehensive System Architecture, Implemented Modules & Strategic Future Roadmap', 0, 1, 'C')
    
    pdf.set_y(128)
    pdf.set_font('Arial', 'B', 12)
    pdf.set_text_color(44, 62, 80)
    pdf.cell(0, 8, 'FULL PROJECT SYSTEM SPECIFICATION DOCUMENT', 0, 1, 'C')
    pdf.ln(6)
    
    pdf.set_x(30)
    pdf.set_fill_color(248, 250, 248)
    pdf.set_draw_color(220, 225, 220)
    pdf.rect(30, pdf.get_y(), 150, 70, 'DF')
    
    pdf.set_y(pdf.get_y() + 5)
    metadata = [
        ("Project Title", "CropWise / BeejRakshak Platform"),
        ("Document Status", "Elaborated Technical Specification & Roadmap"),
        ("Architecture", "Decoupled Web + Mobile Clients, FastAPI Gateway, ML/SAR"),
        ("Active Modules", "Mandi XGBoost Arbitrage, GEE SAR Monitor, Scrapbot,"),
        ("", "NPK Fertilizer Advisor, Kisan Mitra Multilingual AI Chatbot"),
        ("Future Modules", "Leaf CV Disease Classifier, F2B Market & LogiPool, RAG Bot"),
        ("Target Users", "Smallholder Farmers, Extension Officers, FPOs, Agri-Insurers")
    ]
    for label, val in metadata:
        pdf.set_x(35)
        if label:
            pdf.set_font('Arial', 'B', 9)
            pdf.cell(40, 6.5, f"{label}:", 0, 0, 'L')
            pdf.set_font('Arial', '', 9)
            pdf.set_text_color(60, 60, 60)
            pdf.cell(100, 6.5, val, 0, 1, 'L')
        else:
            pdf.set_x(75)
            pdf.set_font('Arial', '', 9)
            pdf.cell(100, 6.5, val, 0, 1, 'L')
        pdf.set_text_color(24, 84, 48)

    pdf.set_y(245)
    pdf.set_font('Arial', 'I', 9)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 10, 'Generated for CropWise Project Engineering & System Architecture Documentation', 0, 1, 'C')

    # ---------------- 1. INTRODUCTION ----------------
    pdf.add_page()
    pdf.section_header('1. Executive Summary & Introduction')
    pdf.paragraph(
        "CropWise (also branded as BeejRakshak) is an advanced, end-to-end AgriTech platform engineered to address "
        "the core financial and operational vulnerabilities faced by smallholder farmers in developing nations. "
        "Built on a modern microservices-style decoupled architecture, CropWise integrates space-borne Synthetic Aperture Radar (SAR) "
        "remote sensing, recursive machine learning price prediction, dynamic net-profit arbitrage modeling, automated government "
        "welfare scheme scraping, and personalized agronomic advisories into a seamless digital experience."
    )
    pdf.paragraph(
        "The system empowers farmers to transition from traditional, highly vulnerable farming methods to data-driven agricultural "
        "practices. It connects web and mobile clients to a high-performance Python FastAPI backend, backed by cloud databases (Supabase) "
        "and spatial PostGIS engines."
    )

    pdf.diagram_box("High-Level Ecosystem Topology", [
        "1. React Web Dashboard & Expo Mobile App (Farmer Touchpoints)",
        "2. Unified FastAPI Master Gateway (Port 8000 REST Routing)",
        "3. Machine Learning Engines (XGBoost Price Models & Net-Profit Arbitrage)",
        "4. Space Observation Engine (Google Earth Engine Sentinel-1 SAR Pipeline)",
        "5. Persistence Layer (Supabase PostgreSQL + PostGIS Spatial Geometries)"
    ])

    # ---------------- 2. PROBLEM STATEMENT ----------------
    pdf.section_header('2. Detailed Problem Statement')
    pdf.paragraph(
        "Smallholder farmers operating in developing agricultural ecosystems (such as India) represent over 85% of total cultivators. "
        "They are trapped in low-income cycles due to four systemic failure points:"
    )
    pdf.bullet_point("1. Market Price Asymmetry & Arbitrage Losses", "Farmers lack predictive awareness of commodity prices across neighboring Mandis (markets). Without accounting for transportation fuel, daily storage fees, traffic delays, and crop decay rates, they suffer heavy financial losses or are forced to sell to local middlemen at throwaway prices.")
    pdf.bullet_point("2. Prohibitive Cost of Field Monitoring", "Traditional IoT soil moisture and flood monitoring hardware requires expensive physical sensors per field, which smallholders cannot afford. Unmonitored fields suffer silent drought stress or sudden flood ruin without early warning.")
    pdf.bullet_point("3. Exclusion from Government Welfare & PMFBY Claims", "Over 100 government support schemes and PMFBY crop insurance benefits exist, but administrative friction and complex paperwork prevent smallholders from claiming their entitled benefits.")
    pdf.bullet_point("4. Climate Instability & Unscientific Schedules", "Erratic monsoon patterns render traditional farming calendars obsolete. Unguided fertilizer application (over-application of Urea) degrades soil health and drains farmer capital.")

    # ---------------- 3. OBJECTIVES ----------------
    pdf.add_page()
    pdf.section_header('3. Objectives of the Project')
    pdf.paragraph("CropWise was designed to achieve the following technical and socio-economic objectives:")
    pdf.bullet_point("Objective 1 (Maximize Market Returns)", "Train XGBoost regressor models per (Mandi, Crop) combination to predict prices 7 days ahead, calculating optimal spatial-temporal sales recommendations.")
    pdf.bullet_point("Objective 2 (Zero-Hardware Satellite Monitoring)", "Implement an automated Python worker that extracts Sentinel-1 SAR backscatter statistics via Google Earth Engine to compute 7-day soil moisture deltas and flood flags without physical sensors.")
    pdf.bullet_point("Objective 3 (Automated Scheme & Claim Delivery)", "Scrape state/central agricultural policies, match farmer eligibility profiles automatically, and generate digitally-formatted PMFBY crop insurance claim PDFs using FPDF.")
    pdf.bullet_point("Objective 4 (Data-Driven Advisory)", "Provide NPK fertilizer recommendations based on soil pH, soil texture, satellite NDVI stress, and rainfall, converting requirements to precise Urea, DAP, and MOP bag weights.")

    # ---------------- 4. SCOPE ----------------
    pdf.section_header('4. Scope of the Project')
    pdf.paragraph(
        "The scope of CropWise covers the complete pipeline from user onboarding, spatial GIS mapping, price forecasting, "
        "and automated claims to conversational advisory support."
    )
    pdf.bullet_point("Geographic Scope", "Primary focus on Indian states (Gujarat, Maharashtra, Central zones) with built-in extensibility for national datasets.")
    pdf.bullet_point("User Scope", "Smallholder farmers, Farmer Producer Organizations (FPOs), Agricultural Extension Officers, and Agri-Insurtech auditors.")
    pdf.bullet_point("System Scope", "React Web Portal, Expo React Native Mobile App, Unified FastAPI Gateway, XGBoost ML Engine, PostGIS Database, GEE SAR Satellite Pipeline.")

    # ---------------- 5. EXISTING VS PROPOSED ----------------
    pdf.section_header('5. Existing System vs. Current Proposed System')
    pdf.paragraph("Below is an architectural comparison contrasting conventional farming practices with the CropWise platform:")
    
    comp_headers = ["Dimension / Feature", "Existing Conventional System", "CropWise Implemented System"]
    comp_data = [
        ["Price Discovery", "Manual visit; local middleman exploitation", "XGBoost 7-day forecast & Net-Profit Arbitrage Engine"],
        ["Field Monitoring", "Requires expensive physical ground sensors", "Zero-cost Sentinel-1 SAR satellite tracking via GEE"],
        ["Logistics Planning", "Blind travel to nearest market", "Net Profit = Revenue - Transport - Storage - Decay - Traffic"],
        ["Scheme Access", "Paper forms; high exclusion rates", "Scrapbot automated matching & instant PMFBY claim PDFs"],
        ["Fertilizer Guidance", "Unscientific urea over-application", "Calculated Urea/DAP/MOP weights tailored to pH, soil, NDVI"],
        ["Farmer Assistant", "No immediate support; high language barrier", "24/7 Kisan Mitra AI Chatbot (Gujarati, Hindi, English)"]
    ]
    pdf.styled_table(comp_headers, comp_data, [35, 65, 80])

    # ---------------- 6. PROPOSED WORKING MECHANISM ----------------
    pdf.add_page()
    pdf.section_header('6. Working Mechanism of Current Implemented Modules')
    pdf.paragraph(
        "CropWise operates through three core decoupled operational loops connecting the client touchpoints with the FastAPI backend:"
    )

    pdf.subsection_header('A. Mandi Arbitrage & Price Prediction Module')
    pdf.paragraph(
        "When a farmer inputs a crop and quantity, FastAPI calls serialized XGBoost regressors (.pkl files) trained on AGMARKNET data. "
        "The model uses temporal features (day, month, week), price lag features (1, 7, 14 days), and rolling statistics (7/14-day MA and std) "
        "to forecast prices recursively for 7 days ahead. The Arbitrage Engine then calculates:"
    )
    
    formula_code = """Net Profit = (Predicted Price * Quantity)
             - (Distance_km * Rs.5/km Transport Cost)
             - (Days * Quantity * Rs.0.50/kg/day Storage Fee)
             - (Days * DecayRate * GrossRevenue)
             - (TrafficScore * DecayRate * GrossRevenue * 0.5)"""
    pdf.code_block(formula_code)

    pdf.subsection_header('B. GEE Sentinel-1 SAR Satellite Monitoring Pipeline')
    pdf.paragraph(
        "A background worker process (worker.py) periodically fetches PostGIS field polygons, constructs 7-day date windows, "
        "and queries Google Earth Engine for Sentinel-1 GRD imagery (IW mode, VV and VH bands). It extracts backscatter decibels (dB) "
        "and calculates deltas:"
    )
    pdf.bullet_point("7-Day Delta Calculation", "VV Delta = Current 7d Mean VV - Previous 7d Mean VV.")
    pdf.bullet_point("Moisture Classification", "If VV Delta > 1.5 dB -> 'high moisture' (irrigation/rain). If VV Delta < -1.5 dB -> 'low moisture' (drought stress). Else -> 'normal'.")
    pdf.bullet_point("Flood Detection Heuristic", "If VV Mean < -18 dB AND VH Mean < -22 dB -> Flagged as Flooded (specular water reflection).")
    pdf.paragraph("Results are stored in the PostGIS table sar_features and queried by the dashboard.")

    pdf.subsection_header('C. Scrapbot Scheme Assistant & PDF Claim Engine')
    pdf.paragraph(
        "Scrapbot digests state and central agricultural schemes (schemes_db.json). It matches farmer profiles based on state, land area, and category. "
        "For damaged crops, it executes claim_generator.py using the FPDF engine to assemble digitally formatted PMFBY insurance claim forms with applicant details and signatures."
    )

    # ---------------- 7. SYSTEM ARCHITECTURE & MONOREPO ----------------
    pdf.add_page()
    pdf.section_header('7. System Architecture & Repository Layout')
    pdf.paragraph("Below is the complete monorepo layout of the CropWise platform:")

    repo_tree = """BeejRakshak/ (Root Monorepo)
|-- package.json                   # Root scripts & concurrently runner
|-- run-servers.bat                # Windows startup batch utility
|-- client/                        # React Web Frontend (Vite, Tailwind CSS, Supabase SDK)
|   |-- src/
|   |   |-- components/            # FertilizerAdvisor.jsx, GovernmentSchemes.jsx
|   |   |-- pages/                 # Login.jsx, Registration.jsx, Dashboard.jsx
|   |   \-- translation/           # GoogleTranslateWidget & i18n support
|-- mobile/                        # React Native Mobile App (Expo, AsyncStorage)
|   |-- src/screens/               # LoginScreen.js, RegistrationScreen.js, DashboardScreen.js
|-- AIML/                          # Unified Python AI/ML Gateway (FastAPI)
|   |-- main.py                    # Master FastAPI Server (Mounts Mandi, Schemes, Fertilizer)
|   |-- mandi_intelligence/        # XGBoost models, dataset CSV, price_predictor, arbitrage_engine
|   |-- scrapbot/                  # Scheme matcher, claim_generator (FPDF)
|   \-- ml/                        # fertilizer_router.py, gujarat_districts.csv
|-- sar_processing/                # GEE Sentinel-1 Worker Pipeline
|   |-- worker.py, gee_client.py, feature_extractor.py, anomaly_detection.py, db.py, bootstrap_db.py
\-- docs/                          # registration-table.sql (Supabase Schema)"""
    pdf.code_block(repo_tree)

    # ---------------- 8. DATABASE & API REGISTRY ----------------
    pdf.add_page()
    pdf.section_header('8. Database Architecture & API Registry')
    pdf.subsection_header('A. Relational & Spatial Database Schemas')
    pdf.paragraph("CropWise utilizes a dual-database architecture: Supabase PostgreSQL for user auth/profiles and PostGIS for spatial field geometries.")

    db_tables = [
        ["Table Name", "Database Engine", "Key Columns", "Purpose"],
        ["public.farmers", "Supabase PostgreSQL", "id (UUID), name, mobile, created_at", "Base user auth account entry"],
        ["public.registrations", "Supabase PostgreSQL", "id, user_id, aadhaar, village, district, state, land_area, primary_crop", "Farmer onboarding profile & crop parameters"],
        ["public.fields", "PostGIS Spatial DB", "id, farmer_id, name, geometry (GEOGRAPHY POLYGON)", "Geo-coordinate boundaries of farm fields for GEE"],
        ["public.sar_features", "PostGIS Spatial DB", "id, field_id, date, vv_mean, vh_mean, vv_delta_7d, moisture_anomaly, flood_flag", "Historical satellite SAR metrics & anomaly logs"]
    ]
    pdf.styled_table(db_tables[0], db_tables[1:], [30, 35, 60, 55])

    pdf.subsection_header('B. Master API Route Registry')
    
    api_routes = [
        ["Method", "Endpoint", "Module", "Description"],
        ["GET", "/health", "Gateway", "Health check status endpoint"],
        ["GET", "/mandi/mandis", "Mandi", "List supported mandis, coordinates, and crop counts"],
        ["POST", "/mandi/response", "Mandi", "Calculates net-profit arbitrage and returns best mandi/date"],
        ["POST", "/schemes/api/v1/schemes/recommend", "Schemes", "Matches farmer profile to active government schemes"],
        ["POST", "/schemes/api/v1/claims/generate", "Claims", "Generates downloadable PMFBY claim PDF using FPDF"],
        ["GET", "/api/fertilizer/recommend", "Fertilizer", "Returns custom NPK weights & Urea/DAP/MOP product bags"],
        ["POST", "/api/yield/predict-batch", "Yield", "Calls Java executable subprocess to forecast crop yield"]
    ]
    pdf.styled_table(api_routes[0], api_routes[1:], [15, 55, 25, 85])

    # ---------------- 9. FUTURE PLANNED APPROACH & ROADMAP ----------------
    pdf.add_page()
    pdf.section_header('9. Future Planned Approach & Architectural Roadmap')
    pdf.paragraph(
        "To expand CropWise from a production prototype into a market-leading commercial platform, "
        "the following five strategic enhancement modules are planned:"
    )

    pdf.diagram_box("Future Enhancement Roadmap Overview", [
        "Module 1: Mobile Computer Vision Leaf Disease Diagnostics (MobileNetV3)",
        "Module 2: CropVerify & LogiPool (F2B Certified Crop Assaying & Shared Logistics)",
        "Module 3: Offline-First PWA Synchronization (IndexedDB / SQLite Sync)",
        "Module 4: RAG-Enhanced Kisan Mitra Chatbot (ChromaDB + Gemini Embeddings)",
        "Module 5: SAR Time-Series Crop Phenology & Automated Growth Stage Tracking"
    ])

    pdf.bullet_point("Module 1: Computer Vision Leaf Disease Diagnosis", "Integrate a lightweight CNN (MobileNetV3 / ResNet-18) trained on the PlantVillage dataset. Farmers upload a leaf photo, and the AI instantly classifies diseases (e.g. Tomato Blight, Wheat Rust) and suggests organic/chemical remedies.")
    pdf.bullet_point("Module 2: CropVerify & LogiPool (F2B Marketplace)", "A mobile browser tool where farmers place a handful of grain on paper to scan. Client-side TensorFlow.js counts broken/damaged kernels and generates a digital AGMARK Quality Certificate. Surrounding farmers selling to the same buyer can pool a shared transport truck, cutting logistics costs by 70%.")
    pdf.bullet_point("Module 3: Offline-First PWA Synchronization", "Implement IndexedDB local storage on the client. Farmers can log field tasks, check cached calendars, and record inputs offline. Once internet reconnects, data background-syncs to Supabase.")
    pdf.bullet_point("Module 4: RAG-Enhanced Kisan Mitra AI", "Convert government policy PDFs and crop guides into vector embeddings using ChromaDB. When a farmer asks a complex question, the chatbot performs a similarity search to supply factual context to Gemini/OpenAI.")
    pdf.bullet_point("Module 5: SAR Crop Phenology Tracking", "Train a 1D-CNN or LSTM model on historical Sentinel-1 VV/VH backscatter curves to automatically identify the crop growth stage (Sowing, Vegetative, Flowering, Harvested) without manual user entry.")

    # ---------------- 10. TOOLS, TECH & LIBRARIES ----------------
    pdf.add_page()
    pdf.section_header('10. Tools, Technologies, and Libraries Used')
    
    lib_headers = ["Category", "Technology / Library", "Role / Usage"]
    lib_data = [
        ["Languages", "Python 3.10+, JavaScript ES6+, SQL", "Core backend, machine learning, frontend, and database queries"],
        ["Web Frontend", "React 18, Vite 5, Tailwind CSS 3, ChartJS", "Web dashboard rendering, styling, and charts"],
        ["Mobile App", "Expo ~50, React Native 0.73", "Cross-platform iOS and Android mobile app build"],
        ["Backend Server", "FastAPI, Uvicorn, Pydantic, HTTPX", "High-performance asynchronous API gateway"],
        ["Machine Learning", "XGBoost, Scikit-Learn, Pandas, NumPy", "Time-series regression and feature engineering"],
        ["Satellite Engine", "Google Earth Engine (GEE API), Shapely", "Sentinel-1 SAR radar backscatter processing"],
        ["Databases", "Supabase (PostgreSQL), PostGIS Extension", "Managed database, Auth RLS, and GIS spatial coordinates"],
        ["PDF Generation", "FPDF Library", "Automated PMFBY insurance claim form PDF engine"]
    ]
    pdf.styled_table(lib_headers, lib_data, [30, 55, 95])

    # ---------------- 11. APPLICATIONS ----------------
    pdf.section_header('11. Applications & Real-World Use Cases')
    pdf.bullet_point("Smallholder Farmers", "Optimizing sale dates, maximizing net profits, avoiding middleman exploitation, receiving zero-cost flood alerts, and downloading claim PDFs.")
    pdf.bullet_point("Agricultural Extension Officers", "Monitoring regional drought/flood anomalies across thousands of hectares via satellite without field visits.")
    pdf.bullet_point("Farmer Producer Organizations (FPOs)", "Aggregating produce across member farms and negotiating bulk sales with Mandis offering highest net profits.")
    pdf.bullet_point("Agri-Insurtech Auditors", "Verifying flood and drought damage claims remotely using historical Sentinel-1 satellite radar logs.")

    # ---------------- 12. CONCLUSION & REFERENCES ----------------
    pdf.section_header('12. Conclusion & References')
    pdf.paragraph(
        "CropWise (BeejRakshak) demonstrates how the combination of machine learning, space-borne radar remote sensing, "
        "and modern web microservices can transform traditional agricultural workflows. By bridging market price arbitrage "
        "with zero-cost satellite monitoring and automated policy claims, the platform provides a scalable blueprint to elevate "
        "smallholder farmer incomes and climate resilience."
    )
    pdf.subsection_header('References')
    pdf.bullet_point("ESA Sentinel-1 Data", "European Space Agency (ESA) Copernicus Sentinel-1 Synthetic Aperture Radar Collection (COPERNICUS/S1_GRD).")
    pdf.bullet_point("AGMARKNET Dataset", "Directorate of Marketing & Inspection (DMI), Ministry of Agriculture & Farmers Welfare, Govt. of India.")
    pdf.bullet_point("FastAPI Framework", "Tiangolo et al., FastAPI High-Performance Framework (https://fastapi.tiangolo.com/).")
    pdf.bullet_point("Supabase Architecture", "Supabase Open Source Firebase Alternative (https://supabase.com/docs).")

    # Output PDF
    pdf.output(str(output_path))
    print(f"Successfully generated elaborated SRS PDF at: {output_path}")

if __name__ == "__main__":
    home_dir = Path(os.path.expanduser('~'))
    desktop_dir = home_dir / 'Desktop'
    onedrive_desktop = home_dir / 'OneDrive' / 'Desktop'
    downloads_dir = home_dir / 'Downloads'
    d_root = Path(r"D:\\")
    
    paths = [
        desktop_dir / "CropWise_SRS_Documentation.pdf",
        onedrive_desktop / "CropWise_SRS_Documentation.pdf",
        downloads_dir / "CropWise_SRS_Documentation.pdf",
        d_root / "CropWise_SRS_Documentation.pdf"
    ]
    
    for target in paths:
        try:
            generate_srs_pdf(target)
        except Exception as e:
            print(f"Could not save to {target}: {e}")
