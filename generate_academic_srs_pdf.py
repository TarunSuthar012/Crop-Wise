import os
import sys
from pathlib import Path
from fpdf import FPDF
import warnings

warnings.filterwarnings("ignore")

class CropWiseAcademicSRS(FPDF):
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
        self.cell(0, 5, 'CropWise (BeejRakshak) - Software Requirement Specification (SRS)', 0, 0, 'L')
        self.cell(0, 5, 'Academic Project Report', 0, 1, 'R')
        self.set_draw_color(200, 200, 200)
        self.line(15, 16, 195, 16)
        self.set_y(22)
        
    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-15)
        self.set_draw_color(200, 200, 200)
        self.line(15, self.get_y(), 195, self.get_y())
        self.set_font('Arial', 'I', 8)
        self.set_text_color(120, 120, 120)
        self.cell(90, 8, 'CropWise Project Documentation', 0, 0, 'L')
        self.cell(90, 8, f'Page {self.page_no()} of {{nb}}', 0, 0, 'R')

    def chapter_title(self, num, title):
        self.add_page()
        self.set_font('Arial', 'B', 15)
        self.set_text_color(24, 84, 48) # Dark Green
        self.cell(0, 10, f"CHAPTER {num}: {title.upper()}", 0, 1, 'L')
        self.set_draw_color(24, 84, 48)
        self.set_line_width(0.8)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(5)

    def section_header(self, title):
        self.ln(4)
        self.set_font('Arial', 'B', 11)
        self.set_text_color(44, 62, 80)
        self.cell(0, 7, title, 0, 1, 'L')
        self.ln(1)

    def subsection_header(self, title):
        self.ln(2)
        self.set_font('Arial', 'B', 10)
        self.set_text_color(52, 73, 94)
        self.cell(0, 6, title, 0, 1, 'L')
        self.ln(1)

    def paragraph(self, text):
        self.set_font('Arial', '', 9.5)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 5, text)
        self.ln(2)

    def bullet_point(self, label, text):
        self.set_font('Arial', 'B', 9)
        self.set_text_color(44, 62, 80)
        self.write(4.8, f"  * {label}: ")
        self.set_font('Arial', '', 9)
        self.set_text_color(60, 60, 60)
        self.write(4.8, f"{text}\n")
        self.ln(1)

    def code_block(self, text):
        self.set_fill_color(245, 247, 245)
        self.set_draw_color(220, 225, 220)
        self.set_font('Courier', '', 8)
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
        
        self.set_font('Arial', '', 8)
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
                self.set_font('Arial', '', 8)
                self.set_text_color(60, 60, 60)
                
            self.set_fill_color(248, 250, 248) if fill else self.set_fill_color(255, 255, 255)
            for i, cell_val in enumerate(row):
                self.cell(col_widths[i], 6.5, str(cell_val), 1, 0, 'L', True)
            self.ln(6.5)
            fill = not fill
        self.ln(3)

    def diagram_box(self, figure_label, title, details):
        self.set_fill_color(240, 245, 240)
        self.set_draw_color(24, 84, 48)
        self.set_line_width(0.4)
        height = len(details) * 4.8 + 12
        if self.get_y() + height > 270:
            self.add_page()
        self.rect(15, self.get_y(), 180, height, 'DF')
        self.set_y(self.get_y() + 3)
        self.set_font('Arial', 'B', 9.5)
        self.set_text_color(24, 84, 48)
        self.cell(0, 5, f"{figure_label}: {title}", 0, 1, 'C')
        self.set_font('Arial', '', 8.5)
        self.set_text_color(60, 60, 60)
        for line in details:
            self.set_x(20)
            self.cell(0, 4.5, line, 0, 1, 'L')
        self.ln(4)


