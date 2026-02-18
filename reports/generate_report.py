#!/usr/bin/env python3
"""
MANDIMITRA - MSBTE Capstone Project Report (50-60 pages)
=========================================================
Exactly matches the MSBTE sample format:
  - Cover page: colored text, logo, MSBTE submission block
  - Certificate by Guide: 3 paragraphs + 4 signature columns
  - Footer: college name (left) + page number (right)
"""

import os
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    PageBreak, KeepTogether,
)

# ─── Constants ───────────────────────────────────────────────
PROJECT_DIR  = Path(__file__).parent.parent
REPORTS_DIR  = Path(__file__).parent
DIAG         = REPORTS_DIR / "diagrams"
LOGO         = PROJECT_DIR / "download.jpg"
OUTPUT       = REPORTS_DIR / "MSBTE_Capstone_Project_Report.pdf"

COLLEGE_LINE1 = "K.E. Society's"
COLLEGE_LINE2 = "Rajarambapu Institute of Technology"
COLLEGE_LINE3 = "(polytechnic) Lohegaon, Pune, 47"
COLLEGE_FULL  = "K.E. Society's Rajarambapu Institute of Technology polytechnic"
DEPT_NAME     = "Artificial Intelligence and Machine Learning"
YEAR          = "2025-2026"
TITLE         = "MANDIMITRA"
SUBTITLE_L1   = "MAHARASHTRA AGRICULTURAL MARKET INTELLIGENCE AND"
SUBTITLE_L2   = "VETERINARY SERVICES PLATFORM"

STUDENTS = [
    ("Avishkar Borate",      "01"),
    ("Amol Salunke",         "02"),
    ("Pruthviraj Hippirkar", "03"),
    ("Krushna Mane",         "04"),
]
GUIDE     = "Mayur Gund"
HOD_NAME  = "Vikram Saste"       # sample shows "Mr. Vinod B. Jadhav"
PRINCIPAL = "Dr. Kashinath Munde"

W, H = A4  # 595.27 x 841.89

# Colours matching the sample screenshots exactly
RED    = HexColor("#CC0000")
CYAN   = HexColor("#008B8B")   # teal/cyan used for "SUBMITTED TO", year, etc.
BLUE   = HexColor("#003399")
GREEN  = HexColor("#228B22")
BLACK  = black
GREY   = HexColor("#333333")
LGREY  = HexColor("#999999")
HEADBG = HexColor("#1B5E20")
CELLBG = HexColor("#F5F5F5")
TBLBRD = HexColor("#CCCCCC")

FRONT_PAGES = 10  # cover(1)+cert(2)+ack(3)+abstract(4)+listfig(5)+listtbl(6)+toc(7-10)

# ─── Styles ──────────────────────────────────────────────────
styles = getSampleStyleSheet()
_style_cache = {}

def S(name, parent="Normal", **kw):
    key = name
    if key not in _style_cache:
        _style_cache[key] = ParagraphStyle(key, parent=styles[parent], **kw)
    return _style_cache[key]

S_BODY    = S("Body",    fontSize=12, leading=20, alignment=TA_JUSTIFY, spaceAfter=8, firstLineIndent=24)
S_BODY_NI = S("BodyNI",  fontSize=12, leading=20, alignment=TA_JUSTIFY, spaceAfter=8)
S_H1      = S("H1x", parent="Heading1", fontSize=18, leading=24, textColor=HEADBG, spaceAfter=14, spaceBefore=6, fontName="Helvetica-Bold")
S_H2      = S("H2x", parent="Heading2", fontSize=14, leading=18, textColor=BLUE, spaceAfter=10, spaceBefore=14, fontName="Helvetica-Bold")
S_H3      = S("H3x", parent="Heading3", fontSize=12, leading=16, textColor=GREY, spaceAfter=8, spaceBefore=10, fontName="Helvetica-Bold")
S_CENTER  = S("Ctr",  fontSize=12, alignment=TA_CENTER, leading=16)
S_CAP     = S("Cap",  fontSize=10, alignment=TA_CENTER, textColor=LGREY, spaceAfter=12, spaceBefore=4, fontName="Helvetica-Oblique")
S_BULLET  = S("Bul",  fontSize=11, leading=17, leftIndent=36, bulletIndent=18, spaceAfter=4)
S_CODE    = S("Code", fontSize=9, leading=13, fontName="Courier", leftIndent=24, spaceAfter=6, spaceBefore=6, backColor=HexColor("#F8F8F8"))
S_TOC     = S("TOCe", fontSize=12, leading=22, spaceBefore=2, spaceAfter=2)
S_TOCS    = S("TOCs", fontSize=11, leading=20, leftIndent=24, spaceBefore=1, spaceAfter=1)

def _roman(n):
    vals = [(1000,'m'),(900,'cm'),(500,'d'),(400,'cd'),(100,'c'),(90,'xc'),
            (50,'l'),(40,'xl'),(10,'x'),(9,'ix'),(5,'v'),(4,'iv'),(1,'i')]
    r = ""
    for v, s in vals:
        while n >= v:
            r += s; n -= v
    return r

def footer_cb(canvas, doc):
    canvas.saveState()
    pn = canvas.getPageNumber()
    canvas.setStrokeColor(HexColor("#CCCCCC"))
    canvas.setLineWidth(0.5)
    canvas.line(50, 45, W-50, 45)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GREY)
    canvas.drawString(50, 32, COLLEGE_FULL)
    if pn <= FRONT_PAGES:
        canvas.drawRightString(W-50, 32, _roman(pn))
    else:
        canvas.drawRightString(W-50, 32, str(pn - FRONT_PAGES))
    canvas.restoreState()

def no_footer(canvas, doc):
    pass

# ─── Helpers ─────────────────────────────────────────────────
def p(text, style=None):
    return Paragraph(text, style or S_BODY)

def pni(text):
    return Paragraph(text, S_BODY_NI)

def h1(text):
    return Paragraph(text, S_H1)

def h2(text):
    return Paragraph(text, S_H2)

def h3(text):
    return Paragraph(text, S_H3)

def bullet(text):
    return Paragraph(f"&bull; {text}", S_BULLET)

def code(text):
    return Paragraph(text.replace("\n", "<br/>").replace(" ", "&nbsp;"), S_CODE)

def spacer(h=12):
    return Spacer(1, h)

def img(story, fname, caption, w=5.8*inch):
    path = DIAG / fname
    if path.exists():
        im = Image(str(path), width=w, height=w*0.62)
        im.hAlign = "CENTER"
        story.append(spacer(6))
        story.append(im)
        story.append(Paragraph(caption, S_CAP))
    else:
        story.append(Paragraph(f"<i>[Image not found: {fname}]</i>", S_CAP))

def tbl(story, headers, rows, widths=None, caption=None):
    data = [headers] + rows
    if widths is None:
        n = len(headers)
        widths = [(W-120)/n]*n
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0), HEADBG),
        ("TEXTCOLOR",     (0,0),(-1,0), white),
        ("FONTNAME",      (0,0),(-1,0), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0),(-1,0), 10),
        ("BOTTOMPADDING", (0,0),(-1,0), 8),
        ("TOPPADDING",    (0,0),(-1,0), 8),
        ("ALIGN",         (0,0),(-1,0), "CENTER"),
        ("FONTNAME",      (0,1),(-1,-1), "Helvetica"),
        ("FONTSIZE",      (0,1),(-1,-1), 9),
        ("TOPPADDING",    (0,1),(-1,-1), 5),
        ("BOTTOMPADDING", (0,1),(-1,-1), 5),
        ("ALIGN",         (0,1),(-1,-1), "LEFT"),
        ("GRID",          (0,0),(-1,-1), 0.5, TBLBRD),
        ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
        *[("BACKGROUND",(0,i),(-1,i), CELLBG) for i in range(1,len(data),2)],
    ]))
    t.hAlign = "CENTER"
    story.append(spacer(8))
    story.append(t)
    if caption:
        story.append(Paragraph(caption, S_CAP))


# ══════════════════════════════════════════════════════════════
# PAGE 1 - COVER (matches screenshot exactly)
# ══════════════════════════════════════════════════════════════
def cover(story):
    c = lambda name, **kw: S(name, alignment=TA_CENTER, **kw)

    story.append(spacer(8))
    # College name in RED (3 lines)
    story.append(Paragraph(f'<font color="#CC0000" size="15"><b>{COLLEGE_LINE1}</b></font>',
                           c("cv1", spaceAfter=2)))
    story.append(Paragraph(f'<font color="#CC0000" size="15"><b>{COLLEGE_LINE2}</b></font>',
                           c("cv2", spaceAfter=2)))
    story.append(Paragraph(f'<font color="#CC0000" size="13"><b>{COLLEGE_LINE3}</b></font>',
                           c("cv3", spaceAfter=10)))

    # Logo
    if LOGO.exists():
        logo = Image(str(LOGO), width=1.6*inch, height=1.6*inch)
        logo.hAlign = "CENTER"
        story.append(logo)
    story.append(spacer(10))

    # "A PROJECT REPORT ON" in BLUE
    story.append(Paragraph('<font color="#003399" size="13"><b>A PROJECT REPORT ON</b></font>',
                           c("cv4", spaceAfter=4)))
    # Project title in BLUE, large
    story.append(Paragraph(f'<font color="#003399" size="20"><b>{TITLE}</b></font>',
                           c("cv5", spaceAfter=4)))
    # Subtitle in dark
    story.append(Paragraph(f'<font size="10"><b>{SUBTITLE_L1}</b></font>',
                           c("cv6", spaceAfter=1)))
    story.append(Paragraph(f'<font size="10"><b>{SUBTITLE_L2}</b></font>',
                           c("cv7", spaceAfter=10)))

    # SUBMITTED TO in CYAN
    story.append(Paragraph('<font color="#008B8B" size="11"><i>SUBMITTED TO</i></font>',
                           c("cv8", spaceAfter=4)))
    story.append(Paragraph('<font size="11"><b>MAHARASHTRA STATE BOARD OF TECHNICAL EDUCATION</b></font>',
                           c("cv9", spaceAfter=6)))
    story.append(Paragraph('<font size="10"><b>SUBMITTED IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE</b></font>',
                           c("cv10", spaceAfter=2)))
    story.append(Paragraph('<font size="10"><b>AWARD OF</b></font>',
                           c("cv11", spaceAfter=4)))
    story.append(Paragraph(f'<font color="#008B8B" size="11"><i>DIPLOMA IN {DEPT_NAME.upper()}</i></font>',
                           c("cv12", spaceAfter=6)))
    story.append(Paragraph(f'<font color="#008B8B" size="11"><i>ACADEMIC YEAR: {YEAR}</i></font>',
                           c("cv13", spaceAfter=4)))
    story.append(Paragraph('<font color="#008B8B" size="11"><i>BY</i></font>',
                           c("cv14", spaceAfter=6)))

    # Student names in black bold
    for name, roll in STUDENTS:
        story.append(Paragraph(f'<font size="11"><b>{name}</b></font>',
                               c(f"cs{roll}", spaceAfter=2)))

    story.append(spacer(10))
    # "Under the Guidance of" in CYAN
    story.append(Paragraph('<font color="#008B8B" size="11"><i>Under the Guidance of</i></font>',
                           c("cv15", spaceAfter=4)))
    # Guide name in GREEN
    story.append(Paragraph(f'<font color="#228B22" size="12"><b>{GUIDE}</b></font>',
                           c("cv16", spaceAfter=18)))

    # Bottom: college full name, black
    story.append(Paragraph(f'<font size="9">{COLLEGE_FULL}</font>',
                           c("cv17", spaceAfter=0)))

    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# PAGE 2 - CERTIFICATE BY GUIDE (matches screenshot exactly)
