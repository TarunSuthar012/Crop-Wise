import re
from fpdf import FPDF
from pathlib import Path

# Path setup
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"


def _fpdf_safe(s) -> str:
    """FPDF classic uses Latin-1; replace unsupported chars so PDF generation does not fail."""
    return str(s).encode("latin-1", "replace").decode("latin-1")


def _safe_filename_uid(uid: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]+", "_", str(uid))[:80] or "farmer"


class PMFBYClaimPDF(FPDF):
    def section_title(self, text):
        self.set_font("Arial", "B", 12)
        self.cell(0, 10, _fpdf_safe(text), 0, 1)
        self.set_font("Arial", "", 10)

    def add_field(self, label, value):
        self.set_font("Arial", "B", 10)
        self.cell(50, 8, _fpdf_safe(label), 0, 0)
        self.set_font("Arial", "", 10)
        self.cell(0, 8, _fpdf_safe(value), 0, 1)


def generate_insurance_claim(farmer_data, crop_data, damage_report):
    # Ensure static directory exists
    if not STATIC_DIR.exists():
        STATIC_DIR.mkdir(parents=True)

    safe_uid = _safe_filename_uid(farmer_data.get("uid", "uid"))

    pdf = PMFBYClaimPDF()
    pdf.add_page()
    
    # 1. Farmer Details
    pdf.section_title("1. Farmer Verification Details")
    pdf.add_field("Applicant Name:", farmer_data.get("name", ""))
    pdf.add_field("Farmer ID (UID):", farmer_data.get("uid", ""))
    pdf.add_field("Village/Tehsil:", farmer_data.get("location", ""))
    pdf.add_field("Bank Account:", farmer_data.get("bank_acc", ""))
    pdf.ln(5)

    # 2. Crop Details
    pdf.section_title("2. Insured Crop Details")
    pdf.add_field("Crop Variety:", crop_data.get("crop", ""))
    pdf.add_field("Sowing Date:", crop_data.get("sowing_date", ""))
    pdf.add_field("Policy Number:", crop_data.get("policy_no", ""))
    pdf.add_field("Land Area (Ha):", crop_data.get("area", ""))
    pdf.ln(5)

    # 3. AI Assessment
    pdf.section_title("3. Incident & Damage Report (AI Verified)")
    pdf.add_field("Incident Type:", damage_report.get("type", ""))
    pdf.add_field("Date of Incident:", damage_report.get("date", ""))
    
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(50, 8, _fpdf_safe("AI Estimated Loss:"), 0, 0)
    pdf.set_text_color(255, 0, 0) # RED Text
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 8, _fpdf_safe(damage_report.get("loss_percentage", "")), 0, 1)
    
    pdf.set_text_color(0)
    pdf.set_font('Arial', '', 10)
    pdf.multi_cell(0, 8, _fpdf_safe(
        f"Reason: Automated stations detected {damage_report.get('rainfall_mm', 0)}mm rain. Visual analysis confirms damage."
    ))
    pdf.ln(10)

    # 4. Declaration
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(0, 10, _fpdf_safe("Declaration:"), 0, 1)
    pdf.set_font('Arial', '', 9)
    pdf.multi_cell(0, 5, _fpdf_safe(
        "I declare that the details above are true. Digitally signed via Voice Consent."
    ))
    pdf.ln(10)
    
    pdf.cell(100, 10, _fpdf_safe(f"Signed: {farmer_data.get('name', '')}"), 0, 0)
    pdf.cell(0, 10, _fpdf_safe("[ APPROVED ]"), 0, 1, 'R')

    abs_path = STATIC_DIR / f"Claim_{safe_uid}.pdf"
    pdf.output(str(abs_path))
    # Return bytes so the API never depends on a second path resolution for base64 encoding.
    pdf_bytes = abs_path.read_bytes()
    return f"static/Claim_{safe_uid}.pdf", pdf_bytes