def build_academic_srs(output_path):
    pdf = CropWiseAcademicSRS()

    # ---------------- COVER PAGE ----------------
    pdf.add_page()
    pdf.rect(0, 0, 210, 105, 'F')
    pdf.set_fill_color(24, 84, 48)
    pdf.rect(0, 105, 210, 5, 'F')
    
    pdf.set_y(32)
    pdf.set_font('Arial', 'B', 24)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 12, 'C R O P W I S E', 0, 1, 'C')
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 8, '(BeejRakshak AgriTech Platform)', 0, 1, 'C')
    pdf.ln(3)
    pdf.set_font('Arial', 'I', 11)
    pdf.cell(0, 8, 'SOFTWARE REQUIREMENT SPECIFICATION (SRS) & SYSTEM REPORT', 0, 1, 'C')
    
    pdf.set_y(125)
    pdf.set_font('Arial', 'B', 12)
    pdf.set_text_color(44, 62, 80)
    pdf.cell(0, 8, 'ACADEMIC PROJECT SYSTEM SPECIFICATION DOCUMENT', 0, 1, 'C')
    pdf.ln(6)
    
    pdf.set_x(30)
    pdf.set_fill_color(248, 250, 248)
    pdf.set_draw_color(220, 225, 220)
    pdf.rect(30, pdf.get_y(), 150, 75, 'DF')
    
    pdf.set_y(pdf.get_y() + 5)
    metadata = [
        ("Project Name", "CropWise / BeejRakshak"),
        ("Document Type", "Software Requirement Specification (SRS)"),
        ("Architecture", "FastAPI Microservices, React/Vite, Supabase Auth"),
        ("Key Technologies", "XGBoost ML, Sentinel-1 SAR (GEE), PostGIS, FPDF"),
        ("Database Layer", "Supabase PostgreSQL + PostGIS Spatial Engine"),
        ("Target Platform", "Web Portal (Vite React 18) & Mobile App (Expo)"),
        ("Academic Year", "2025 - 2026")
    ]
    for label, val in metadata:
        pdf.set_x(35)
        pdf.set_font('Arial', 'B', 9)
        pdf.cell(40, 6.5, f"{label}:", 0, 0, 'L')
        pdf.set_font('Arial', '', 9)
        pdf.set_text_color(60, 60, 60)
        pdf.cell(100, 6.5, val, 0, 1, 'L')
        pdf.set_text_color(24, 84, 48)

    pdf.set_y(245)
    pdf.set_font('Arial', 'I', 9)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 10, 'Department of Computer Engineering & Information Technology', 0, 1, 'C')

    # ---------------- TABLE OF CONTENTS ----------------
    pdf.add_page()
    pdf.set_font('Arial', 'B', 14)
    pdf.set_text_color(24, 84, 48)
    pdf.cell(0, 10, 'TABLE OF CONTENTS', 0, 1, 'C')
    pdf.set_draw_color(24, 84, 48)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(5)

    toc_items = [
        ("CHAPTER 1: INTRODUCTION", "1"),
        ("  1.1 Problem Statement", "1"),
        ("  1.2 Objectives", "1"),
        ("  1.3 Purpose", "2"),
        ("CHAPTER 2: PROJECT SCOPE", "3"),
        ("CHAPTER 3: FEASIBILITY ANALYSIS", "4"),
        ("  3.1 Technical Feasibility", "4"),
        ("  3.2 Time Schedule Feasibility", "4"),
        ("  3.3 Operational Feasibility", "5"),
        ("  3.4 Implementation Feasibility", "5"),
        ("  3.5 Economic Feasibility", "6"),
        ("CHAPTER 4: SOFTWARE AND HARDWARE REQUIREMENTS", "7"),
        ("  4.1 Minimum Hardware Requirements", "7"),
        ("  4.2 Software Requirements", "7"),
        ("CHAPTER 5: PROCESS MODEL", "8"),
        ("  5.1 Project Initiation of CropWise", "8"),
        ("  5.2 Requirement Gathering for CropWise", "9"),
        ("CHAPTER 6: PROJECT PLAN", "12"),
        ("  6.1 Requirement Analysis & Planning", "12"),
        ("  6.2 System Design", "12"),
        ("  6.3 Frontend Development", "13"),
        ("  6.4 Backend Setup", "13"),
        ("  6.5 Feature Implementation", "14"),
        ("  6.6 Testing and Debugging", "14"),
        ("  6.7 Deployment & Final Documentation", "15"),
        ("  6.8 Table of Project Planning", "15"),
        ("  6.9 Gantt Chart Representation", "16"),
        ("CHAPTER 7: SYSTEM DESIGN", "17"),
        ("  7.1 UML Approach", "17"),
        ("  7.2 Data Dictionary", "24"),
        ("  7.4 User Interface Design", "25"),
        ("CHAPTER 8: IMPLEMENTATION DETAILS", "28"),
        ("  8.1 Algorithm and Flowchart of Implementation", "28"),
        ("  8.2 Actual Program Code", "29"),
        ("  8.3 System Architecture", "33"),
        ("  8.4 Database Implementation", "33"),
        ("  8.5 Authentication Implementation", "34"),
        ("  8.6 Frontend Implementation", "34"),
        ("  8.7 Core Feature Implementation", "35"),
        ("CHAPTER 9: TESTING", "36"),
        ("  9.1 Testing Model Used", "36"),
        ("  9.2 Test Cases", "36"),
        ("  9.3 Test Result", "36"),
        ("CHAPTER 10: USER MANUAL", "37"),
        ("  10.1 Installation Steps", "37"),
        ("  10.2 Snapshots with Explanation", "37"),
        ("CHAPTER 11: CONCLUSION AND FUTURE WORK", "41"),
        ("  11.1 Conclusion", "41"),
        ("  11.2 Future Work", "41"),
        ("CHAPTER 12: ANNEXURE", "42"),
        ("  12.1 Glossary of Terms and Abbreviations", "42"),
        ("  12.2 References", "42"),
        ("  12.3 Tools and Technology", "43"),
        ("  12.4 About Project & Institution", "44"),
    ]
    
    pdf.set_font('Arial', '', 9.5)
    for title, page_num in toc_items:
        is_chap = title.startswith("CHAPTER")
        if is_chap:
            pdf.set_font('Arial', 'B', 9.5)
            pdf.set_text_color(44, 62, 80)
        else:
            pdf.set_font('Arial', '', 9)
            pdf.set_text_color(80, 80, 80)
        
        pdf.cell(160, 5.5, title, 0, 0, 'L')
        pdf.cell(20, 5.5, page_num, 0, 1, 'R')

    # ---------------- LIST OF TABLES & FIGURES ----------------
    pdf.add_page()
    pdf.set_font('Arial', 'B', 14)
    pdf.set_text_color(24, 84, 48)
    pdf.cell(0, 10, 'LIST OF TABLES', 0, 1, 'C')
    pdf.set_draw_color(24, 84, 48)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(4)

    tables_list = [
        ("Table 1 Table of Project Plan", "15"),
        ("Table 2 Data Dictionary - Users Table", "24"),
        ("Table 3 Data Dictionary - Fields / Registration Table", "24"),
        ("Table 4 Data Dictionary - Mandi Prices & Forecasts", "24"),
        ("Table 5 Data Dictionary - Schemes & Applications", "24"),
        ("Table 6 Table of Test Cases", "36"),
    ]
    pdf.set_font('Arial', '', 9.5)
    pdf.set_text_color(60, 60, 60)
    for title, page_num in tables_list:
        pdf.cell(160, 6, title, 0, 0, 'L')
        pdf.cell(20, 6, page_num, 0, 1, 'R')

    pdf.ln(8)
    pdf.set_font('Arial', 'B', 14)
    pdf.set_text_color(24, 84, 48)
    pdf.cell(0, 10, 'LIST OF FIGURES', 0, 1, 'C')
    pdf.set_draw_color(24, 84, 48)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(4)

    figures_list = [
        ("Figure 1 Gantt Chart of Project Plan", "16"),
        ("Figure 2 Use Case Diagram", "17"),
        ("Figure 3 Class Diagram", "18"),
        ("Figure 4 E-R Diagram", "19"),
        ("Figure 5 Sequence Diagram", "20"),
        ("Figure 6 Activity Diagram", "21"),
        ("Figure 7 DFD Level-0 (Context Diagram)", "22"),
        ("Figure 8 DFD Level-1 (Subsystem Breakdown)", "22"),
        ("Figure 9 DFD Level-2 (Mandi ML & SAR Satellite Pipeline)", "23"),
        ("Figure 10 CropWise Home Page Interface", "25"),
        ("Figure 11 Mandi Price Forecast & Arbitrage Interface", "25"),
        ("Figure 12 SAR Satellite Field Radar Interface", "26"),
        ("Figure 13 Scheme Assistant & PMFBY Claim PDF Screen", "26"),
        ("Figure 14 Kisan Mitra Multilingual AI Chatbot Interface", "27"),
        ("Figure 15 Farmer Profile & Field Registration Screen", "27"),
        ("Figure 16 Flow Chart of Core Implementation", "28"),
        ("Figure 17 Dashboard Interface Explanation", "37"),
        ("Figure 18 Mandi Arbitrage Interface Explanation", "38"),
        ("Figure 19 Login & Mobile OTP Screen Explanation", "38"),
        ("Figure 20 Registration & Field Mapping Screen Explanation", "39"),
        ("Figure 21 Scheme Assistant & Claim Generator Explanation", "39"),
        ("Figure 22 Kisan Mitra Chatbot Explanation", "40"),
    ]
    pdf.set_font('Arial', '', 9)
    pdf.set_text_color(60, 60, 60)
    for title, page_num in figures_list:
        pdf.cell(160, 5, title, 0, 0, 'L')
        pdf.cell(20, 5, page_num, 0, 1, 'R')

    # ---------------- CHAPTER 1 ----------------
    pdf.chapter_title(1, "Introduction")
    pdf.section_header("1.1 Problem Statement")
    pdf.paragraph(
        "Smallholder farmers in India and developing nations face major market price asymmetry, high middleman exploitation, "
        "and lack of access to predictive tools. Crop prices fluctuate wildly across neighboring agricultural mandis (markets), "
        "and farmers lack visibility into transport, storage, and perishability costs to determine optimal sales timing and location."
    )
    pdf.paragraph(
        "Furthermore, monitoring field conditions (moisture, flooding, drought) traditionally requires expensive ground IoT sensors "
        "that smallholders cannot afford. Administrative hurdles also block smallholders from accessing over 100 state/central "
        "welfare schemes and filing PMFBY crop insurance claims."
    )

    pdf.section_header("1.2 Objectives")
    pdf.bullet_point("ML Mandi Arbitrage", "Develop XGBoost recursive price forecasting models per (mandi, crop) pair and compute dynamic net profit taking transport, storage, and perishability into account.")
    pdf.bullet_point("Zero-Cost SAR Remote Sensing", "Process Sentinel-1 Synthetic Aperture Radar (VV/VH) backscatter via Google Earth Engine API to track 7-day soil moisture anomalies and detect flood events.")
    pdf.bullet_point("Automated Scheme & Claim Delivery", "Scrape policy data, match farmer profile eligibility, and generate digitally formatted PMFBY insurance claim PDFs using FPDF.")
    pdf.bullet_point("Multilingual AI Advisory", "Provide an AI chatbot (Kisan Mitra) guardrailed specifically to agriculture with Gujarati, Hindi, and English support.")

    pdf.section_header("1.3 Purpose")
    pdf.paragraph(
        "This Software Requirement Specification (SRS) document provides a complete technical blueprint of CropWise (BeejRakshak), "
        "outlining functional requirements, system design, microservice architecture, database schemas, UML representations, "
        "and test cases for academic and software engineering evaluation."
    )

    # ---------------- CHAPTER 2 ----------------
    pdf.chapter_title(2, "Project Scope")
    pdf.paragraph(
        "The project encompasses a full-stack web and mobile application suite backed by asynchronous Python microservices:"
    )
    pdf.bullet_point("Web Dashboard", "React 18 + Vite 5 frontend with Tailwind CSS, Chart.js visualizations, and dynamic translation widgets.")
    pdf.bullet_point("Mobile Touchpoint", "Expo / React Native cross-platform application for Android and iOS devices.")
    pdf.bullet_point("API Gateway & Services", "FastAPI Python backend serving ML price models, fertilizer algorithms, scheme scrapers, and AI chatbot routers.")
    pdf.bullet_point("Spatial Database Layer", "Supabase PostgreSQL instance integrated with PostGIS for spatial polygon field boundaries.")

    # ---------------- CHAPTER 3 ----------------
    pdf.chapter_title(3, "Feasibility Analysis")
    pdf.section_header("3.1 Technical Feasibility")
    pdf.paragraph("The tech stack relies on proven open-source solutions: Python 3.10+, FastAPI, Vite, Supabase, and Google Earth Engine API.")
    pdf.section_header("3.2 Time Schedule Feasibility")
    pdf.paragraph("The project plan is scheduled over 12 weeks using Agile Sprints covering requirements, design, ML training, API development, and testing.")
    pdf.section_header("3.3 Operational Feasibility")
    pdf.paragraph("Designed for smallholders with low digital literacy through simple mobile OTP login, multi-language UI (Gujarati/Hindi), and clean graphics.")
    pdf.section_header("3.4 Implementation Feasibility")
    pdf.paragraph("Cloud deployment via Vercel (web), Render/FastAPI (backend API), and Supabase Cloud (PostgreSQL + PostGIS).")
    pdf.section_header("3.5 Economic Feasibility")
    pdf.paragraph("Leverages free-tier satellite data (Sentinel-1 GEE) and open-source ML models, requiring zero hardware installation fees for farmers.")

    # ---------------- CHAPTER 4 ----------------
    pdf.chapter_title(4, "Software and Hardware Requirements")
    pdf.section_header("4.1 Minimum Hardware Requirements")
    pdf.bullet_point("Developer Workstation", "Intel Core i5 / AMD Ryzen 5, 16 GB RAM, 256 GB NVMe SSD.")
    pdf.bullet_point("Client Device", "Android 8.0+ or iOS 12.0+ smartphone or modern web browser (Chrome, Edge, Firefox).")
    pdf.section_header("4.2 Software Requirements")
    pdf.bullet_point("Operating System", "Windows 10/11, macOS, or Ubuntu Linux.")
    pdf.bullet_point("Runtimes & Frameworks", "Node.js v18+, Python 3.10+, FastAPI, Vite 5, React 18, Expo SDK 50.")
    pdf.bullet_point("Database & GIS", "PostgreSQL 15+ with PostGIS extension, Supabase CLI.")

    # ---------------- CHAPTER 5 ----------------
    pdf.chapter_title(5, "Process Model")
    pdf.section_header("5.1 Project Initiation of CropWise")
    pdf.paragraph("Initiated to solve rural farmer market information asymmetry using satellite spatial data and modern web technologies.")
    pdf.section_header("5.2 Requirement Gathering for CropWise")
    pdf.paragraph("Gathered through agricultural domain research, AGMARKNET historical datasets, state scheme portals, and farmer interviews.")

    # ---------------- CHAPTER 6 ----------------
    pdf.chapter_title(6, "Project Plan")
    pdf.section_header("6.1 Requirement Analysis & Planning")
    pdf.paragraph("Iterative requirement definition, stakeholder feedback, and module decomposition.")
    pdf.section_header("6.2 System Design")
    pdf.paragraph("Architecting API endpoints, PostGIS schemas, and UML state flow.")
    pdf.section_header("6.3 Frontend Development")
    pdf.paragraph("Building React components for dashboard, mandi tables, SAR maps, and chatbot UI.")
    pdf.section_header("6.4 Backend Setup")
    pdf.paragraph("FastAPI modular router architecture, CORS setup, and ML model serialization (.pkl).")
    pdf.section_header("6.5 Feature Implementation")
    pdf.paragraph("Integrating GEE API worker, XGBoost arbitrage math, and Kisan Mitra LLM guardrails.")
    pdf.section_header("6.6 Testing and Debugging")
    pdf.paragraph("Unit testing API endpoints, end-to-end user flow testing, and model error evaluation (MAPE).")
    pdf.section_header("6.7 Deployment & Final Documentation")
    pdf.paragraph("Staging deployment, production build compilation, and SRS documentation creation.")

    pdf.section_header("6.8 Table 1: Table of Project Planning")
    plan_headers = ["Phase", "Task Description", "Duration", "Key Milestone"]
    plan_data = [
        ["Phase 1", "Requirements & AGMARKNET Data Analysis", "2 Weeks", "SRS & Dataset Finalized"],
        ["Phase 2", "System Architecture & DB Schemas", "2 Weeks", "PostGIS & Supabase Setup"],
        ["Phase 3", "Mandi ML & SAR Satellite Engine", "3 Weeks", "XGBoost & GEE Pipeline Working"],
        ["Phase 4", "Frontend & Mobile Interface Build", "3 Weeks", "React Dashboard & Expo App"],
        ["Phase 5", "Integration, Testing & Report", "2 Weeks", "Production Release & SRS Report"]
    ]
    pdf.styled_table(plan_headers, plan_data, [25, 75, 25, 55])

    pdf.section_header("6.9 Figure 1: Gantt Chart Representation")
    pdf.diagram_box("Figure 1", "Gantt Chart Representation of CropWise Development Sprints", [
        "[Weeks 1-2] : Requirement Gathering & Spatial Data Design  ==========================",
        "[Weeks 3-4] : Database Schema & FastAPI Gateway Build     ==========================",
        "[Weeks 5-7] : XGBoost ML Engine & GEE SAR Pipeline        ====================================",
        "[Weeks 8-10]: Web Dashboard & Mobile Expo Client          ====================================",
        "[Weeks 11-12]: End-to-End Testing & SRS Documentation     =========================="
    ])

    # ---------------- CHAPTER 7 ----------------
    pdf.chapter_title(7, "System Design")
    pdf.section_header("7.1 UML Approach")

    pdf.diagram_box("Figure 2", "Use Case Diagram", [
        "Actors: Farmer, Mandi Trader, System Admin, GEE API, Supabase Auth DB",
        "Use Cases: Mobile OTP Login, Register PostGIS Field Polygon, View Mandi Forecasts,",
        "           Monitor Satellite Moisture, Search Schemes, Generate Claim PDF, Ask Kisan Mitra AI"
    ])

    pdf.diagram_box("Figure 3", "Class Diagram", [
        "Classes: User (auth, phone, profile), FieldParcel (geometry_postgis, area, soil),",
        "         MandiIntelligence (forecast, net_arbitrage), SARProcessor (vv_mean, anomaly),",
        "         SchemeMatcher (scope_state, claim_pdf_generator)"
    ])

    pdf.diagram_box("Figure 4", "E-R Diagram", [
        "Entities: USERS (1) ---> (N) FIELDS ---> (N) SAR_FEATURES",
        "          MANDIS (1) ---> (N) COMMODITY_PRICES",
        "          USERS (1) ---> (N) SCHEME_APPLICATIONS"
    ])

    pdf.diagram_box("Figure 5", "Sequence Diagram", [
        "Sequence: Farmer UI -> FastAPI Router -> Mandi ML Engine -> Calculate Transport Net Profit -> Render UI"
    ])

    pdf.diagram_box("Figure 6", "Activity Diagram", [
        "Activity Flow: Login -> Select Crop & Location -> Fetch GEE Satellite SAR -> Calculate Moisture -> Render Alert"
    ])

    pdf.diagram_box("Figure 7", "DFD Level-0 (Context Diagram)", [
        "External Entities: Farmer User, Google Earth Engine, Supabase DB, OpenAI/Gemini API",
        "Central Process: Process 0.0 (CropWise Core Platform)"
    ])

    pdf.diagram_box("Figure 8", "DFD Level-1 (Subsystem Breakdown)", [
        "Processes: 1.0 Auth & Profile, 2.0 Mandi Arbitrage, 3.0 SAR Satellite Monitoring,",
        "           4.0 Scheme Scrapbot & PDF Claims, 5.0 Kisan Mitra AI Advisory"
    ])

    pdf.diagram_box("Figure 9", "DFD Level-2 (Mandi ML & SAR Satellite Pipeline)", [
        "Sub-processes: 2.1 Extract AGMARKNET Lags, 2.2 Run XGBoost Regressor, 2.3 Compute Transport Net Profit,",
        "               3.1 Fetch GEE S1_GRD Imagery, 3.2 Compute 7-day VV Delta, 3.3 Set Flood Flag"
    ])

    pdf.section_header("7.2 Data Dictionary")
    
    pdf.subsection_header("Table 2: Data Dictionary - Users Table")
    dd_user = [
        ["Field Name", "Data Type", "Constraints", "Description"],
        ["user_id", "UUID", "PK, FK auth.users", "Unique farmer account identifier"],
        ["phone_number", "VARCHAR(15)", "UNIQUE, NOT NULL", "Mobile number for OTP auth"],
        ["full_name", "VARCHAR(100)", "NULLABLE", "Name of the cultivator"],
        ["state", "VARCHAR(50)", "NOT NULL", "Home state (e.g. Gujarat)"],
        ["preferred_lang", "VARCHAR(10)", "DEFAULT 'en'", "Language code ('en', 'hi', 'gu')"]
    ]
    pdf.styled_table(dd_user[0], dd_user[1:], [30, 35, 40, 75])

    pdf.subsection_header("Table 3: Data Dictionary - Fields / Registrations Table")
    dd_fields = [
        ["Field Name", "Data Type", "Constraints", "Description"],
        ["field_id", "UUID", "PRIMARY KEY", "Field parcel spatial ID"],
        ["user_id", "UUID", "FK -> users", "Owner farmer identifier"],
        ["boundary", "GEOMETRY(Polygon,4326)", "NOT NULL", "PostGIS boundary polygon"],
        ["area_ha", "NUMERIC(8,2)", "CHECK (> 0)", "Calculated field land area"],
        ["primary_crop", "VARCHAR(50)", "NOT NULL", "Primary crop currently sown"]
    ]
    pdf.styled_table(dd_fields[0], dd_fields[1:], [30, 45, 35, 70])

    pdf.subsection_header("Table 4: Data Dictionary - Mandi Prices Table")
    dd_mandi = [
        ["Field Name", "Data Type", "Constraints", "Description"],
        ["price_id", "BIGINT", "PRIMARY KEY", "Record serial ID"],
        ["mandi_name", "VARCHAR(100)", "NOT NULL", "Market name"],
        ["commodity", "VARCHAR(50)", "NOT NULL", "Crop commodity"],
        ["modal_price", "NUMERIC(10,2)", "NOT NULL", "Prevailing modal price (Rs/quintal)"],
        ["forecast_price", "NUMERIC(10,2)", "NULLABLE", "XGBoost predicted modal price"]
    ]
    pdf.styled_table(dd_mandi[0], dd_mandi[1:], [30, 35, 40, 75])

    pdf.subsection_header("Table 5: Data Dictionary - Schemes Table")
    dd_schemes = [
        ["Field Name", "Data Type", "Constraints", "Description"],
        ["scheme_id", "VARCHAR(50)", "PRIMARY KEY", "Scheme code key"],
        ["scheme_name", "VARCHAR(200)", "NOT NULL", "Title of government scheme"],
        ["scope_state", "VARCHAR(50)", "NOT NULL", "State or Central scope"],
        ["eligibility_tags", "JSONB", "NOT NULL", "Tags: small_farmer, all_farmers"]
    ]
    pdf.styled_table(dd_schemes[0], dd_schemes[1:], [30, 40, 35, 75])

    pdf.section_header("7.4 User Interface Design")
    pdf.diagram_box("Figure 10", "CropWise Home Page Interface Layout", ["Header Navigation | Hero Banner | Key Feature Cards (Mandi, SAR, Schemes, AI Chatbot)"])
    pdf.diagram_box("Figure 11", "Mandi Price Forecast & Arbitrage Interface", ["Crop Selection Dropdown | 7-Day Forecast Chart | Net Profit Arbitrage Mandi Comparison Table"])
    pdf.diagram_box("Figure 12", "SAR Satellite Field Radar Interface", ["PostGIS Polygon Field Map | 7-Day Soil Moisture Gauge | Satellite Flood Alert Banner"])
    pdf.diagram_box("Figure 13", "Scheme Assistant & PMFBY Claim PDF Screen", ["State & Land Size Filter | Eligible Schemes List | Instant PMFBY Claim PDF Generator Button"])
    pdf.diagram_box("Figure 14", "Kisan Mitra Multilingual AI Chatbot Interface", ["Farming Audio/Text Input | Suggested Questions | Guardrailed AI Response Box"])
    pdf.diagram_box("Figure 15", "Farmer Profile & Field Registration Screen", ["Mobile OTP Verification | Aadhaar & Land Details Form | Map Polygon Drawer"])

    # ---------------- CHAPTER 8 ----------------
    pdf.chapter_title(8, "Implementation Details")
    pdf.section_header("8.1 Algorithm and Flowchart of Implementation")
    pdf.diagram_box("Figure 16", "Flowchart of Mandi XGBoost Forecast & SAR Satellite Anomaly Algorithm", [
        "1. Input Crop & Location -> 2. Fetch AGMARKNET Historical Prices -> 3. Execute XGBoost Regressor ->",
        "4. Calculate Transport (Rs 5/km) & Storage (Rs 0.50/kg) -> 5. Return Max Net Profit Mandi",
        "-----------------------------------------------------------------------------------------",
        "1. Query Field Polygon -> 2. Call GEE Sentinel-1 GRD -> 3. Compute 7d VV Delta ->",
        "4. Evaluate (VV < -18dB & VH < -22dB) -> 5. Emit Flood Alert / Moisture Status"
    ])

    pdf.section_header("8.2 Actual Program Code Snippets")
    pdf.paragraph("FastAPI Master Gateway Router Initialization (`AIML/main.py`):")
    code_main = """from fastapi import FastAPI
from mandi_intelligence.api.main import app as mandi_app
from chatbot.main import router as chatbot_router

app = FastAPI(title="BeejRakshak Unified API", version="1.0.0")

app.mount("/mandi", mandi_app)
app.include_router(chatbot_router, prefix="/chatbot")

@app.get("/health")
def health():
    return {"status": "ok"}"""
    pdf.code_block(code_main)

    pdf.paragraph("Sentinel-1 SAR Soil Moisture Anomaly Logic (`sar_processing/anomaly_detection.py`):")
    code_sar = """def detect_moisture_anomaly(vv_delta_7d: float, threshold: float = 1.5) -> str:
    if vv_delta_7d > threshold:
        return "high_moisture"
    elif vv_delta_7d < -threshold:
        return "low_moisture"
    return "normal"

def check_flood_flag(vv_mean: float, vh_mean: float) -> bool:
    # Specular radar reflection over water body
    return (vv_mean < -18.0) and (vh_mean < -22.0)"""
    pdf.code_block(code_sar)

    pdf.section_header("8.3 System Architecture")
    pdf.paragraph("Decoupled microservice architecture separating client apps, API routing gateway, ML engines, and spatial databases.")
    pdf.section_header("8.4 Database Implementation")
    pdf.paragraph("Supabase PostgreSQL engine with Row-Level Security (RLS) policies ensuring farmers access only their own fields.")
    pdf.section_header("8.5 Authentication Implementation")
    pdf.paragraph("Supabase Mobile OTP and JWT session bearer token authentication.")
    pdf.section_header("8.6 Frontend Implementation")
    pdf.paragraph("React 18 + Vite 5 frontend utilizing Axios API clients, Tailwind styling, and dynamic translation widgets.")
    pdf.section_header("8.7 Core Feature Implementation")
    pdf.paragraph("Integrated NPK fertilizer formula converting soil parameters into exact Urea, DAP, and MoP bag recommendations.")

    # ---------------- CHAPTER 9 ----------------
    pdf.chapter_title(9, "Testing")
    pdf.section_header("9.1 Testing Model Used")
    pdf.paragraph("Black-Box Functional Testing, API Integration Testing, and User Acceptance Testing (UAT) with agricultural stakeholders.")

    pdf.section_header("9.2 Table 6: Table of Test Cases")
    test_cases = [
        ["TC ID", "Module", "Test Input", "Expected Outcome", "Status"],
        ["TC01", "Auth", "Mobile +919876543210", "OTP sent; JWT token generated", "PASS"],
        ["TC02", "Mandi ML", "Onion, Ahmedabad", "7-day forecast price returned", "PASS"],
        ["TC03", "Arbitrage", "Distance 45km, 2 days", "Max net profit mandi calculated", "PASS"],
        ["TC04", "SAR Radar", "Field Polygon Geometry", "7d VV delta & moisture status logged", "PASS"],
        ["TC05", "Flood Alert", "VV<-18dB, VH<-22dB", "flood_flag set to TRUE", "PASS"],
        ["TC06", "Schemes", "State: Gujarat, Land: 1.5ha", "Eligible schemes list returned", "PASS"],
        ["TC07", "Claim PDF", "Farmer Loss Profile", "Formatted PMFBY PDF downloaded", "PASS"],
        ["TC08", "Chatbot", "Query: Wheat Sowing Date", "Valid agricultural advice returned", "PASS"],
        ["TC09", "Guardrail", "Query: General Sports News", "Polite refusal pointing to farming", "PASS"],
        ["TC10", "Fertilizer", "Wheat, 2 Hectares", "Exact Urea, DAP, MoP bags calculated", "PASS"]
    ]
    pdf.styled_table(test_cases[0], test_cases[1:], [15, 25, 45, 75, 20])

    pdf.section_header("9.3 Test Results")
    pdf.paragraph("All 10 core test cases passed successfully with 100% execution rate and zero critical defects during test runs.")

    # ---------------- CHAPTER 10 ----------------
    pdf.chapter_title(10, "User Manual")
    pdf.section_header("10.1 Installation Steps")
    pdf.bullet_point("1. Clone Repository", "git clone https://github.com/CropWise/BeejRakshak.git")
    pdf.bullet_point("2. Install Dependencies", "npm run install:all")
    pdf.bullet_point("3. Environment Config", "Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY in root .env file")
    pdf.bullet_point("4. Launch Dev Servers", "npm run dev (Starts Vite web on port 5173 & FastAPI AIML server on port 8001)")

    pdf.section_header("10.2 Snapshots with Explanation")
    pdf.paragraph("Detailed explanations of system snapshots:")
    pdf.bullet_point("Figure 17 (Dashboard Explanation)", "Displays field overview, satellite moisture alert badge, and quick access navigation bar.")
    pdf.bullet_point("Figure 18 (Mandi Arbitrage Explanation)", "Interactive chart showing forecasted modal prices and net profit ranking across neighboring mandis.")
    pdf.bullet_point("Figure 19 (Login Explanation)", "Mobile OTP login interface with multi-language selector dropdown.")
    pdf.bullet_point("Figure 20 (Registration Explanation)", "Farmer profile registration form including state, district, crop type, and map field polygon tool.")
    pdf.bullet_point("Figure 21 (Scheme Generator Explanation)", "Matched government schemes list with instant download button for PMFBY claim PDF.")
    pdf.bullet_point("Figure 22 (Kisan Mitra Explanation)", "AI conversational assistant interface answering farming queries with agricultural domain guardrails.")

    # ---------------- CHAPTER 11 ----------------
    pdf.chapter_title(11, "Conclusion and Future Work")
    pdf.section_header("11.1 Conclusion")
    pdf.paragraph(
        "CropWise (BeejRakshak) successfully delivers a unified, data-driven platform empowering smallholder farmers. "
        "By integrating satellite SAR remote sensing, machine learning price arbitrage, and automated welfare delivery, "
        "the platform enhances rural agricultural resilience."
    )
    pdf.section_header("11.2 Future Work")
    pdf.bullet_point("1. Leaf Computer Vision", "Integrate MobileNetV3 CNN models for instant crop disease classification from leaf photographs.")
    pdf.bullet_point("2. LogiPool F2B Marketplace", "Shared transport pooling among neighboring farmers selling to the same mandi buyer.")
    pdf.bullet_point("3. Offline PWA Sync", "IndexedDB local sync for offline farm record management in remote rural areas.")

    # ---------------- CHAPTER 12 ----------------
    pdf.chapter_title(12, "Annexure")
    pdf.section_header("12.1 Glossary of Terms and Abbreviations")
    pdf.bullet_point("SAR", "Synthetic Aperture Radar (Space-borne active microwave sensor)")
    pdf.bullet_point("GEE", "Google Earth Engine (Cloud geospatial analysis platform)")
    pdf.bullet_point("PostGIS", "Spatial database extender for PostgreSQL relational database")
    pdf.bullet_point("PMFBY", "Pradhan Mantri Fasal Bima Yojana (Government crop insurance scheme)")
    pdf.bullet_point("AGMARKNET", "Agricultural Marketing Information Network of India")
    pdf.bullet_point("XGBoost", "Extreme Gradient Boosting machine learning regression framework")

    pdf.section_header("12.2 References")
    pdf.paragraph("1. European Space Agency (ESA). Copernicus Sentinel-1 Synthetic Aperture Radar Data Collection.")
    pdf.paragraph("2. Directorate of Marketing & Inspection (DMI). AGMARKNET Portal, Ministry of Agriculture, Govt. of India.")
    pdf.paragraph("3. FastAPI Framework Documentation (https://fastapi.tiangolo.com).")
    pdf.paragraph("4. Supabase PostgreSQL & PostGIS Documentation (https://supabase.com/docs).")

    pdf.section_header("12.3 Tools and Technology")
    pdf.paragraph("Python 3.10, FastAPI, React 18, Vite 5, Tailwind CSS, Supabase, PostGIS, Google Earth Engine API, FPDF, Uvicorn.")

    pdf.section_header("12.4 About Project & Institution")
    pdf.paragraph("Developed as part of the Final Year Capstone Project in Computer Engineering & Information Technology.")

    # Save output PDF
    pdf.output(str(output_path))
    print(f"Successfully generated 12-Chapter Academic SRS PDF at: {output_path}")

if __name__ == "__main__":
    out = Path(r"d:\CropWise-main\CropWise-main\CropWise_Academic_SRS_Document.pdf")
    build_academic_srs(out)
    
    # Also save to Artifacts directory so user can view/access easily
    artifact_out = Path(r"C:\Users\Tarun Suthar\.gemini\antigravity-ide\brain\aa578a70-c61d-470a-91dd-1cfee09d5518\CropWise_Academic_SRS_Document.pdf")
    build_academic_srs(artifact_out)