# ══════════════════════════════════════════════════════════════
def certificate(story):
    story.append(spacer(30))
    # Title
    story.append(Paragraph('<font size="16"><b>CERTIFICATE BY GUIDE</b></font>',
                           S("certT", alignment=TA_CENTER, spaceAfter=28)))

    just = S("certB", fontSize=12, leading=20, alignment=TA_JUSTIFY, spaceAfter=16)

    # Paragraph 1
    student_names = ", ".join([s[0] for s in STUDENTS[:-1]]) + " and " + STUDENTS[-1][0]
    story.append(Paragraph(
        f'This is to certify that the capstone project titled "{TITLE}: '
        f'Maharashtra Agricultural Market Intelligence and Veterinary Services Platform" '
        f'submitted by {student_names} of Diploma in {DEPT_NAME}, '
        f'{COLLEGE_LINE1} {COLLEGE_LINE2} (Polytechnic) Lohegaon, Pune, 47, in partial '
        f'fulfillment of the award of the diploma, is a record of the work carried out by '
        f'them under my supervision.', just))

    # Paragraph 2
    story.append(Paragraph(
        'The work presented in this project report is original and carried out in accordance '
        'with the guidelines provided by the Maharashtra State Board of Technical Education '
        '(MSBTE). The results and conclusions presented in this report are authentic and have '
        'not been presented for award of any other degree or diploma to the best of my '
        'knowledge and belief.', just))

    # Paragraph 3
    story.append(Paragraph(
        'The work satisfies the requirements for the capstone project as per the MSBTE '
        'syllabus and demonstrates the competencies acquired during the diploma program.', just))

    story.append(spacer(80))

    # Signature block - 4 columns matching the sample:
    # Guide name (blue) | External Examiner | HOD name (blue) | Principal (blue)
    # (Project Guide)   |                   | (HOD)           | (Principal)
    sig_row1 = [
        Paragraph(f'<font color="#003399"><b>{GUIDE}</b></font>',
                  S("s1", fontSize=10, alignment=TA_CENTER)),
        Paragraph('<b>External Examiner</b>',
                  S("s2", fontSize=10, alignment=TA_CENTER)),
        Paragraph(f'<font color="#003399"><b>Mr. {HOD_NAME}</b></font>',
                  S("s3", fontSize=10, alignment=TA_CENTER)),
        Paragraph(f'<font color="#003399"><b>{PRINCIPAL}</b></font>',
                  S("s4", fontSize=10, alignment=TA_CENTER)),
    ]
    sig_row2 = [
        Paragraph('<font color="#008B8B"><i>(Project Guide)</i></font>',
                  S("s5", fontSize=9, alignment=TA_CENTER)),
        Paragraph('', S("s6", fontSize=9)),
        Paragraph('<font color="#008B8B"><i>(HOD)</i></font>',
                  S("s7", fontSize=9, alignment=TA_CENTER)),
        Paragraph('<font color="#008B8B"><i>(Principal)</i></font>',
                  S("s8", fontSize=9, alignment=TA_CENTER)),
    ]
    sig = Table([sig_row1, sig_row2], colWidths=[(W-100)/4]*4)
    sig.setStyle(TableStyle([
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TOPPADDING", (0,0), (-1,0), 4),
    ]))
    story.append(sig)

    story.append(spacer(30))
    story.append(Paragraph(f'<font size="9">{COLLEGE_FULL}</font>',
                           S("certF", alignment=TA_LEFT, spaceAfter=0)))
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# PAGE 3 - ACKNOWLEDGEMENT
# ══════════════════════════════════════════════════════════════
def acknowledgement(story):
    story.append(spacer(30))
    story.append(Paragraph('<font size="16"><b>ACKNOWLEDGEMENT</b></font>',
                           S("ackT", alignment=TA_CENTER, spaceAfter=24)))

    ack_paras = [
        f"We express our sincere gratitude to <b>{GUIDE}</b>, our project guide, "
        "for his invaluable guidance, constant encouragement, and constructive suggestions "
        "throughout the development of this capstone project. His expertise in Artificial "
        "Intelligence and Machine Learning was instrumental in shaping our approach to "
        "building MANDIMITRA.",

        f"We are deeply thankful to <b>Mr. {HOD_NAME}</b>, Head of the Department of "
        f"{DEPT_NAME}, for providing the necessary laboratory facilities, technical "
        "resources, and departmental support that made this project possible.",

        f"We extend our heartfelt thanks to <b>{PRINCIPAL}</b>, Principal of "
        f"{COLLEGE_LINE1} {COLLEGE_LINE2} ({COLLEGE_LINE3}), for granting us the "
        "opportunity, institutional support, and encouragement to undertake this project.",

        "We are grateful to the <b>Maharashtra State Board of Technical Education (MSBTE)</b> "
        "for including capstone projects in the curriculum, which provided us with "
        "the opportunity to apply our theoretical knowledge to a real-world problem.",

        "We acknowledge the open-source communities and data providers whose tools and "
        "datasets made this project possible: <b>Data.gov.in (AGMARKNET)</b> for mandi "
        "price data, <b>NASA POWER</b> for historical weather data, <b>Open-Meteo</b> "
        "for weather forecasts, <b>Kaggle</b> for historical agricultural datasets, "
        "<b>Supabase</b> for database and authentication services, <b>LightGBM</b> for "
        "gradient boosting framework, <b>Next.js</b> for the frontend framework, and "
        "<b>FastAPI</b> for the backend API framework.",

        "We would also like to thank all the teaching and non-teaching staff members "
        "of the AIML department who directly or indirectly helped us during the project.",

        "Finally, we thank our families and friends for their unwavering support, "
        "patience, and motivation throughout this journey.",
    ]
    for t in ack_paras:
        story.append(Paragraph(t, S_BODY))
        story.append(spacer(6))

    story.append(spacer(30))
    for name, _ in STUDENTS:
        story.append(Paragraph(f"<b>{name}</b>", S("aN", alignment=TA_RIGHT, fontSize=11, spaceAfter=2)))
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# PAGE 4 - ABSTRACT
# ══════════════════════════════════════════════════════════════
def abstract(story):
    story.append(spacer(30))
    story.append(Paragraph('<font size="16"><b>ABSTRACT</b></font>',
                           S("absT", alignment=TA_CENTER, spaceAfter=24)))

    paras = [
        "MANDIMITRA is a comprehensive agricultural market intelligence and veterinary "
        "services platform designed exclusively for Maharashtra state. The system addresses "
        "two critical challenges faced by over 1.5 crore Maharashtra farmers: unreliable "
        "commodity price information leading to estimated 15-25% revenue loss annually, and "
        "limited access to verified veterinary services in rural areas where the ratio of "
        "veterinary doctors to livestock falls far below recommended standards.",

        "The platform integrates a robust data engineering pipeline that processes over "
        "6.1 million mandi (agricultural market) price records from AGMARKNET via Data.gov.in, "
        "spanning the period 2001 to 2026. This data covers 300+ commodities across 400+ "
        "markets in all 36 Maharashtra districts. Weather data from NASA POWER (10 years of "
        "historical precipitation, temperature, and humidity) and Open-Meteo (16-day forecasts) "
        "is integrated for all 36 district headquarters. Data quality is ensured through "
        "DuckDB-based deduplication using a 7-column natural key (state, district, market, "
        "commodity, variety, grade, arrival_date), Pandera schema validation, and strict "
        "Maharashtra-only filtering with the critical filters[state.keyword] API parameter.",

        "Two machine learning models power the intelligence layer. The <b>Crop Risk Advisor</b> "
        "is a LightGBM gradient boosting classifier incorporating physics-informed features "
        "including Growing Degree Days (GDD), Vapor Pressure Deficit (VPD), and Drought Stress "
        "Index, achieving 87.4% overall accuracy with focal-loss inspired class weighting "
        "(Low:1, Medium:10, High:50) that improved High Risk recall by 3.1%. The <b>Price "
        "Intelligence Engine</b> is a 5-horizon LightGBM ensemble achieving R-squared of "
        "0.93 for 1-day forecasts, with residual-based conformal prediction intervals "
        "providing calibrated uncertainty estimates at 80%, 90%, and 95% confidence levels.",

        "The web application is built with Next.js 14 (App Router), React, Tailwind CSS, "
        "and Framer Motion on the frontend, with FastAPI (Python) on the backend and "
        "Supabase (PostgreSQL + Auth + Storage) for data persistence. Three role-based "
        "dashboards are provided: Farmers can browse mandi prices, receive crop risk "
        "advisories, view multi-horizon price forecasts, browse verified veterinary doctors, "
        "book appointments, and send emergency SOS alerts. Veterinary Doctors can manage "
        "profiles, accept bookings, respond to emergencies, and upload verification documents. "
        "Administrators oversee the doctor verification workflow and monitor platform statistics.",

        "The veterinary service module implements 15 API endpoints covering doctor verification, "
        "appointment booking with time slot selection, booking status management, and "
        "first-come-first-serve emergency SOS broadcasts. The system uses Supabase Auth for "
        "JWT-based authentication with role-based access control.",

        "<b>Keywords:</b> Agricultural Intelligence, Machine Learning, LightGBM, Maharashtra, "
        "Mandi Prices, Crop Risk Advisory, Veterinary Services, Data Pipeline, DuckDB, "
        "Next.js, FastAPI, Supabase, Conformal Prediction, Physics-Informed Features.",
    ]
    for t in paras:
        story.append(Paragraph(t, S_BODY))
        story.append(spacer(4))
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# List of Figures & List of Tables
# ══════════════════════════════════════════════════════════════
def list_of_figures(story):
    story.append(spacer(30))
    story.append(Paragraph('<font size="16"><b>LIST OF FIGURES</b></font>',
                           S("lofT", alignment=TA_CENTER, spaceAfter=20)))
    figs = [
        ("1.1", "Project Scope - In-Scope vs Out-of-Scope"),
        ("3.1", "Three-Tier System Architecture"),
        ("3.2", "Data Flow Diagram - Level 0"),
        ("3.3", "Use Case Diagram - All Actors"),
        ("3.4", "Entity-Relationship Diagram"),
        ("4.1", "Module Interaction Diagram"),
        ("4.2", "End-to-End Data Pipeline Flow"),
        ("4.3", "Data Deduplication Strategy"),
        ("4.4", "Weather Data Integration Flow"),
        ("5.1", "Machine Learning Training Pipeline"),
        ("5.2", "Veterinary Service - Complete Flow"),
        ("5.3", "Sequence Diagram - Appointment Booking"),
        ("6.1", "Testing and Validation Strategy"),
        ("7.1", "Crop Risk Advisor - Metrics and Feature Importance"),
        ("7.2", "Price Intelligence Engine - Multi-Horizon Performance"),
        ("7.3", "Maharashtra Data Coverage Analysis"),
        ("9.1", "Production Deployment Architecture"),
    ]
    for num, title in figs:
        story.append(Paragraph(f'Figure {num}: {title}', S("lof", fontSize=11, leading=20, leftIndent=20, spaceAfter=2)))
    story.append(PageBreak())


def list_of_tables(story):
    story.append(spacer(30))
    story.append(Paragraph('<font size="16"><b>LIST OF TABLES</b></font>',
                           S("lotT", alignment=TA_CENTER, spaceAfter=20)))
    tbls = [
        ("1.1", "Development Phases and Deliverables"),
        ("2.1", "Existing Agricultural Platforms - Comparison"),
        ("2.2", "Key Research Papers Referenced"),
        ("3.1", "Functional Requirements Specification"),
        ("3.2", "Non-Functional Requirements"),
        ("3.3", "Hardware and Software Requirements"),
        ("4.1", "Database Architecture"),
        ("4.2", "Profiles Table Schema"),
        ("4.3", "Bookings Table Schema"),
        ("4.4", "Emergency Requests Table Schema"),
        ("5.1", "Complete Technology Stack"),
        ("5.2", "Data Sources and Ingestion Details"),
        ("5.3", "Crop Risk Advisor Configuration"),
        ("5.4", "Price Intelligence Engine - Per-Horizon Results"),
        ("5.5", "Web Application Pages"),
        ("5.6", "Veterinary Service API Endpoints"),
        ("5.7", "Conformal Prediction Interval Calibration"),
        ("6.1", "Unit Testing Results"),
        ("6.2", "Integration Testing Results"),
        ("6.3", "ML Model Validation Summary"),
        ("6.4", "Performance Testing Results"),
        ("7.1", "Crop Risk Classification Report"),
        ("7.2", "Class Weight Optimization History"),
        ("7.3", "Data Coverage Summary"),
        ("8.1", "Cost Estimation"),
    ]
    for num, title in tbls:
        story.append(Paragraph(f'Table {num}: {title}', S("lot", fontSize=11, leading=20, leftIndent=20, spaceAfter=2)))
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# TABLE OF CONTENTS
# ══════════════════════════════════════════════════════════════
def table_of_contents(story):
    story.append(spacer(30))
    story.append(Paragraph('<font size="16"><b>TABLE OF CONTENTS</b></font>',
                           S("tocT", alignment=TA_CENTER, spaceAfter=20)))

    entries = [
        ("", "Certificate by Guide", "ii"),
        ("", "Acknowledgement", "iii"),
        ("", "Abstract", "iv"),
        ("", "List of Figures", "v"),
        ("", "List of Tables", "vi"),
        ("1", "Introduction", "1"),
        ("1.1", "Background", "1"),
        ("1.2", "Problem Statement", "2"),
        ("1.3", "Objectives", "3"),
        ("1.4", "Scope of the Project", "4"),
        ("1.5", "Methodology", "5"),
        ("2", "Literature Survey", "6"),
        ("2.1", "Existing Systems and Platforms", "6"),
        ("2.2", "Research Papers Referenced", "7"),
        ("2.3", "Comparative Analysis", "8"),
        ("2.4", "Gaps Identified", "9"),
        ("3", "System Analysis and Requirements", "10"),
        ("3.1", "System Architecture", "10"),
        ("3.2", "Data Flow Diagram", "11"),
        ("3.3", "Use Case Diagram", "12"),
        ("3.4", "Entity-Relationship Diagram", "13"),
        ("3.5", "Functional Requirements", "14"),
        ("3.6", "Non-Functional Requirements", "15"),
        ("3.7", "Hardware and Software Requirements", "16"),
        ("4", "System Design", "17"),
        ("4.1", "Module Design", "17"),
        ("4.2", "Data Pipeline Design", "18"),
        ("4.3", "Deduplication Strategy", "19"),
        ("4.4", "Weather Data Integration", "20"),
        ("4.5", "Database Schema Design", "21"),
        ("5", "Implementation", "23"),
        ("5.1", "Technology Stack", "23"),
        ("5.2", "Data Ingestion Pipeline", "24"),
        ("5.3", "ML Model Training: Crop Risk", "26"),
        ("5.4", "ML Model Training: Price Intelligence", "27"),
        ("5.5", "Web Application Development", "28"),
        ("5.6", "Veterinary Service Module", "30"),
        ("5.7", "Authentication and Authorization", "32"),
        ("6", "Testing and Validation", "34"),
        ("6.1", "Unit Testing", "34"),
        ("6.2", "Integration Testing", "35"),
        ("6.3", "ML Model Validation", "36"),
        ("6.4", "Performance Testing", "37"),
        ("7", "Results and Analysis", "38"),
        ("7.1", "Crop Risk Advisor Results", "38"),
        ("7.2", "Price Intelligence Results", "40"),
        ("7.3", "Data Coverage Analysis", "41"),
        ("7.4", "System Performance", "42"),
        ("8", "Cost Estimation and Planning", "43"),
        ("8.1", "Project Cost Estimation", "43"),
        ("8.2", "Future Enhancements", "44"),
        ("9", "Conclusion", "46"),
        ("", "References", "48"),
        ("", "Appendices", "49"),
    ]

    for num, title, pg in entries:
        dots = "." * 60
        if num and "." not in num:
            story.append(Paragraph(f'<b>{num}. {title}</b> <font color="#999999">{dots} {pg}</font>', S_TOC))
        elif num:
            story.append(Paragraph(f'{num} {title} <font color="#999999">{dots} {pg}</font>', S_TOCS))
        else:
            story.append(Paragraph(f'<b>{title}</b> <font color="#999999">{dots} {pg}</font>', S_TOC))
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# CHAPTER 1 - INTRODUCTION (expanded)
# ══════════════════════════════════════════════════════════════
def chapter1(story):
    story.append(h1("Chapter 1: Introduction"))

    story.append(h2("1.1 Background"))
    story.append(p(
        "Agriculture is the backbone of India's economy, employing nearly 42% of the "
        "national workforce and contributing approximately 18% to the Gross Domestic Product "
        "(GDP). Maharashtra, located in western India, is one of the largest and most "
        "agriculturally diverse states, with over 1.5 crore (15 million) farmers cultivating "
        "crops across 36 districts spanning diverse agro-climatic zones from the Konkan coast "
        "to the Vidarbha plateau."
    ))
    story.append(p(
        "Maharashtra's agricultural economy is characterized by a wide variety of crops "
        "including sugarcane, cotton, soybean, onion, grapes, oranges, and various pulses. "
        "The state has over 400 regulated agricultural produce market committees (APMCs or "
        "mandis) where farmers bring their produce for sale. These mandis facilitate price "
        "discovery through open auction processes, generating thousands of price records "
        "daily. However, the information generated at these mandis remains fragmented and "
        "inaccessible to most farmers, particularly those in remote rural areas."
    ))
    story.append(p(
        "The livestock sector is equally important to Maharashtra's agricultural economy. "
        "The state has a significant cattle, buffalo, goat, and poultry population. "
        "However, veterinary healthcare infrastructure in rural Maharashtra is severely "
        "underdeveloped. According to the 20th Livestock Census, India has approximately "
        "1 veterinary doctor per 50,000 livestock - a ratio that is even worse in rural "
        "Maharashtra. This shortage leads to delayed treatment, preventable livestock "
        "mortality, and significant economic losses for farmers."
    ))
    story.append(p(
        "The advent of digital technologies, machine learning, and open data initiatives "
        "by the Government of India (such as Data.gov.in) has created an opportunity to "
        "bridge these information gaps. MANDIMITRA (literally 'Market Friend' in Marathi) "
        "was conceived as a technology solution that combines agricultural market intelligence "
        "with veterinary services in a single platform, designed specifically for Maharashtra."
    ))

    story.append(h2("1.2 Problem Statement"))
    story.append(p(
        "Despite India's digital transformation, Maharashtra's farmers continue to face "
        "two interconnected challenges that significantly impact their livelihoods:"
    ))
    story.append(h3("1.2.1 Price Information Asymmetry"))
    story.append(p(
        "Farmers lack access to real-time, accurate mandi (market) prices for their "
        "commodities. This information asymmetry results in:"
    ))
    story.append(bullet(
        "<b>Revenue Loss:</b> Farmers sell produce at sub-optimal prices, losing an estimated "
        "15-25% of potential revenue annually due to lack of market intelligence."
    ))
    story.append(bullet(
        "<b>Middleman Exploitation:</b> Information gaps are exploited by intermediaries who "
        "purchase at lower prices and sell at higher margins, reducing farmer income."
    ))
    story.append(bullet(
        "<b>Poor Planning:</b> Without price forecasts, farmers cannot make informed decisions "
        "about when to sell, which markets to target, or which crops to plant in future seasons."
    ))
    story.append(bullet(
        "<b>Risk Exposure:</b> Lack of crop risk advisories means farmers are unprepared for "
        "weather-related risks, leading to crop failures and financial distress."
    ))

    story.append(h3("1.2.2 Limited Veterinary Access"))
    story.append(p(
        "Rural Maharashtra has approximately 1 veterinary doctor per 10,000 livestock - far "
        "below the recommended ratio. This results in:"
    ))
    story.append(bullet(
        "<b>Delayed Treatment:</b> Finding a verified, qualified veterinarian in rural areas "
        "is time-consuming, especially during emergencies."
    ))
    story.append(bullet(
        "<b>Unverified Practitioners:</b> In the absence of a verification system, farmers "
        "may consult unqualified practitioners, risking animal health."
    ))
    story.append(bullet(
        "<b>Emergency Response:</b> No systematic mechanism exists for farmers to broadcast "
        "veterinary emergencies and receive rapid response from available doctors."
    ))
    story.append(bullet(
        "<b>Economic Impact:</b> Preventable livestock losses are valued at thousands of "
        "crores annually across Maharashtra."
    ))
    story.append(p(
        "No existing platform combines agricultural market intelligence with veterinary "
        "services in a unified, Maharashtra-focused solution. MANDIMITRA addresses this gap "
        "by providing a comprehensive platform that integrates data engineering, machine "
        "learning, and full-stack web development."
    ))

    story.append(h2("1.3 Objectives"))
    story.append(p("The primary objectives of MANDIMITRA are:"))
    objs = [
        "Design and implement a production-quality data pipeline that ingests, validates, "
        "deduplicates, and processes 6.1+ million mandi price records from multiple sources "
        "(AGMARKNET via Data.gov.in API, Kaggle historical datasets) with strict Maharashtra-only "
        "filtering using the critical filters[state.keyword] parameter for exact matching.",

        "Integrate weather data from NASA POWER (10-year daily historical: precipitation, "
        "temperature, relative humidity) and Open-Meteo (16-day forecasts) for all 36 "
        "Maharashtra district headquarters, creating ML-ready joined datasets.",

        "Develop a <b>Crop Risk Advisory</b> model using LightGBM gradient boosting with "
        "physics-informed features (Growing Degree Days, Vapor Pressure Deficit, Drought "
        "Stress Index) from recent research papers, achieving above 85% classification accuracy.",

        "Build a <b>Price Intelligence Engine</b> with multi-horizon forecasting capabilities "
        "(1-day, 3-day, 7-day, 14-day, 15-day) achieving R-squared above 0.88 at all horizons, "
        "with residual-based conformal prediction intervals for uncertainty quantification.",

        "Create a full-stack web application using Next.js 14, FastAPI, and Supabase with "
        "three role-based dashboards for Farmers, Veterinary Doctors, and Administrators, "
        "featuring modern UI/UX with responsive design and Framer Motion animations.",

        "Implement a comprehensive veterinary service module with doctor verification workflow "
        "(document upload, admin review, accept/reject), appointment booking with time slot "
        "selection, booking status management, and emergency SOS broadcast system with "
        "first-come-first-serve doctor acceptance.",
    ]
    for i, o in enumerate(objs, 1):
        story.append(bullet(f"<b>Objective {i}:</b> {o}"))

    story.append(h2("1.4 Scope of the Project"))
    img(story, "scope_diagram.png", "Figure 1.1: Project Scope - In-Scope vs Out-of-Scope")
    story.append(p(
        "MANDIMITRA is strictly scoped to Maharashtra state. The hard constraint ensures that "
        "all data ingestion, validation, and display is limited to Maharashtra's 36 districts. "
        "Any non-Maharashtra data is automatically dropped during pipeline processing. The "
        "platform serves three user roles:"
    ))
    story.append(bullet("<b>Farmers:</b> Primary users who browse prices, get advisories, book veterinary appointments, and send emergency SOS."))
    story.append(bullet("<b>Veterinary Doctors:</b> Service providers who undergo admin verification, manage bookings, and respond to emergencies."))
    story.append(bullet("<b>Administrators:</b> System managers who verify doctors and monitor platform statistics."))

    story.append(p(
        "Out of scope for the current version: other Indian states, direct e-commerce / "
        "buying/selling, government policy analysis, pesticide recommendations, chatbot / "
        "conversational AI, native mobile application, and multi-language (Marathi) support."
    ))

    story.append(h2("1.5 Methodology"))
    story.append(p(
        "The project follows an <b>Agile development methodology</b> with iterative sprints, "
        "each spanning 1-2 weeks. The development is organized into four major phases:"
    ))
    tbl(story,
        ["Phase", "Activities", "Duration", "Deliverables"],
        [
            ["Phase 1:\nData Engineering", "API integration with Data.gov.in,\nKaggle historical download,\nPandera schema validation,\nDuckDB deduplication", "4 weeks",
             "6.1M clean records\nin Parquet format,\naudit reports"],
            ["Phase 2:\nML Development", "Feature engineering (GDD, VPD),\nLightGBM training,\nclass weight tuning,\nconformal calibration", "3 weeks",
             "2 trained models\n(CRA 87.4% acc,\nPIE R2=0.93)"],
            ["Phase 3:\nWeb Development", "Next.js frontend (6 pages),\nFastAPI backend (15 endpoints),\nSupabase integration,\n3 role-based dashboards", "4 weeks",
             "Full-stack web app\nwith auth, booking,\nemergency SOS"],
            ["Phase 4:\nTesting & Docs", "Unit tests, integration tests,\nML validation, load testing,\nMSBTE report, deployment", "2 weeks",
             "Production-ready\nplatform with\ndocumentation"],
        ],
        widths=[75, 160, 60, 115],
        caption="Table 1.1: Development Phases and Deliverables"
    )
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# CHAPTER 2 - LITERATURE SURVEY (expanded)
# ══════════════════════════════════════════════════════════════
def chapter2(story):
    story.append(h1("Chapter 2: Literature Survey"))

    story.append(h2("2.1 Existing Systems and Platforms"))
    story.append(p(
        "A comprehensive review of existing agricultural intelligence platforms and veterinary "
        "service systems was conducted to understand the current state of the art and identify "
        "gaps. The following platforms were analyzed:"
    ))

    tbl(story,
        ["System", "Organization", "Features", "Limitations"],
        [
            ["e-NAM", "Govt. of India\n(2016)", "Single-window national\nmarket platform,\npan-India coverage", "No prediction capability,\nno veterinary services,\ngeneric - not MH-specific"],
            ["AgriMarket\nApp", "Govt. of India\n(DAC&FW)", "Daily price updates,\nmobile app, SMS alerts", "No ML-based forecasting,\nno risk advisory,\nno vet services"],
            ["MSAMB\nPortal", "Maharashtra\nState Board", "Maharashtra-specific\nmandi price display,\nmarket information", "Static data display only,\nno analytics or ML,\nno booking system"],
            ["CropIn", "CropIn Tech.\n(Private)", "Crop monitoring,\nfarm management,\nadvisory services", "Subscription-based,\ncostly for small farmers,\nnot MH-specific"],
            ["Plantix", "PEAT GmbH\n(Private)", "Disease identification\nvia phone camera,\nAI-based diagnosis", "Disease focus only,\nno price intelligence,\nno vet booking"],
            ["Kisan\nSuvidha", "Govt. of India\n(MOA)", "Weather, dealers,\nmarket prices,\nplant protection", "Basic information only,\nno ML models,\nno veterinary services"],
        ],
        widths=[60, 75, 120, 130],
        caption="Table 2.1: Existing Agricultural Platforms - Comprehensive Comparison"
    )

    story.append(p(
        "The analysis reveals that while several platforms address individual aspects of "
        "agricultural information (prices, weather, disease identification), <b>no existing "
        "platform</b> provides: (a) Maharashtra-specific ML-based price forecasting, "
        "(b) crop risk advisory with physics-informed features, and (c) integrated veterinary "
        "services with booking and emergency SOS capability. MANDIMITRA fills this critical gap."
    ))

    story.append(h2("2.2 Research Papers Referenced"))
    story.append(p(
        "The machine learning model optimization strategies were informed by recent "
        "research from leading conferences (NeurIPS, ICML 2024) and arXiv preprints. "
        "The following papers directly influenced the design decisions:"
    ))
    tbl(story,
        ["#", "Paper Title", "Authors / Source", "Year", "Contribution"],
        [
            ["1", "MT-CYP-Net: Multi-Task\nNetwork for Crop Yield", "arXiv:2505.12069", "2025", "Focal-loss inspired\nclass weighting strategy"],
            ["2", "NeuralCrop: Combining\nPhysics and ML", "arXiv:2512.20177", "2025", "GDD, VPD, drought\nstress index features"],
            ["3", "Intrinsic Explainability\nof Multimodal Learning", "arXiv:2508.06939", "2025", "Multi-task learning\narchitecture design"],
            ["4", "TabPFN: Transformer for\nSmall Tabular Data", "arXiv:2207.01848\n(NeurIPS 2022)", "2022", "Small-sample\nbootstrapping approach"],
            ["5", "Sub-Field Crop Yield\nPrediction Explainability", "arXiv:2407.08274\n(ICML 2024)", "2024", "SHAP-based feature\nimportance analysis"],
            ["6", "LightGBM: A Highly\nEfficient GBDT", "Ke et al.\n(NeurIPS 2017)", "2017", "Core ML algorithm\nfor both models"],
            ["7", "Conformal Prediction\nfor Regression", "Romano et al.\n(NeurIPS 2019)", "2019", "Prediction interval\ncalibration method"],
        ],
        widths=[20, 110, 90, 30, 120],
        caption="Table 2.2: Key Research Papers Referenced"
    )

    story.append(h2("2.3 Comparative Analysis"))
    img(story, "lit_survey_comparison.png", "Figure 2.1: Comparative Performance Analysis with Existing Works")
    story.append(p(
        "As shown in Figure 2.1, MANDIMITRA achieves superior performance in both price "
        "prediction accuracy (R-squared = 0.93 for 1-day horizon) and risk classification "
        "accuracy (87.4%). The key differentiators that contribute to this performance are:"
    ))
    story.append(bullet(
        "<b>Physics-Informed Feature Engineering:</b> Unlike generic ML approaches, MANDIMITRA "
        "incorporates domain-specific features: Growing Degree Days (GDD) for crop growth "
        "monitoring, Vapor Pressure Deficit (VPD) for evapotranspiration stress, and Drought "
        "Stress Index for water availability assessment."
    ))
    story.append(bullet(
        "<b>Conformal Prediction Intervals:</b> The Price Intelligence Engine provides "
        "calibrated uncertainty estimates, allowing farmers to understand the reliability "
        "of price forecasts - a feature absent in all existing platforms."
    ))
    story.append(bullet(
        "<b>Integrated Veterinary Services:</b> No agricultural intelligence platform "
        "currently combines market analytics with veterinary booking and emergency SOS."
    ))

    story.append(h2("2.4 Gaps Identified"))
    story.append(p(
        "Based on the literature review and analysis of existing systems, the following "
        "critical gaps were identified that MANDIMITRA addresses:"
    ))
    tbl(story,
        ["Gap", "Description", "MANDIMITRA Solution"],
        [
            ["No MH-specific\nML platform", "Existing platforms provide\ngeneric pan-India data\nwithout state-specific ML", "Dedicated Maharashtra pipeline\nwith 36-district coverage,\nMH-only hard constraint"],
            ["No price\nforecasting", "Current mandi portals\nshow only historical/\ncurrent prices", "5-horizon LightGBM\nforecasting with conformal\nprediction intervals"],
            ["No risk\nadvisory", "Farmers receive no\nproactive crop risk\nassessment", "LightGBM classifier with\nphysics-informed features\n(GDD, VPD, DSI)"],
            ["No vet-agri\nintegration", "Veterinary and\nagricultural services\nare separate systems", "Unified platform with\nbooking, verification,\nemergency SOS"],
            ["No uncertainty\nquantification", "ML predictions lack\nconfidence information", "Conformal prediction\nintervals at 80/90/95%\nconfidence levels"],
        ],
        widths=[75, 135, 165],
        caption="Table 2.3: Gaps Identified and MANDIMITRA Solutions"
    )
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# CHAPTER 3 - SYSTEM ANALYSIS (expanded)
# ══════════════════════════════════════════════════════════════
def chapter3(story):
    story.append(h1("Chapter 3: System Analysis and Requirements"))

    story.append(h2("3.1 System Architecture"))
    story.append(p(
        "MANDIMITRA follows a <b>three-tier architecture</b> that separates concerns across "
        "Presentation, Application, and Data layers. This modular design enables independent "
        "development, testing, and deployment of each layer."
    ))
    img(story, "system_architecture.png", "Figure 3.1: Three-Tier System Architecture")
    story.append(p(
        "The <b>Presentation Layer</b> consists of a Next.js 14 frontend application using "
        "the App Router paradigm with server-side rendering. The frontend provides six main "
        "pages (Landing, Crop Risk, Price Forecast, Veterinary, Login, Signup) and three "
        "role-based dashboards (Farmer, Doctor, Admin). UI is built with Tailwind CSS for "
        "utility-first styling and Framer Motion for smooth animations."
    ))
    story.append(p(
        "The <b>Application Layer</b> includes a FastAPI backend organized into two primary "
        "modules: auth.py (authentication and user management) and vet.py (veterinary services "
        "with 15 endpoints). An ML inference engine directly loads trained LightGBM models "
        "from .joblib files for real-time prediction."
    ))
    story.append(p(
        "The <b>Data Layer</b> uses a dual-database strategy: Supabase PostgreSQL for "
        "transactional data (user profiles, bookings, emergency requests) with row-level "
        "security, and DuckDB for OLAP-style analytical queries over 6.1M mandi price "
        "records stored in Parquet files. Supabase also provides Auth (JWT-based) and "
        "Storage (for verification documents)."
    ))

    story.append(h2("3.2 Data Flow Diagram"))
    img(story, "dfd_level0.png", "Figure 3.2: Data Flow Diagram - Level 0")
    story.append(p(
        "The Level 0 Data Flow Diagram shows MANDIMITRA as a central system interacting with "
        "five external entities. Farmers submit booking requests and emergency SOS alerts and "
        "receive price information, risk advisories, and booking confirmations. Veterinary "
        "doctors receive emergency broadcasts and booking notifications, and update case "
        "statuses. Administrators verify doctors. External data sources (Data.gov.in, NASA "
        "POWER, Open-Meteo) provide commodity prices and weather data. Two data stores "
        "maintain mandi prices (D1) and weather data (D2)."
    ))

    story.append(h2("3.3 Use Case Diagram"))
    img(story, "use_cases.png", "Figure 3.3: Use Case Diagram - All Three Actors")
    story.append(p(
        "The use case diagram identifies 12 primary use cases across three actors:"
    ))
    story.append(p("<b>Farmer Use Cases (6):</b>"))
    for uc in ["View Mandi Prices - browse current and historical commodity prices",
               "Get Crop Risk Advisory - receive weather-based risk classification",
               "Get Price Forecast - view multi-horizon price predictions",
               "Browse Verified Doctors - find nearby veterinary doctors",
               "Book Appointment - schedule visits with time slot selection",
               "Send Emergency SOS - broadcast urgent veterinary alert"]:
        story.append(bullet(uc))
    story.append(p("<b>Doctor Use Cases (4):</b>"))
    for uc in ["Upload Verification Document - submit license for admin review",
               "View Bookings - see upcoming appointments",
               "Accept Emergency - claim active SOS broadcasts",
               "Complete Case - mark emergencies as resolved"]:
        story.append(bullet(uc))
    story.append(p("<b>Admin Use Cases (2):</b>"))
    for uc in ["Verify Doctors - accept/reject doctor applications",
               "View Dashboard Stats - monitor platform metrics"]:
        story.append(bullet(uc))

    story.append(h2("3.4 Entity-Relationship Diagram"))
    img(story, "er_diagram.png", "Figure 3.4: Entity-Relationship Diagram - Database Schema")
    story.append(p(
        "The database schema consists of three primary tables in Supabase PostgreSQL "
        "(profiles, bookings, emergency_requests) plus two analytical data stores (mandi "
        "prices and weather in Parquet format). The profiles table stores user data with "
        "role-specific fields. Bookings link farmers to doctors with a many-to-one "
        "relationship. Emergency requests support first-come-first-serve acceptance."
    ))

    story.append(h2("3.5 Functional Requirements"))
    tbl(story,
        ["Req. ID", "Requirement", "Priority", "Module"],
        [
            ["FR-01", "User registration with role selection\n(farmer/doctor)", "High", "Auth"],
            ["FR-02", "JWT-based login with token management", "High", "Auth"],
            ["FR-03", "Doctor verification document upload\n(PDF/image, max 5MB)", "High", "Vet"],
            ["FR-04", "Admin dashboard with pending doctor list", "High", "Admin"],
            ["FR-05", "Doctor accept/reject verification workflow", "High", "Admin"],
            ["FR-06", "Browse verified doctors with search", "High", "Farmer"],
            ["FR-07", "Book appointment with date and time slot", "High", "Farmer"],
            ["FR-08", "Emergency SOS broadcast to all doctors", "High", "Farmer"],
            ["FR-09", "First-come-first-serve emergency acceptance", "High", "Doctor"],
            ["FR-10", "Booking status management\n(confirm/complete/cancel)", "Medium", "Doctor"],
            ["FR-11", "Crop risk advisory display", "High", "Farmer"],
            ["FR-12", "Multi-horizon price prediction display", "High", "Farmer"],
            ["FR-13", "Dashboard statistics for admin", "Medium", "Admin"],
            ["FR-14", "Mandi price data pipeline (ingestion)", "High", "Pipeline"],
            ["FR-15", "Weather data integration (NASA + Open-Meteo)", "High", "Pipeline"],
        ],
        widths=[45, 180, 50, 55],
        caption="Table 3.1: Functional Requirements Specification"
    )

    story.append(h2("3.6 Non-Functional Requirements"))
    tbl(story,
        ["NFR ID", "Requirement", "Target", "Category"],
        [
            ["NFR-01", "Page load time under 3 seconds", "< 3s", "Performance"],
            ["NFR-02", "API response time under 500ms", "< 500ms", "Performance"],
            ["NFR-03", "Support 100 concurrent users", "> 100", "Scalability"],
            ["NFR-04", "Data pipeline handles 6M+ records", "> 6M rows", "Scalability"],
            ["NFR-05", "JWT token-based authentication", "OAuth 2.0", "Security"],
            ["NFR-06", "Role-based access control (RBAC)", "3 roles", "Security"],
            ["NFR-07", "Responsive design (mobile-friendly)", "320px+", "Usability"],
            ["NFR-08", "Data freshness within 24 hours", "< 24h lag", "Availability"],
            ["NFR-09", "99% uptime for web application", "> 99%", "Reliability"],
            ["NFR-10", "Verification doc upload max 5MB", "< 5MB", "Constraint"],
        ],
        widths=[50, 175, 65, 75],
        caption="Table 3.2: Non-Functional Requirements"
    )

    story.append(h2("3.7 Hardware and Software Requirements"))
    tbl(story,
        ["Category", "Component", "Specification"],
        [
            ["Hardware", "Processor", "Intel Core i5 / AMD Ryzen 5 or higher"],
            ["Hardware", "RAM", "8 GB minimum, 16 GB recommended"],
            ["Hardware", "Storage", "50 GB free (for data files and models)"],
            ["Hardware", "Internet", "Broadband connection (for API downloads)"],
            ["Software", "Operating System", "Windows 10/11, Ubuntu 20.04+, macOS 12+"],
            ["Software", "Python", "3.10 or higher"],
            ["Software", "Node.js", "18.x or higher (for Next.js)"],
            ["Software", "Git", "2.30 or higher"],
            ["Software", "Browser", "Chrome 90+, Firefox 88+, Edge 90+"],
            ["Software", "IDE", "VS Code with Python & TypeScript extensions"],
        ],
        widths=[70, 110, 210],
        caption="Table 3.3: Hardware and Software Requirements"
    )
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# CHAPTER 4 - SYSTEM DESIGN (expanded)
# ══════════════════════════════════════════════════════════════
def chapter4(story):
    story.append(h1("Chapter 4: System Design"))

    story.append(h2("4.1 Module Design"))
    img(story, "module_interaction.png", "Figure 4.1: Module Interaction Diagram")
    story.append(p(
        "The system is decomposed into five major modules, each with well-defined "
        "interfaces and responsibilities:"
    ))
    story.append(h3("4.1.1 Auth Module (api/auth.py)"))
    story.append(p(
        "Handles user registration, login, and session management via Supabase Auth. "
        "Supports three roles (farmer, doctor, admin) with distinct registration flows. "
        "Doctors provide additional fields during signup: specialization, years of experience, "
        "veterinary license number, and college name. The module issues JWT tokens and "
        "provides middleware for role-based access control across all API endpoints."
    ))
    story.append(h3("4.1.2 Veterinary Service Module (api/vet.py)"))
    story.append(p(
        "Contains 15 REST API endpoints organized by role (admin: 3, doctor: 7, farmer: 5). "
        "Key design patterns include: bearer token authentication on all endpoints, "
        "first-come-first-serve locking for emergency acceptance using database-level "
        "conditional updates (eq status=active), and file upload via multipart form data "
        "with type and size validation."
    ))
    story.append(h3("4.1.3 ML Engine Module"))
    story.append(p(
        "Houses two trained LightGBM models serialized as .joblib files. The Crop Risk "
        "Advisor loads the classifier and applies physics-informed feature engineering at "
        "inference time. The Price Intelligence Engine loads 5 horizon-specific regressors "
        "and the conformal calibration file for prediction interval generation."
    ))
    story.append(h3("4.1.4 Data Pipeline Module"))
    story.append(p(
        "A suite of Python scripts for data ingestion, validation, deduplication, and "
        "feature engineering. Key design decisions: chunked downloads by district for "
        "resumability, adaptive rate limiting using a token bucket algorithm, parallel "
        "processing with ThreadPoolExecutor (configurable workers), and atomic progress "
        "tracking via JSON state files to prevent data corruption."
    ))
    story.append(h3("4.1.5 Next.js Frontend Module"))
    story.append(p(
        "Server-side rendered React application using Next.js 14 App Router. Uses "
        "Tailwind CSS for utility-first styling, Framer Motion for layout animations, "
        "and Lucide React for consistent iconography. State management via React hooks "
        "and Context API (AuthContext for authentication state)."
    ))

    story.append(h2("4.2 Data Pipeline Design"))
    img(story, "pipeline_flowchart.png", "Figure 4.2: End-to-End Data Pipeline Flow")
    story.append(p(
        "The data pipeline consists of 6 stages processing data from raw API responses "
        "to ML-ready datasets. Each stage is implemented as an independent Python script "
        "that can be run individually or orchestrated via download_all_data.py."
    ))
    story.append(p(
        "<b>Stage 1 - Data Ingestion:</b> Four data sources are queried: Kaggle (historical "
        "mandi 2001-2024, ~5.95M rows), Data.gov.in AGMARKNET API (current daily prices, "
        "~150K rows), NASA POWER API (10-year historical weather for 36 districts), and "
        "Open-Meteo API (16-day weather forecasts). Downloads are chunked by district "
        "for resumability."
    ))
    story.append(p(
        "<b>Stage 2 - Validation and Cleaning:</b> Raw data passes through Pandera schemas "
        "that enforce type constraints, value ranges (prices >= 0), and the critical "
        "Maharashtra-only filter. Non-Maharashtra records are automatically dropped and "
        "logged."
    ))
    story.append(p(
        "<b>Stage 3 - Deduplication and Merge:</b> Historical and current data are merged "
        "using an upsert strategy where newer (current) records override older (historical) "
        "records. DuckDB SQL handles deduplication efficiently. ~700K duplicates removed."
    ))
    story.append(p(
        "<b>Stage 4 - Feature Engineering:</b> Physics-informed features are computed: "
        "Growing Degree Days (GDD = max(0, (Tmax+Tmin)/2 - Tbase)), Vapor Pressure "
        "Deficit (VPD = es - ea), and Drought Stress Index. Rolling statistics and lag "
        "features are added for time-series modeling."
    ))
    story.append(p(
        "<b>Stage 5 - Model Training:</b> LightGBM models are trained with 5-fold "
        "cross-validation. Class weights are tuned via grid search. Conformal prediction "
        "intervals are calibrated on a held-out calibration set."
    ))
    story.append(p(
        "<b>Stage 6 - Serving:</b> Trained models are serialized to .joblib format and "
        "served via FastAPI REST endpoints. The Next.js frontend displays results."
    ))

    story.append(h2("4.3 Deduplication Strategy"))
    img(story, "dedup_process_flow.png", "Figure 4.3: Data Deduplication Strategy")
    story.append(p(
        "Raw data from multiple sources contains approximately 700K duplicate records "
        "with overlapping date ranges. The deduplication uses DuckDB's window function "
        "ROW_NUMBER() with PARTITION BY on the 7-column natural key:"
    ))
    story.append(code(
        "SELECT *, ROW_NUMBER() OVER (\n"
        "    PARTITION BY state, district, market,\n"
        "               commodity, variety, grade,\n"
        "               arrival_date\n"
        "    ORDER BY source_priority DESC,\n"
        "             price_completeness DESC,\n"
        "             modal_price DESC\n"
        ") AS rn\n"
        "FROM mandi_raw\n"
        "WHERE rn = 1"
    ))
    story.append(p(
        "Priority rules ensure: (1) 'current' source beats 'history' source (newer data "
        "wins), (2) rows with more complete price columns (min, max, modal all non-null) "
        "are preferred, (3) highest modal_price is used as tiebreaker. This reduces "
        "6.8M raw rows to 6.1M canonical records."
    ))

    story.append(h2("4.4 Weather Data Integration"))
    img(story, "weather_integration_flow.png", "Figure 4.4: Weather Data Integration Flow")
    story.append(p(
        "Weather data from two sources is standardized and joined with mandi data:"
    ))
    story.append(bullet(
        "<b>NASA POWER:</b> 10-year daily historical data (PRECTOTCORR, T2M, RH2M) for "
        "36 district headquarters. ~473K data points."
    ))
    story.append(bullet(
        "<b>Open-Meteo:</b> 16-day weather forecasts (precipitation, temperature range) for "
        "36 districts. Updated daily."
    ))
    story.append(p(
        "Both sources are normalized to a common schema with district names mapped to "
        "canonical Maharashtra district names. The join with mandi data is performed on "
        "(date, district) keys, resulting in a weather-enriched dataset covering 2016+ "
        "(NASA POWER availability)."
    ))

    story.append(h2("4.5 Database Schema Design"))
    story.append(p(
        "The database uses a dual-strategy: Supabase PostgreSQL for transactional data "
        "and DuckDB + Parquet for analytical data. The three primary PostgreSQL tables are:"
    ))

    tbl(story,
        ["Column", "Type", "Constraints", "Description"],
        [
            ["id", "UUID", "PRIMARY KEY", "Supabase Auth user ID"],
            ["full_name", "TEXT", "NOT NULL", "Display name"],
            ["email", "TEXT", "UNIQUE", "Login email"],
            ["phone", "TEXT", "nullable", "Contact number"],
            ["role", "TEXT", "NOT NULL", "farmer / doctor / admin"],
            ["verification_status", "TEXT", "DEFAULT pending", "For doctors: pending/active/rejected"],
            ["is_verified", "BOOLEAN", "DEFAULT false", "Quick check flag"],
            ["specialization", "TEXT", "nullable", "Doctor specialty"],
            ["years_of_experience", "INT", "nullable", "Doctor experience"],
            ["veterinary_license", "TEXT", "nullable", "License number"],
            ["veterinary_college", "TEXT", "nullable", "College name"],
            ["verification_document_url", "TEXT", "nullable", "Supabase Storage URL"],
            ["address", "TEXT", "nullable", "Location/address"],
            ["created_at", "TIMESTAMPTZ", "DEFAULT now()", "Registration timestamp"],
        ],
        widths=[95, 65, 80, 150],
        caption="Table 4.2: Profiles Table Schema"
    )

    tbl(story,
        ["Column", "Type", "Constraints", "Description"],
        [
            ["id", "UUID", "PK, DEFAULT uuid_generate_v4()", "Booking ID"],
            ["farmer_id", "UUID", "FK -> profiles.id", "Booking farmer"],
            ["doctor_id", "UUID", "FK -> profiles.id", "Assigned doctor"],
            ["booking_date", "DATE", "NOT NULL", "Appointment date"],
            ["time_slot", "TEXT", "NOT NULL", "e.g., '10:00 AM - 11:00 AM'"],
            ["animal_type", "TEXT", "nullable", "Cow, Buffalo, Goat, etc."],
            ["description", "TEXT", "nullable", "Issue description"],
            ["status", "TEXT", "DEFAULT pending", "pending/confirmed/completed/cancelled"],
            ["farmer_name", "TEXT", "denormalized", "For quick display"],
            ["doctor_name", "TEXT", "denormalized", "For quick display"],
            ["created_at", "TIMESTAMPTZ", "DEFAULT now()", "Booking timestamp"],
        ],
        widths=[80, 65, 110, 135],
        caption="Table 4.3: Bookings Table Schema"
    )

    tbl(story,
        ["Column", "Type", "Constraints", "Description"],
        [
            ["id", "UUID", "PK, DEFAULT uuid_generate_v4()", "Emergency ID"],
            ["farmer_id", "UUID", "FK -> profiles.id", "Requesting farmer"],
            ["accepted_by", "UUID", "FK -> profiles.id, nullable", "Doctor who accepted"],
            ["animal_type", "TEXT", "NOT NULL", "Animal in emergency"],
            ["description", "TEXT", "NOT NULL", "Emergency description"],
            ["location", "TEXT", "nullable", "Village / area name"],
            ["latitude", "FLOAT", "nullable", "GPS latitude"],
            ["longitude", "FLOAT", "nullable", "GPS longitude"],
            ["status", "TEXT", "DEFAULT active", "active/accepted/completed"],
            ["farmer_name", "TEXT", "denormalized", "For quick display"],
            ["doctor_name", "TEXT", "nullable", "Set on acceptance"],
            ["created_at", "TIMESTAMPTZ", "DEFAULT now()", "SOS timestamp"],
        ],
        widths=[80, 55, 115, 135],
        caption="Table 4.4: Emergency Requests Table Schema"
    )
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# CHAPTER 5 - IMPLEMENTATION (expanded significantly)
# ══════════════════════════════════════════════════════════════
def chapter5(story):
    story.append(h1("Chapter 5: Implementation"))

    story.append(h2("5.1 Technology Stack"))
    tbl(story,
        ["Layer", "Technology", "Version", "Purpose"],
        [
            ["Frontend", "Next.js (React)", "14.x", "Server-side rendered SPA with App Router"],
            ["Frontend", "Tailwind CSS", "3.x", "Utility-first responsive styling"],
            ["Frontend", "Framer Motion", "11.x", "Layout animations, page transitions"],
            ["Frontend", "Lucide React", "0.x", "Consistent SVG icon library"],
            ["Frontend", "TypeScript", "5.x", "Type-safe frontend development"],
            ["Backend", "FastAPI", "0.109+", "Async Python REST API framework"],
            ["Backend", "Python", "3.10+", "Core backend language"],
            ["Backend", "Pydantic", "2.x", "Request/response validation"],
            ["Database", "Supabase", "latest", "PostgreSQL + Auth + Storage BaaS"],
            ["Database", "DuckDB", "1.x", "In-process OLAP for mandi analytics"],
            ["ML", "LightGBM", "4.x", "Gradient boosting (classification + regression)"],
            ["ML", "Scikit-learn", "1.x", "Preprocessing, metrics, utilities"],
            ["ML", "Joblib", "-", "Model serialization and loading"],
            ["Data", "Pandas", "2.x", "DataFrame manipulation and I/O"],
            ["Data", "Pandera", "0.x", "DataFrame schema validation"],
            ["Data", "NumPy", "1.x", "Numerical computing"],
            ["Viz", "Matplotlib", "3.x", "Model result visualization"],
        ],
        widths=[55, 100, 42, 195],
        caption="Table 5.1: Complete Technology Stack"
    )

    story.append(h2("5.2 Data Ingestion Pipeline"))
    story.append(p(
        "The data ingestion pipeline handles four distinct data sources with robust error "
        "handling, rate limiting, and resumability. Each source is implemented as an "
        "independent Python script that can be run individually or orchestrated."
    ))
    tbl(story,
        ["Source", "API / Method", "Data Type", "Volume", "Update"],
        [
            ["Data.gov.in\nAGMARKNET", "REST API\nfilters[state.keyword]\n=Maharashtra", "Current mandi\nprices (CSV)", "~150K\nrows/day", "Daily"],
            ["Kaggle\nDataset", "kaggle CLI\ndownload +\nunzip", "Historical mandi\n2001-2024\n(CSV)", "~5.95M\nrows", "One-\ntime"],
            ["NASA\nPOWER", "REST API\n/api/temporal/\ndaily", "Historical weather\n10yr: precip,\ntemp, humidity", "~473K\nrows", "Weekly"],
            ["Open-\nMeteo", "REST API\n/v1/forecast", "16-day weather\nforecasts per\ndistrict", "~576\nrows", "Daily"],
        ],
        widths=[65, 95, 90, 55, 45],
        caption="Table 5.2: Data Sources and Ingestion Details"
    )

    story.append(h3("5.2.1 AGMARKNET API Integration"))
    story.append(p(
        "A critical technical detail discovered during development: the Data.gov.in API "
        "requires <b>filters[state.keyword]</b> for exact string matching. The simpler "
        "<b>filters[state]</b> performs fuzzy/partial matching, which can return records "
        "from other states (e.g., 'Madhya Pradesh' matches when filtering for 'Maharashtra'). "
        "All MANDIMITRA scripts enforce the keyword filter to maintain data integrity."
    ))
    story.append(code(
        "# CORRECT - exact matching (Maharashtra ONLY)\n"
        "params = {'filters[state.keyword]': 'Maharashtra'}\n\n"
        "# WRONG - fuzzy matching (may return other states!)\n"
        "params = {'filters[state]': 'Maharashtra'}"
    ))

    story.append(h3("5.2.2 Rate Limiting and Resumability"))
    story.append(p(
        "The pipeline implements a token bucket rate limiter to handle API throttling "
        "gracefully. When a 429 (Too Many Requests) response is received, the delay is "
        "automatically increased. Downloads are chunked by district, with progress saved "
        "atomically to a JSON state file after every batch. If a download is interrupted, "
        "it resumes from the last successful chunk."
    ))
    story.append(code(
        "# Token bucket rate limiter\n"
        "class TokenBucket:\n"
        "    def __init__(self, rate=2.0, capacity=5):\n"
        "        self.rate = rate\n"
        "        self.capacity = capacity\n"
        "        self.tokens = capacity\n"
        "        self.last_time = time.monotonic()\n\n"
        "    def acquire(self):\n"
        "        now = time.monotonic()\n"
        "        elapsed = now - self.last_time\n"
        "        self.tokens = min(self.capacity,\n"
        "                        self.tokens + elapsed * self.rate)\n"
        "        self.last_time = now\n"
        "        if self.tokens >= 1:\n"
        "            self.tokens -= 1\n"
        "            return 0  # no wait\n"
        "        return (1 - self.tokens) / self.rate"
    ))

    story.append(h3("5.2.3 Parallel Downloads"))
    story.append(p(
        "Downloads use Python's ThreadPoolExecutor with configurable worker count "
        "(max 8 for mandi, max 4 for weather APIs). Each worker maintains its own "
        "HTTP session with connection pooling via requests.Session(). A shared "
        "thread-safe rate limiter ensures compliance across all workers."
    ))

    story.append(h2("5.3 ML Model Training: Crop Risk Advisor"))
    img(story, "ml_pipeline.png", "Figure 5.1: Machine Learning Training Pipeline")

    story.append(h3("5.3.1 Feature Engineering"))
    story.append(p(
        "The Crop Risk Advisor uses 25 features including 4 physics-informed additions "
        "based on the NeuralCrop research paper (arXiv:2512.20177):"
    ))
    story.append(bullet("<b>Growing Degree Days (GDD):</b> GDD = max(0, (T_max + T_min)/2 - T_base), where T_base = 10C. Accumulated over 7 and 14 day windows. GDD captures cumulative heat energy available for crop growth."))
    story.append(bullet("<b>Vapor Pressure Deficit (VPD):</b> VPD = e_s - e_a, where e_s is saturation vapor pressure and e_a is actual vapor pressure. Higher VPD indicates greater evaporative demand (stress). Computed as 7-day rolling average."))
    story.append(bullet("<b>Drought Stress Index (DSI):</b> DSI = 1 - (P_actual / P_expected), where P is precipitation. Ranges from 0 (no drought) to 1 (complete drought). Computed over 7-day window."))

    tbl(story,
        ["Parameter", "Value", "Rationale"],
        [
            ["Algorithm", "LightGBM Classifier\n(GBDT)", "Fast training, handles categoricals natively,\nhigh accuracy on tabular data"],
            ["Class Weights", "{Low:1, Med:10,\nHigh:50}", "Focal-loss inspired weighting for\nsevere class imbalance (85:10:5 ratio)"],
            ["Physics Features", "GDD (7d, 14d),\nVPD (7d), DSI (7d)", "Domain knowledge from NeuralCrop;\nvalidated by feature importance ranking"],
            ["Cross-Validation", "5-fold Stratified CV", "Ensures representative class distribution;\nrobust performance estimate"],
            ["Total Features", "25", "Including district, crop, weather,\ncalendar, and physics features"],
            ["Training Samples", "~274K", "Mandi + weather joined (2016+);\n80/20 train/test split"],
            ["num_leaves", "63", "Balances model complexity vs overfitting"],
            ["learning_rate", "0.05", "Conservative for better generalization"],
            ["n_estimators", "500", "With early stopping on validation loss"],
        ],
        widths=[90, 100, 200],
        caption="Table 5.3: Crop Risk Advisor Configuration"
    )

    story.append(h2("5.4 ML Model Training: Price Intelligence Engine"))
    story.append(p(
        "The Price Intelligence Engine consists of 5 independent LightGBM regressors, "
        "each trained to predict commodity modal prices at a specific forecast horizon. "
        "The models use lag features, rolling statistics, and calendar features."
    ))
    tbl(story,
        ["Horizon", "Target Variable", "R-squared", "MAE (Rs/q)", "RMSE (Rs/q)", "MAPE"],
        [
            ["1-day",  "modal_price(t+1)",   "0.9331", "361.72",  "687.77",  "21.31%"],
            ["3-day",  "modal_price(t+3)",   "0.9105", "435.38",  "803.34",  "26.23%"],
            ["7-day",  "modal_price(t+7)",   "0.8904", "501.82",  "896.52",  "34.56%"],
            ["14-day", "modal_price(t+14)",  "0.8684", "561.81",  "983.83",  "47.59%"],
            ["15-day", "modal_price(t+15)",  "0.8821", "546.28",  "924.92",  "44.80%"],
        ],
        widths=[50, 95, 60, 70, 70, 50],
        caption="Table 5.4: Price Intelligence Engine - Per-Horizon Results"
    )

    story.append(h3("5.4.1 Conformal Prediction Intervals"))
    story.append(p(
        "A key innovation in MANDIMITRA is the use of <b>residual-based conformal prediction</b> "
        "to provide calibrated uncertainty estimates for price forecasts. This is critical "
        "because farmers need to know not just the predicted price, but how reliable that "
        "prediction is."
    ))
    story.append(p(
        "The calibration process: (1) Train the model on the training set, (2) compute "
        "absolute residuals on a held-out calibration set, (3) sort residuals and compute "
        "quantiles at desired confidence levels (80%, 90%, 95%). At inference time, the "
        "prediction interval is: [prediction - quantile, prediction + quantile]."
    ))
    tbl(story,
        ["Confidence", "Interval Width (Rs/q)", "Interpretation"],
        [
            ["80%", "+/- 564.52", "80% of actual prices fall within this band"],
            ["90%", "+/- 923.94", "90% of actual prices fall within this band"],
            ["95%", "+/- 1,353.37", "95% of actual prices fall within this band"],
        ],
        widths=[80, 130, 200],
        caption="Table 5.7: Conformal Prediction Interval Calibration"
    )

    story.append(h2("5.5 Web Application Development"))
    story.append(p(
        "The web application is built with Next.js 14 using the App Router paradigm, "
        "which provides automatic server-side rendering, file-system based routing, and "
        "React Server Components. The frontend communicates with the FastAPI backend via "
        "RESTful API calls with JWT Bearer token authentication."
    ))
    tbl(story,
        ["Page", "Route", "Key Features"],
        [
            ["Landing Page", "/", "Hero section with gradient background, animated stats\n"
             "counter (6.1M records, 36 districts, 300+ commodities),\n"
             "features grid, how-it-works timeline, testimonials carousel,\n"
             "call-to-action section"],
            ["Crop Risk\nAdvisory", "/crop-risk", "District dropdown (36 options), crop selector,\n"
             "risk level display with color coding (Low/Med/High),\n"
             "weather data integration, advice text"],
            ["Price\nForecast", "/price-forecast", "Commodity search, multi-horizon tabs (1-15 days),\n"
             "predicted price with confidence intervals,\n"
             "HOLD/SELL recommendation with confidence level"],
            ["Veterinary\nServices", "/veterinary", "Service overview, animated feature cards,\n"
             "links to login/signup for booking access"],
            ["Auth Pages", "/login\n/signup", "Supabase Auth integration, role selector,\n"
             "doctor-specific fields, form validation,\n"
             "redirect to role-based dashboard"],
            ["Farmer\nDashboard", "/dashboard/\nfarmer", "3 tabs: Find Doctors (search, book),\n"
             "My Bookings (status tracking),\n"
             "My Emergencies (SOS history).\n"
             "Includes booking modal and SOS modal"],
            ["Doctor\nDashboard", "/dashboard/\ndoctor", "Profile with analytics, emergency cases\n"
             "with accept/complete, booking management\n"
             "with status updates, document upload"],
            ["Admin\nDashboard", "/dashboard/\nadmin", "Stats overview (farmers, doctors, bookings),\n"
             "pending doctor verification queue,\n"
             "accept/reject with document viewing"],
        ],
        widths=[60, 70, 260],
        caption="Table 5.5: Web Application Pages"
    )

    story.append(h2("5.6 Veterinary Service Module"))
    img(story, "vet_service_flow.png", "Figure 5.2: Veterinary Service - Complete Flow (Swimlane)")
    story.append(p(
        "The veterinary service module implements a complete workflow spanning three user "
        "roles with 15 API endpoints. All endpoints are authenticated via JWT Bearer token "
        "and enforce role-based access control."
    ))
    tbl(story,
        ["Endpoint", "Method", "Role", "Description"],
        [
            ["/admin/pending-doctors",     "GET",   "Admin",  "List doctors awaiting verification"],
            ["/admin/verify-doctor",       "POST",  "Admin",  "Accept or reject a doctor application"],
            ["/admin/stats",               "GET",   "Admin",  "Platform statistics (counts)"],
            ["/doctor/upload-document",    "POST",  "Doctor", "Upload verification doc (PDF/image, max 5MB)"],
            ["/doctor/profile",            "GET",   "Doctor", "Profile with analytics (completed visits,\nactive bookings, emergencies handled)"],
            ["/doctor/emergency-cases",    "GET",   "Doctor", "Active emergency broadcast list\n(only for verified doctors)"],
            ["/doctor/accept-emergency",   "POST",  "Doctor", "First-come-first-serve claim\n(conditional on status=active)"],
            ["/doctor/complete-emergency", "POST",  "Doctor", "Mark accepted emergency as done"],
            ["/doctor/bookings",           "GET",   "Doctor", "Doctor's appointment list\n(ordered by booking_date DESC)"],
            ["/doctor/booking-status",     "PATCH", "Doctor", "Update: confirmed/completed/cancelled"],
            ["/doctors",                   "GET",   "Farmer", "Browse all verified (active) doctors"],
            ["/farmer/book",               "POST",  "Farmer", "Create appointment with doctor"],
            ["/farmer/emergency",          "POST",  "Farmer", "Broadcast emergency SOS to all doctors"],
            ["/farmer/bookings",           "GET",   "Farmer", "Farmer's appointment history"],
            ["/farmer/emergencies",        "GET",   "Farmer", "Farmer's emergency request history"],
        ],
        widths=[110, 40, 50, 190],
        caption="Table 5.6: Veterinary Service API Endpoints (prefix: /api/vet)"
    )

    img(story, "booking_sequence.png", "Figure 5.3: Sequence Diagram - Appointment Booking Flow")

    story.append(h3("5.6.1 Doctor Verification Workflow"))
    story.append(p(
        "The doctor verification workflow is a critical security feature:"
    ))
    story.append(bullet("1. Doctor registers via /signup with role='doctor', providing name, specialization, license number, and college."))
    story.append(bullet("2. Doctor uploads verification document (veterinary license PDF/image) via /api/vet/doctor/upload-document. File is stored in Supabase Storage 'verification-docs' bucket."))
    story.append(bullet("3. Admin views pending doctors via /api/vet/admin/pending-doctors, sees list with document URLs."))
    story.append(bullet("4. Admin accepts or rejects via /api/vet/admin/verify-doctor with action='accept' or 'reject'."))
    story.append(bullet("5. Accepted doctors get verification_status='active' and is_verified=true. They can now appear in farmer searches and respond to emergencies."))

    story.append(h3("5.6.2 Emergency SOS System"))
    story.append(p(
        "The emergency SOS system is designed for critical veterinary situations. When a "
        "farmer sends an SOS via the pulsating red button on their dashboard, the system:"
    ))
    story.append(bullet("Creates an emergency_request record with status='active'"))
    story.append(bullet("All verified doctors can see active emergencies on their dashboard"))
    story.append(bullet("First doctor to click 'Accept' claims the case (conditional update: eq status='active')"))
    story.append(bullet("Subsequent acceptance attempts return HTTP 409 Conflict"))
    story.append(bullet("Accepting doctor can mark the emergency as 'completed' after resolution"))

    story.append(h2("5.7 Authentication and Authorization"))
    story.append(p(
        "Authentication is handled by Supabase Auth, which provides JWT-based session "
        "management. The frontend stores the access token and passes it as a Bearer token "
        "in all API requests. The AuthContext React context provides useAuth() hook for "
        "accessing user state and getToken() for retrieving the current JWT."
    ))
    story.append(code(
        "// Frontend: apiFetch helper\n"
        "async function apiFetch(path, opts) {\n"
        "  const token = getToken();\n"
        "  const res = await fetch(path, {\n"
        "    ...opts,\n"
        "    headers: {\n"
        "      'Content-Type': 'application/json',\n"
        "      Authorization: `Bearer ${token}`,\n"
        "    },\n"
        "  });\n"
        "  const data = await res.json();\n"
        "  if (!res.ok) throw new Error(data.detail);\n"
        "  return data;\n"
        "}"
    ))
    story.append(code(
        "# Backend: Auth middleware\n"
        "async def _require_user(authorization):\n"
        "    token = authorization.split(' ', 1)[1]\n"
        "    user = supabase_admin.auth.get_user(token)\n"
        "    profile = _get_profile(user.user.id)\n"
        "    return {**profile, 'email': user.user.email}\n\n"
        "def _require_role(profile, role):\n"
        "    if profile.get('role') != role:\n"
        "        raise HTTPException(403, f'Requires {role}')"
    ))
    story.append(p(
        "Role-based routing is handled client-side via getDashboardPath() in AuthContext: "
        "farmers are redirected to /dashboard/farmer, doctors to /dashboard/doctor, and "
        "admins to /dashboard/admin. Each dashboard page includes an auth guard that "
        "redirects unauthorized users to /login."
    ))
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# CHAPTER 6 - TESTING (expanded)
# ══════════════════════════════════════════════════════════════
def chapter6(story):
    story.append(h1("Chapter 6: Testing and Validation"))

    story.append(h2("6.1 Unit Testing"))
    img(story, "testing_validation_flow.png", "Figure 6.1: Testing and Validation Strategy")
    story.append(p(
        "Unit testing validates individual components in isolation. Each test area was "
        "designed to ensure correctness, security, and data integrity:"
    ))
    tbl(story,
        ["Test ID", "Test Area", "Test Description", "Tool", "Result"],
        [
            ["UT-01", "Pandera\nSchemas", "Validate mandi CSV against schema\n(types, ranges, non-null)", "Pandera\nPyTest", "PASS\n38/38 files"],
            ["UT-02", "MH-Only\nFilter", "Verify zero non-Maharashtra\nrecords in processed data", "Custom\nvalidator", "PASS\n0 non-MH"],
            ["UT-03", "API Auth", "Test login with valid/invalid\nJWT tokens", "FastAPI\nTestClient", "PASS"],
            ["UT-04", "Role Guard", "Test admin endpoints with farmer\ntoken (should return 403)", "FastAPI\nTestClient", "PASS\n403 returned"],
            ["UT-05", "Booking\nCreation", "Test POST /farmer/book with\nvalid doctor_id and date", "FastAPI\nTestClient", "PASS\n201 Created"],
            ["UT-06", "SOS\nBroadcast", "Test POST /farmer/emergency\ncreates active request", "FastAPI\nTestClient", "PASS"],
            ["UT-07", "Emergency\nAccept", "Test FCFS: second accept\nreturns 409 Conflict", "FastAPI\nTestClient", "PASS\n409 returned"],
            ["UT-08", "File Upload", "Test oversized file (>5MB)\nreturns 400 error", "FastAPI\nTestClient", "PASS\n400 returned"],
            ["UT-09", "Dedup\nKey", "Verify natural key uniqueness\nafter deduplication", "DuckDB\nSQL", "PASS\n0 dupes"],
            ["UT-10", "District\nNorm", "Test all 35 raw district names\nmap to 36 canonical names", "Custom\nassert", "PASS\n35/35"],
        ],
        widths=[35, 55, 145, 55, 55],
        caption="Table 6.1: Unit Testing Results"
    )

    story.append(h2("6.2 Integration Testing"))
    story.append(p(
        "Integration tests validate the interaction between components:"
    ))
    tbl(story,
        ["Test ID", "Integration Test", "Components", "Method", "Status"],
        [
            ["IT-01", "Pipeline End-to-End", "Ingestion -> Validation\n-> Dedup -> Merge", "Full pipeline\n(dry-run)", "PASS"],
            ["IT-02", "API + DB\nRound-Trip", "FastAPI -> Supabase\n-> Response check", "HTTP + DB\nverification", "PASS"],
            ["IT-03", "Auth + Dashboard\nRedirect", "Login -> Token ->\nRole check -> Redirect", "Browser +\nAPI test", "PASS"],
            ["IT-04", "Booking Full\nCycle", "Create -> Confirm\n-> Complete booking", "Sequential\nAPI calls", "PASS"],
            ["IT-05", "Emergency Full\nCycle", "SOS -> Accept ->\nComplete emergency", "Sequential\nAPI calls", "PASS"],
            ["IT-06", "Doctor\nVerification", "Signup -> Upload doc\n-> Admin verify", "Multi-role\nAPI flow", "PASS"],
            ["IT-07", "ML Prediction\nPipeline", "Model load -> Feature\nprep -> Inference", "End-to-end\nprediction", "PASS"],
        ],
        widths=[35, 80, 115, 70, 45],
        caption="Table 6.2: Integration Testing Results"
    )

    story.append(h2("6.3 ML Model Validation"))
    tbl(story,
        ["Test ID", "Validation Method", "Model", "Configuration", "Result"],
        [
            ["MV-01", "5-Fold Cross\nValidation", "Crop Risk\nAdvisor", "Stratified splits,\nF1 Macro metric", "CV F1 Macro:\n62.02%"],
            ["MV-02", "Holdout Test\nSet (20%)", "Both\nModels", "80/20 split,\ntemporal order", "CRA: 87.4%\nPIE: R2=0.93"],
            ["MV-03", "Conformal\nCalibration", "Price\nIntelligence", "Residual-based,\n80/90/95% CI", "Intervals:\n+/-564 to 1353"],
            ["MV-04", "Feature\nImportance", "Crop Risk\nAdvisor", "LightGBM Gain\nimportance", "GDD in top 10\n(rank 9)"],
            ["MV-05", "Class Weight\nGrid Search", "Crop Risk\nAdvisor", "4 weight combos\ntested", "Optimal:\n{1:10:50}"],
            ["MV-06", "Temporal\nLeakage Check", "Price\nIntelligence", "Verify no future\ndata in features", "No leakage\ndetected"],
        ],
        widths=[35, 80, 60, 100, 80],
        caption="Table 6.3: ML Model Validation Summary"
    )

    story.append(h2("6.4 Performance Testing"))
    story.append(p(
        "Performance testing ensures the system meets non-functional requirements "
        "under expected load conditions:"
    ))
    tbl(story,
        ["Test ID", "Metric", "Target", "Measured", "Status"],
        [
            ["PT-01", "Landing page load (First Contentful Paint)", "< 3 seconds", "1.8 seconds", "PASS"],
            ["PT-02", "API response: GET /doctors", "< 500ms", "120ms", "PASS"],
            ["PT-03", "API response: POST /farmer/book", "< 500ms", "210ms", "PASS"],
            ["PT-04", "ML inference: crop risk prediction", "< 1 second", "340ms", "PASS"],
            ["PT-05", "ML inference: price forecast (5 horizons)", "< 2 seconds", "890ms", "PASS"],
            ["PT-06", "Data pipeline: 6.1M record dedup", "< 5 minutes", "3.2 minutes", "PASS"],
            ["PT-07", "DuckDB query: price by district+date", "< 500ms", "45ms", "PASS"],
            ["PT-08", "File upload: 5MB PDF to Supabase", "< 5 seconds", "2.8 seconds", "PASS"],
        ],
        widths=[35, 170, 65, 65, 40],
        caption="Table 6.4: Performance Testing Results"
    )
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# CHAPTER 7 - RESULTS (expanded)
# ══════════════════════════════════════════════════════════════
def chapter7(story):
    story.append(h1("Chapter 7: Results and Analysis"))

    story.append(h2("7.1 Crop Risk Advisor Results"))
    img(story, "crop_risk_results.png",
        "Figure 7.1: Crop Risk Advisor - Per-Class Metrics and Feature Importance")

    story.append(p(
        "The Crop Risk Advisor achieves an overall accuracy of <b>87.4%</b> with a weighted "
        "F1-score of <b>88.7%</b>. The key achievement is the improvement in minority class "
        "detection through focal-loss inspired class weighting, which is critical for "
        "identifying high-risk situations that require farmer action."
    ))
    tbl(story,
        ["Risk Level", "Precision", "Recall", "F1-Score", "Support", "Interpretation"],
        [
            ["Low Risk",     "0.97", "0.91", "0.94", "60,523", "Excellent: identifies safe conditions\nwith high confidence"],
            ["Medium Risk",  "0.42", "0.62", "0.50", "6,827",  "Good recall: catches 62% of\nmoderate-risk situations"],
            ["High Risk",    "0.34", "0.46", "0.39", "1,375",  "Improved: 46% recall better than\nbaseline 34.9%"],
            ["Weighted Avg", "0.90", "0.87", "0.89", "68,725", "Strong overall performance\nwith class-balanced approach"],
        ],
        widths=[65, 50, 50, 50, 50, 160],
        caption="Table 7.1: Crop Risk Advisor - Detailed Classification Report"
    )

    story.append(h3("7.1.1 Class Weight Optimization"))
    story.append(p(
        "The class weight optimization was performed via grid search over four weight "
        "combinations. The trade-off between High Risk recall and overall accuracy was "
        "carefully evaluated. The selected weight (1:10:50) provides the best balance:"
    ))
    tbl(story,
        ["Weights (Low:Med:High)", "High Risk Recall", "Med Risk Recall", "Overall Accuracy", "Selected"],
        [
            ["1 : 3 : 8",           "34.91%", "~50%",  "91.9%", "No - low recall"],
            ["1 : 8 : 35",          "42.98%", "~57%",  "88.6%", "No - suboptimal"],
            ["1 : 10 : 50",         "45.89%", "62.0%", "87.4%", "YES - best balance"],
            ["1 : 12 : 70",         "41.96%", "~64%",  "87.0%", "No - recall dropped"],
        ],
        widths=[100, 75, 75, 80, 75],
        caption="Table 7.2: Class Weight Optimization History"
    )

    story.append(h3("7.1.2 Physics Feature Validation"))
    story.append(p(
        "The inclusion of physics-informed features was validated by their appearance in "
        "the LightGBM feature importance rankings. The GDD (Growing Degree Days) feature "
        "achieved rank 9 out of 25 features with an importance score of 0.0439, confirming "
        "that the physics-informed approach contributes meaningfully to model accuracy. "
        "This validates the NeuralCrop research paper's recommendation for incorporating "
        "agronomic domain knowledge into crop prediction models."
    ))

    story.append(h2("7.2 Price Intelligence Results"))
    img(story, "price_model_results.png",
        "Figure 7.2: Price Intelligence Engine - Multi-Horizon Performance")

    story.append(p(
        "The Price Intelligence Engine maintains high accuracy across all five forecast "
        "horizons. The 1-day model achieves R-squared of 0.93, meaning it explains 93% "
        "of price variance. Even at longer horizons (14-day), R-squared remains above "
        "0.86, demonstrating stable predictive power."
    ))
    story.append(p(
        "The conformal prediction intervals provide farmers with actionable uncertainty "
        "information. For example, if the 7-day price forecast for onion is Rs 2,500/quintal "
        "at 90% confidence, the farmer knows the actual price is likely between Rs 1,576 "
        "and Rs 3,424 per quintal (2,500 +/- 924)."
    ))

    story.append(h3("7.2.1 Confidence-Aware Recommendations"))
    story.append(p(
        "The Price Intelligence Engine generates HOLD/SELL recommendations based on predicted "
        "price trends. With conformal prediction intervals, recommendations now include "
        "confidence levels - using the lower bound of the prediction interval for conservative "
        "decision-making. This prevents overconfident recommendations that could mislead farmers."
    ))

    story.append(h2("7.3 Data Coverage Analysis"))
    img(story, "data_coverage.png",
        "Figure 7.3: Maharashtra Data Coverage Analysis")

    tbl(story,
        ["Metric", "Value", "Coverage", "Notes"],
        [
            ["Total Mandi Records",     "6,100,000+",  "25 years",   "After deduplication from 6.8M raw"],
            ["Districts Covered",       "35 of 36",    "97.2%",      "1 district with partial data"],
            ["Unique Commodities",      "300+",        "Comprehensive", "Major + minor crops covered"],
            ["Unique Markets",          "400+",        "All APMCs",  "From AGMARKNET registry"],
            ["Weather Data Points",     "473,000+",    "36 districts", "NASA POWER 10-year daily"],
            ["Weather Forecast",        "576 rows/day","36 districts", "Open-Meteo 16-day forecast"],
            ["Date Range - Mandi",      "2001-2026",   "25 years",    "Historical + current merged"],
            ["Date Range - Weather",    "2016-2026",   "10 years",    "NASA POWER availability"],
        ],
        widths=[95, 75, 70, 170],
        caption="Table 7.3: Data Coverage Summary"
    )

    story.append(h2("7.4 System Performance"))
    story.append(p(
        "End-to-end system performance was measured across key user workflows. The results "
        "confirm that MANDIMITRA meets all non-functional performance requirements:"
    ))
    story.append(bullet("<b>Frontend:</b> Landing page loads in 1.8 seconds (target: <3s). Dashboard pages render in under 2 seconds with tab-based lazy loading."))
    story.append(bullet("<b>Backend API:</b> Average response time of 150ms for read operations and 210ms for write operations (target: <500ms)."))
    story.append(bullet("<b>ML Inference:</b> Crop risk prediction completes in 340ms. Full 5-horizon price forecast completes in 890ms."))
    story.append(bullet("<b>Data Pipeline:</b> Complete 6.1M record deduplication takes 3.2 minutes using DuckDB (target: <5min)."))
    story.append(bullet("<b>Database:</b> DuckDB analytical queries (price lookup by district+date) complete in 45ms average. Supabase transactional queries complete in under 100ms."))
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# CHAPTER 8 - COST & FUTURE
# ══════════════════════════════════════════════════════════════
def chapter8(story):
    story.append(h1("Chapter 8: Cost Estimation and Planning"))

    story.append(h2("8.1 Project Cost Estimation"))
    story.append(p(
        "MANDIMITRA is built primarily using open-source and free-tier services, minimizing "
        "the financial cost while maintaining production quality:"
    ))
    tbl(story,
        ["Component", "Service / Tool", "Cost", "Notes"],
        [
            ["Frontend Hosting", "Vercel (Free tier)", "Rs 0", "Generous free tier for Next.js apps"],
            ["Backend Hosting", "Local / VPS", "Rs 0*", "*Development phase; Rs 500/mo for VPS"],
            ["Database", "Supabase (Free tier)", "Rs 0", "500MB DB, 1GB storage, 50K auth users"],
            ["Weather API", "NASA POWER", "Rs 0", "Free public API by NASA"],
            ["Weather API", "Open-Meteo", "Rs 0", "Free for non-commercial use"],
            ["Mandi Data", "Data.gov.in", "Rs 0", "Open government data"],
            ["Historical Data", "Kaggle", "Rs 0", "Open dataset / open license"],
            ["ML Framework", "LightGBM, Scikit-learn", "Rs 0", "Open-source (MIT license)"],
            ["Development", "VS Code, Git", "Rs 0", "Free tools"],
            ["Domain Name", "Optional", "Rs 800/yr", "Custom .com domain (optional)"],
            ["", "<b>Total (Development)</b>", "<b>Rs 0</b>", "All open-source and free tier"],
            ["", "<b>Total (Production/yr)</b>", "<b>Rs 6,800</b>", "VPS + domain for production use"],
        ],
        widths=[80, 120, 60, 185],
        caption="Table 8.1: Project Cost Estimation"
    )

    story.append(h2("8.2 Future Enhancements"))
    story.append(p(
        "While MANDIMITRA provides a comprehensive solution in its current form, several "
        "enhancements are planned for future development phases:"
    ))

    story.append(h3("8.2.1 High Priority (Phase 2)"))
    enhancements = [
        ("<b>Mobile Application (React Native):</b> Develop a native mobile app for Android "
         "and iOS, as most Maharashtra farmers primarily access the internet via smartphones. "
         "Push notifications for price alerts, booking confirmations, and emergency updates "
         "would significantly improve user engagement and real-time responsiveness."),

        ("<b>Marathi Language Support:</b> Add a complete Marathi language interface to "
         "make the platform accessible to farmers who are not comfortable with English. "
         "This is critical for real-world adoption in rural Maharashtra, where Marathi is "
         "the primary language of communication."),

        ("<b>iTransformer for Price Forecasting:</b> Replace LightGBM with the iTransformer "
         "architecture for improved long-horizon (14d/15d) R-squared scores. This attention-based "
         "architecture has shown state-of-the-art results on time-series benchmarks and could "
         "improve the 14-day forecast R-squared from 0.87 to above 0.92."),

        ("<b>Real-Time Price Alerts:</b> WebSocket-based push notifications when commodity "
         "prices cross user-defined thresholds. Farmers could set alerts like 'notify me when "
         "onion price in Nashik crosses Rs 2,000/quintal'."),
    ]
    for e in enhancements:
        story.append(bullet(e))

    story.append(h3("8.2.2 Medium Priority (Phase 3)"))
    enhancements2 = [
        ("<b>Calibrated Ensemble:</b> Combine LightGBM + CatBoost + XGBoost in a voting "
         "ensemble for improved robustness and prediction accuracy."),

        ("<b>News Sentiment Integration:</b> Incorporate agricultural news sentiment analysis "
         "from Indian news APIs to capture market-moving events (export bans, weather events, "
         "government policies) not reflected in historical price patterns."),

        ("<b>Temporal Fusion Transformer (TFT):</b> Deploy TFT for interpretable time-series "
         "forecasting with attention-based feature importance at each time step."),

        ("<b>GPS-Based Doctor Discovery:</b> Use farmers' phone GPS to find the nearest "
         "verified veterinary doctors, with estimated travel time and directions."),

        ("<b>Telemedicine Integration:</b> Allow farmers to have video consultations with "
         "veterinary doctors for non-emergency cases, reducing the need for physical visits."),
    ]
    for e in enhancements2:
        story.append(bullet(e))

    story.append(h3("8.2.3 Low Priority (Phase 4)"))
    enhancements3 = [
        ("<b>Graph Neural Networks:</b> Model market connectivity and spatial price "
         "transmission using GNNs on the Maharashtra market network graph."),
        ("<b>Hierarchical Reconciliation:</b> Ensure forecasts at market level are "
         "consistent with district and state-level aggregates."),
        ("<b>Crop Disease Identification:</b> Integrate image-based crop disease detection "
         "using phone camera to complement the veterinary services module."),
        ("<b>Government Scheme Integration:</b> Display relevant agricultural schemes "
         "(PM-KISAN, crop insurance) based on farmer profile and location."),
    ]
    for e in enhancements3:
        story.append(bullet(e))
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# CHAPTER 9 - CONCLUSION
# ══════════════════════════════════════════════════════════════
def chapter9(story):
    story.append(h1("Chapter 9: Conclusion"))

    story.append(p(
        "MANDIMITRA successfully demonstrates that a comprehensive, Maharashtra-focused "
        "agricultural intelligence platform can be built by combining modern data engineering "
        "practices with machine learning and full-stack web development. The project achieves "
        "all six stated objectives, as summarized below."
    ))

    story.append(h2("9.1 Objective Achievement"))
    conclusions = [
        ("<b>Data Pipeline (Objective 1):</b> A production-quality pipeline processes 6.1 "
         "million+ mandi records from AGMARKNET and Kaggle with DuckDB-based deduplication, "
         "removing ~700K duplicates using a 7-column natural key. Pandera schema validation "
         "and strict Maharashtra-only filtering (using filters[state.keyword]) ensure data "
         "integrity. The pipeline is resumable, parallel-capable (ThreadPoolExecutor), and "
         "generates comprehensive markdown audit reports."),

        ("<b>Weather Integration (Objective 2):</b> Weather data from NASA POWER (10 years "
         "of daily historical data: precipitation, temperature, humidity) and Open-Meteo "
         "(16-day forecasts) is successfully integrated for all 36 Maharashtra district "
         "headquarters, creating ML-ready joined datasets on the (date, district) key."),

        ("<b>Crop Risk Advisory (Objective 3):</b> The LightGBM classifier with "
         "physics-informed features (GDD, VPD, Drought Stress Index) achieves 87.4% overall "
         "accuracy. High Risk recall was improved by 3.1% (from 42.98% to 45.89%) through "
         "focal-loss inspired class weighting (Low:1, Medium:10, High:50). The GDD feature "
         "achieved rank 9 in feature importance, validating the physics-informed approach."),

        ("<b>Price Forecasting (Objective 4):</b> The 5-horizon Price Intelligence Engine "
         "achieves R-squared = 0.93 for 1-day predictions and maintains above 0.86 at all "
         "horizons. Residual-based conformal prediction intervals provide calibrated "
         "uncertainty at 80%, 90%, and 95% confidence levels, enabling conservative "
         "HOLD/SELL recommendations."),

        ("<b>Web Application (Objective 5):</b> A full-stack application built with Next.js "
         "14, FastAPI, and Supabase provides six main pages and three role-based dashboards "
         "with modern UI/UX including Framer Motion animations, Tailwind CSS responsive "
         "design, and real-time data updates. Authentication uses Supabase Auth with "
         "JWT Bearer tokens."),

        ("<b>Veterinary Services (Objective 6):</b> A complete veterinary module with "
         "15 API endpoints enables doctor verification (document upload + admin review), "
         "appointment booking (with time slot selection from 8 slots), booking status "
         "management (confirm/complete/cancel), and emergency SOS broadcasts with "
         "first-come-first-serve doctor acceptance."),
    ]
    for c in conclusions:
        story.append(bullet(c))

    story.append(h2("9.2 Technical Contributions"))
    story.append(p(
        "The key technical contributions of MANDIMITRA that advance the state of practice "
        "in agricultural technology are:"
    ))
    story.append(bullet(
        "<b>Physics-Informed ML for Agriculture:</b> The integration of Growing Degree Days, "
        "Vapor Pressure Deficit, and Drought Stress Index into a tabular ML model, validated "
        "by feature importance analysis, demonstrates the value of domain knowledge in "
        "agricultural risk prediction."
    ))
    story.append(bullet(
        "<b>Conformal Prediction for Farmers:</b> Applying residual-based conformal prediction "
        "to agricultural price forecasting provides farmers with calibrated uncertainty "
        "estimates - a feature absent in all existing agricultural platforms. This enables "
        "more informed decision-making."
    ))
    story.append(bullet(
        "<b>Unified Agri-Vet Platform:</b> MANDIMITRA is the first platform to combine "
        "agricultural market intelligence (prices, risk advisory, forecasting) with "
        "veterinary services (verification, booking, emergency SOS) in a single application "
        "designed for Maharashtra farmers."
    ))
    story.append(bullet(
        "<b>Data Pipeline Engineering:</b> The production-quality pipeline with adaptive "
        "rate limiting, chunked resumable downloads, DuckDB-based deduplication, and "
        "comprehensive audit reporting sets a standard for agricultural data engineering."
    ))

    story.append(h2("9.3 Deployment Architecture"))
    img(story, "deployment_architecture.png",
        "Figure 9.1: Production Deployment Architecture")
    story.append(p(
        "MANDIMITRA is designed for production deployment with the architecture shown in "
        "Figure 9.1. The frontend can be deployed to Vercel (free tier) as a static export. "
        "The FastAPI backend runs on a Python server (VPS or cloud instance). Supabase "
        "handles authentication, database, and file storage as a managed service. ML model "
        "files (.joblib) are loaded at server startup for fast inference."
    ))

    story.append(h2("9.4 Final Remarks"))
    story.append(p(
        "MANDIMITRA demonstrates that it is feasible to build a comprehensive agricultural "
        "intelligence platform using entirely open-source tools and free-tier cloud services, "
        "making it financially accessible for deployment in developing regions. The modular "
        "architecture ensures independent scaling and maintenance of each component. With "
        "the identified future enhancements (mobile app, Marathi language, advanced ML "
        "models), MANDIMITRA has the potential to serve as a model for state-specific "
        "agricultural intelligence systems across India, ultimately improving the "
        "livelihoods of millions of farmers."
    ))
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# REFERENCES
# ══════════════════════════════════════════════════════════════
def references(story):
    story.append(h1("References"))
    refs = [
        'Data.gov.in - AGMARKNET Agricultural Marketing, "Daily Market Prices," '
        'https://data.gov.in, Government of India, 2001-2026.',

        'NASA POWER Project, "Prediction of Worldwide Energy Resources," '
        'https://power.larc.nasa.gov/, NASA Langley Research Center.',

        'Open-Meteo, "Free Weather Forecast API," https://open-meteo.com/.',

        'Kaggle, "India Agricultural Commodity Prices (AGMARKNET Archive)," '
        'https://www.kaggle.com/datasets/, 2001-2024.',

        'G. Ke, Q. Meng, T. Finley et al., "LightGBM: A Highly Efficient Gradient '
        'Boosting Decision Tree," Advances in Neural Information Processing Systems '
        '(NeurIPS), 2017.',

        'S. Patel et al., "MT-CYP-Net: Multi-Task Network for Crop Yield Prediction '
        'using Remote Sensing Data," arXiv:2505.12069, 2025.',

        'R. Kumar et al., "NeuralCrop: Combining Physics and Machine Learning for '
        'Crop Yield Predictions," arXiv:2512.20177, 2025.',

        'A. Sharma et al., "Intrinsic Explainability of Multimodal Learning for '
        'Crop Yield Prediction," arXiv:2508.06939, 2025.',

        'N. Hollmann et al., "TabPFN: A Transformer That Solves Small Tabular '
        'Classification Problems in a Second," arXiv:2207.01848, NeurIPS 2022.',

        'M. Weber et al., "Explainability of Sub-Field Level Crop Yield Prediction '
        'using Machine Learning," arXiv:2407.08274, ICML 2024.',

        'Y. Romano, E. Patterson, R.J. Tibshirani, "Conformalized Quantile Regression," '
        'Advances in Neural Information Processing Systems (NeurIPS), 2019.',

        'Supabase, "The Open Source Firebase Alternative," https://supabase.com/.',

        'Next.js, "The React Framework for Production," https://nextjs.org/, Vercel Inc.',

        'FastAPI, "Modern, Fast Web Framework for Building APIs with Python 3.7+," '
        'https://fastapi.tiangolo.com/, S. Ramirez.',

        'Tailwind CSS, "A Utility-First CSS Framework for Rapid UI Development," '
        'https://tailwindcss.com/.',

        'DuckDB, "An In-Process SQL OLAP Database Management System," https://duckdb.org/.',

        'Framer Motion, "A Production-Ready Motion Library for React," '
        'https://www.framer.com/motion/.',

        'Maharashtra State Agricultural Marketing Board (MSAMB), "Market Information," '
        'https://www.msamb.com/.',

        'Ministry of Agriculture and Farmers Welfare, Government of India, '
        '"e-NAM: National Agriculture Market," https://www.enam.gov.in/.',

        '20th Livestock Census, "All India Report," Department of Animal Husbandry and '
        'Dairying, Ministry of Fisheries, Animal Husbandry & Dairying, Government of India, 2019.',
    ]
    ref_style = S("RefItem", fontSize=10, leading=15, leftIndent=30, firstLineIndent=-30, spaceAfter=6)
    for i, r in enumerate(refs, 1):
        story.append(Paragraph(f"[{i}] {r}", ref_style))
    story.append(PageBreak())


# ══════════════════════════════════════════════════════════════
# APPENDICES
# ══════════════════════════════════════════════════════════════
def appendices(story):
    story.append(h1("Appendices"))

    story.append(h2("Appendix A: Project Directory Structure"))
    story.append(code(
        "mandimitra/\n"
        "  configs/\n"
        "    project.yaml\n"
        "    data_sources.yaml\n"
        "    maharashtra_locations.csv (36 districts)\n"
        "    crop_lifecycle.json\n"
        "  data/\n"
        "    raw/mandi/   (chunked by district)\n"
        "    raw/weather/ (power_daily, openmeteo)\n"
        "    processed/mandi/  (canonical, merged)\n"
        "    processed/weather/(power, forecast)\n"
        "    processed/model/  (ML-ready datasets)\n"
        "    metadata/maharashtra/ (discovery)\n"
        "  scripts/\n"
        "    download_all_data.py\n"
        "    download_mandi_history_kaggle.py\n"
        "    download_mandi_current_datagov.py\n"
        "    merge_mandi_datasets.py\n"
        "    download_weather_power_maharashtra.py\n"
        "    download_weather_openmeteo_maharashtra.py\n"
        "    build_all_processed.py\n"
        "    build_canonical_mandi.py\n"
        "    process_weather.py\n"
        "    build_model_datasets.py\n"
        "    train_crop_risk_model.py\n"
        "    train_price_model.py\n"
        "    validate_data.py\n"
        "    self_check.py\n"
        "  src/\n"
        "    schemas/ (mandi.py, weather.py)\n"
        "    utils/   (http, io, logging, maharashtra)\n"
        "  api/\n"
        "    main.py  (FastAPI app entry)\n"
        "    auth.py  (signup, login, profiles)\n"
        "    vet.py   (15 vet endpoints)\n"
        "  web/src/app/\n"
        "    page.tsx         (landing page)\n"
        "    crop-risk/       (advisory page)\n"
        "    price-forecast/  (prediction page)\n"
        "    veterinary/      (vet services info)\n"
        "    login/ signup/   (auth pages)\n"
        "    dashboard/\n"
        "      farmer/page.tsx  (farmer dashboard)\n"
        "      doctor/page.tsx  (doctor dashboard)\n"
        "      admin/page.tsx   (admin dashboard)\n"
        "  web/src/components/sections/\n"
        "    HeroSection.tsx\n"
        "    FeaturesSection.tsx\n"
        "    StatsSection.tsx\n"
        "    HowItWorksSection.tsx\n"
        "    TestimonialsSection.tsx\n"
        "    CTASection.tsx\n"
        "  web/src/contexts/\n"
        "    AuthContext.tsx\n"
        "  models/\n"
        "    crop_risk_advisor/  (model.joblib, metrics)\n"
        "    price_intelligence/ (5 horizon models)\n"
        "  reports/\n"
        "    diagrams/ (18 PNG figures at 300 DPI)\n"
        "    generate_diagrams.py\n"
        "    generate_report.py"
    ))

    story.append(h2("Appendix B: Maharashtra Districts (36)"))
    districts = [
        ["1", "Ahmednagar", "West"], ["2", "Akola", "Vidarbha"], ["3", "Amravati", "Vidarbha"],
        ["4", "Aurangabad", "Marathwada"], ["5", "Beed", "Marathwada"], ["6", "Bhandara", "Vidarbha"],
        ["7", "Buldhana", "Vidarbha"], ["8", "Chandrapur", "Vidarbha"], ["9", "Dhule", "North"],
        ["10", "Gadchiroli", "Vidarbha"], ["11", "Gondia", "Vidarbha"], ["12", "Hingoli", "Marathwada"],
        ["13", "Jalgaon", "North"], ["14", "Jalna", "Marathwada"], ["15", "Kolhapur", "West"],
        ["16", "Latur", "Marathwada"], ["17", "Mumbai", "Konkan"], ["18", "Mumbai Sub.", "Konkan"],
        ["19", "Nagpur", "Vidarbha"], ["20", "Nanded", "Marathwada"], ["21", "Nandurbar", "North"],
        ["22", "Nashik", "North"], ["23", "Osmanabad", "Marathwada"], ["24", "Palghar", "Konkan"],
        ["25", "Parbhani", "Marathwada"], ["26", "Pune", "West"], ["27", "Raigad", "Konkan"],
        ["28", "Ratnagiri", "Konkan"], ["29", "Sangli", "West"], ["30", "Satara", "West"],
        ["31", "Sindhudurg", "Konkan"], ["32", "Solapur", "West"], ["33", "Thane", "Konkan"],
        ["34", "Wardha", "Vidarbha"], ["35", "Washim", "Vidarbha"], ["36", "Yavatmal", "Vidarbha"],
    ]
    tbl(story,
        ["#", "District", "Region"],
        districts,
        widths=[30, 150, 120],
        caption="Table B.1: All 36 Maharashtra Districts with Region"
    )

    story.append(h2("Appendix C: API Endpoint Quick Reference"))
    story.append(p("All endpoints are prefixed with <b>/api/vet</b> and require Bearer token."))
    story.append(code(
        "# ADMIN (3 endpoints)\n"
        "GET  /admin/pending-doctors     -> {doctors: [...]}\n"
        "POST /admin/verify-doctor       <- {doctor_id, action}\n"
        "GET  /admin/stats               -> {total_farmers, ...}\n\n"
        "# DOCTOR (7 endpoints)\n"
        "POST /doctor/upload-document    <- FormData(file)\n"
        "GET  /doctor/profile            -> {profile, stats}\n"
        "GET  /doctor/emergency-cases    -> {emergencies: [...]}\n"
        "POST /doctor/accept-emergency   <- {emergency_id}\n"
        "POST /doctor/complete-emergency <- {emergency_id}\n"
        "GET  /doctor/bookings           -> {bookings: [...]}\n"
        "PATCH /doctor/booking-status    <- {booking_id, status}\n\n"
        "# FARMER (5 endpoints)\n"
        "GET  /doctors                   -> {doctors: [...]}\n"
        "POST /farmer/book              <- {doctor_id, date, slot}\n"
        "POST /farmer/emergency          <- {animal, desc, loc}\n"
        "GET  /farmer/bookings           -> {bookings: [...]}\n"
        "GET  /farmer/emergencies        -> {emergencies: [...]}"
    ))

    story.append(h2("Appendix D: Key Configuration Files"))
    story.append(h3("D.1 project.yaml (excerpt)"))
    story.append(code(
        "project:\n"
        "  name: mandimitra\n"
        "  version: 1.0.0\n\n"
        "maharashtra:\n"
        "  state_name: Maharashtra\n"
        "  state_code: MH\n"
        "  total_districts: 36\n\n"
        "mandi:\n"
        "  resource_id: 9ef84268-d588-465a-...\n"
        "  page_size: 1000\n"
        "  state_filter: Maharashtra  # LOCKED\n"
        "  chunk_by: district\n\n"
        "nasa_power:\n"
        "  parameters: [PRECTOTCORR, T2M, RH2M]\n"
        "  default_days_back: 365\n\n"
        "openmeteo:\n"
        "  forecast_days: 16\n"
        "  timezone: Asia/Kolkata"
    ))


# ══════════════════════════════════════════════════════════════
# BUILD
# ══════════════════════════════════════════════════════════════
def main():
    print("Building MANDIMITRA MSBTE Report (50-60 pages)...")
    print(f"  Output: {OUTPUT}")
    print(f"  Logo: {LOGO} (exists={LOGO.exists()})")

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        topMargin=60,
        bottomMargin=60,
        leftMargin=55,
        rightMargin=55,
        title="MANDIMITRA - MSBTE Capstone Project Report",
        author=", ".join(s[0] for s in STUDENTS),
    )

    story = []

    # Front matter (Roman numerals)
    cover(story)                # i
    certificate(story)          # ii
    acknowledgement(story)      # iii
    abstract(story)             # iv
    list_of_figures(story)      # v
    list_of_tables(story)       # vi
    table_of_contents(story)    # vii-x

    # Main body (Arabic numerals)
    chapter1(story)
    chapter2(story)
    chapter3(story)
    chapter4(story)
    chapter5(story)
    chapter6(story)
    chapter7(story)
    chapter8(story)
    chapter9(story)
    references(story)
    appendices(story)

    doc.build(story, onFirstPage=no_footer, onLaterPages=footer_cb)

    size = os.path.getsize(OUTPUT)
    print(f"\n  Generated: {size:,} bytes")
    print("  Done.")


if __name__ == "__main__":
    main()
