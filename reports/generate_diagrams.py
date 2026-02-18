#!/usr/bin/env python3
"""
MANDIMITRA — Optimal Diagram Generator
========================================
Generates 18 high-quality, publication-ready diagrams at 300 DPI
for the MSBTE Capstone Project Report.

All diagrams use a consistent professional colour palette,
clean layout, proper labels, and clear visual hierarchy.
"""

import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe
import numpy as np

OUT = os.path.join(os.path.dirname(__file__), "diagrams")
os.makedirs(OUT, exist_ok=True)

# ─── Global style ───────────────────────────────────────────────────
plt.rcParams.update({
    "font.family": "sans-serif",
    "font.sans-serif": ["Segoe UI", "Arial", "Helvetica", "DejaVu Sans"],
    "font.size": 11,
    "axes.titlesize": 14,
    "axes.titleweight": "bold",
    "figure.dpi": 300,
    "savefig.dpi": 300,
    "savefig.bbox": "tight",
    "savefig.pad_inches": 0.3,
})

# Colour palette
C = {
    "primary":   "#1B5E20",  # dark green
    "secondary": "#0D47A1",  # dark blue
    "accent":    "#E65100",  # deep orange
    "bg":        "#FAFAFA",
    "card":      "#FFFFFF",
    "border":    "#BDBDBD",
    "text":      "#212121",
    "muted":     "#757575",
    "success":   "#2E7D32",
    "warning":   "#F57F17",
    "danger":    "#C62828",
    "info":      "#1565C0",
    "light_green": "#C8E6C9",
    "light_blue":  "#BBDEFB",
    "light_orange":"#FFE0B2",
    "light_red":   "#FFCDD2",
    "light_purple":"#E1BEE7",
    "light_teal":  "#B2DFDB",
}

LAYER_COLORS = ["#E8F5E9", "#E3F2FD", "#FFF3E0", "#FCE4EC", "#F3E5F5", "#E0F2F1"]


def _save(fig, name):
    path = os.path.join(OUT, f"{name}.png")
    fig.savefig(path, facecolor=fig.get_facecolor())
    plt.close(fig)
    print(f"  OK {name}.png")


# ────────────────────────────────────────────────────────────────────
# Helper: draw a rounded-rect box with text
# ────────────────────────────────────────────────────────────────────
def _box(ax, x, y, w, h, text, fc, ec="#333333", fontsize=9, bold=False, text_color="#212121"):
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle="round,pad=0.02",
                         facecolor=fc, edgecolor=ec, linewidth=1.2)
    ax.add_patch(box)
    weight = "bold" if bold else "normal"
    ax.text(x + w/2, y + h/2, text,
            ha="center", va="center", fontsize=fontsize,
            fontweight=weight, color=text_color, wrap=True)


def _arrow(ax, x1, y1, x2, y2, color="#333333"):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color=color, lw=1.5))


# ════════════════════════════════════════════════════════════════════
# 1. System Architecture (3-tier)
# ════════════════════════════════════════════════════════════════════
def diagram_system_architecture():
    fig, ax = plt.subplots(figsize=(12, 8))
    fig.set_facecolor(C["bg"])
    ax.set_xlim(0, 12); ax.set_ylim(0, 8)
    ax.axis("off")
    ax.set_title("System Architecture — MANDIMITRA", pad=20, fontsize=16, color=C["primary"])

    # Tier labels
    tiers = [
        (0.3, 6.8, "PRESENTATION LAYER", LAYER_COLORS[0]),
        (0.3, 4.5, "APPLICATION LAYER", LAYER_COLORS[1]),
        (0.3, 2.2, "DATA LAYER", LAYER_COLORS[2]),
        (0.3, 0.2, "EXTERNAL SERVICES", LAYER_COLORS[3]),
    ]
    for tx, ty, label, bg in tiers:
        rect = FancyBboxPatch((tx, ty), 11.4, 1.8, boxstyle="round,pad=0.05",
                              facecolor=bg, edgecolor=C["border"], linewidth=0.8, alpha=0.7)
        ax.add_patch(rect)
        ax.text(0.6, ty+1.6, label, fontsize=8, fontweight="bold", color=C["muted"], va="top")

    # Presentation Layer
    pres = [("Next.js\nFrontend", 1.5), ("Farmer\nDashboard", 4), ("Doctor\nDashboard", 6.5), ("Admin\nPanel", 9)]
    for label, px in pres:
        _box(ax, px, 7.0, 1.8, 1.2, label, C["light_green"], ec=C["success"], fontsize=9, bold=True)

    # Application Layer
    apps = [("FastAPI\nBackend", 1.2), ("Auth\nService", 3.8), ("Vet Service\nModule", 6), ("ML Prediction\nEngine", 8.5)]
    for label, px in apps:
        _box(ax, px, 4.7, 1.8, 1.2, label, C["light_blue"], ec=C["info"], fontsize=9, bold=True)

    # Data Layer
    data = [("Supabase\nPostgreSQL", 1.5), ("Supabase\nAuth", 4), ("Supabase\nStorage", 6.5), ("DuckDB\n(Analytics)", 9)]
    for label, px in data:
        _box(ax, px, 2.4, 1.8, 1.2, label, C["light_orange"], ec=C["accent"], fontsize=9, bold=True)

    # External
    ext = [("Data.gov.in\nAGMARKNET", 1.5), ("NASA\nPOWER", 4), ("Open-Meteo\nWeather", 6.5), ("Kaggle\nHistorical", 9)]
    for label, px in ext:
        _box(ax, px, 0.4, 1.8, 1.2, label, C["light_red"], ec=C["danger"], fontsize=9, bold=True)

    # Arrows between tiers
    for x in [2.4, 4.9, 7.4, 9.9]:
        _arrow(ax, x, 7.0, x, 6.05)
        _arrow(ax, x, 4.7, x, 3.75)
        _arrow(ax, x, 2.4, x, 1.75)

    _save(fig, "system_architecture")


# ════════════════════════════════════════════════════════════════════
# 2. Data Flow Diagram (DFD Level 0)
# ════════════════════════════════════════════════════════════════════
def diagram_dfd_level0():
    fig, ax = plt.subplots(figsize=(12, 7))
    fig.set_facecolor(C["bg"])
    ax.set_xlim(0, 12); ax.set_ylim(0, 7)
    ax.axis("off")
    ax.set_title("Data Flow Diagram — Level 0", pad=20, fontsize=16, color=C["primary"])

    # Central system
    circle = plt.Circle((6, 3.5), 1.2, facecolor=C["light_green"], edgecolor=C["primary"], linewidth=2.5)
    ax.add_patch(circle)
    ax.text(6, 3.5, "MANDIMITRA\nSystem", ha="center", va="center", fontsize=11, fontweight="bold", color=C["primary"])

    # External entities
    entities = [
        (1.5, 6, "Farmer"),
        (10.5, 6, "Veterinary\nDoctor"),
        (1.5, 1, "Data.gov.in\n(AGMARKNET)"),
        (6, 0.5, "NASA POWER\n& Open-Meteo"),
        (10.5, 1, "Admin"),
    ]
    for ex, ey, label in entities:
        _box(ax, ex-0.9, ey-0.4, 1.8, 0.8, label, "#E8EAF6", ec="#3F51B5", fontsize=9, bold=True)

    # Data stores
    stores = [(3, 3.5, "D1: Mandi Prices"), (9, 3.5, "D2: Weather Data")]
    for sx, sy, label in stores:
        ax.plot([sx-1, sx+1], [sy+0.3, sy+0.3], color=C["border"], lw=1.5)
        ax.plot([sx-1, sx+1], [sy-0.3, sy-0.3], color=C["border"], lw=1.5)
        ax.plot([sx-1, sx-1], [sy-0.3, sy+0.3], color=C["border"], lw=1.5)
        ax.text(sx, sy, label, ha="center", va="center", fontsize=8, color=C["text"])

    # Flows with labels
    flows = [
        (1.5, 5.6, 5, 4.5, "Browse Prices\n& Book Doctor"),
        (7, 4.5, 10.5, 5.6, "Accept Bookings\n& Emergencies"),
        (1.5, 1.4, 4.8, 3.0, "Commodity\nPrices"),
        (6, 1.3, 6, 2.3, "Weather\nForecasts"),
        (10.5, 1.4, 7.2, 3.0, "Verify\nDoctors"),
    ]
    for x1, y1, x2, y2, label in flows:
        _arrow(ax, x1, y1, x2, y2, color=C["secondary"])
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my+0.25, label, ha="center", va="center", fontsize=7, color=C["muted"],
                bbox=dict(boxstyle="round,pad=0.2", facecolor="white", edgecolor="none", alpha=0.8))

    _save(fig, "dfd_level0")


# ════════════════════════════════════════════════════════════════════
# 3. Use Case Diagram
# ════════════════════════════════════════════════════════════════════
def diagram_use_cases():
    fig, ax = plt.subplots(figsize=(12, 9))
    fig.set_facecolor(C["bg"])
    ax.set_xlim(0, 12); ax.set_ylim(0, 9)
    ax.axis("off")
    ax.set_title("Use Case Diagram — MANDIMITRA", pad=20, fontsize=16, color=C["primary"])

    # System boundary
    rect = FancyBboxPatch((2.5, 0.5), 7, 8, boxstyle="round,pad=0.1",
                          facecolor="#F5F5F5", edgecolor=C["primary"], linewidth=2, linestyle="--")
    ax.add_patch(rect)
    ax.text(6, 8.2, "MANDIMITRA System", ha="center", fontsize=12, fontweight="bold", color=C["primary"])

    # Actors
    actors = [(0.8, 5.5, "[Farmer]"), (11.2, 5.5, "[Doctor]"), (11.2, 1.5, "[Admin]")]
    for ax_, ay, label in actors:
        _box(ax, ax_-0.6, ay-0.35, 1.2, 0.7, label, "#E8EAF6", ec="#3F51B5", fontsize=9, bold=True)

    # Use cases (ovals)
    farmer_uc = [
        (5, 7.5, "View Mandi Prices"),
        (5, 6.5, "Get Crop Risk Advisory"),
        (5, 5.5, "Get Price Forecast"),
        (5, 4.5, "Browse Verified Doctors"),
        (5, 3.5, "Book Appointment"),
        (5, 2.5, "Send Emergency SOS"),
    ]
    doctor_uc = [
        (8, 7.0, "Upload Verification\nDocument"),
        (8, 6.0, "View Bookings"),
        (8, 5.0, "Accept Emergency"),
        (8, 4.0, "Complete Case"),
    ]
    admin_uc = [
        (8, 2.5, "Verify Doctors"),
        (8, 1.5, "View Dashboard Stats"),
    ]

    def draw_uc(cx, cy, label, color):
        ellipse = matplotlib.patches.Ellipse((cx, cy), 2.8, 0.7,
                                              facecolor=color, edgecolor=C["text"], linewidth=1)
        ax.add_patch(ellipse)
        ax.text(cx, cy, label, ha="center", va="center", fontsize=7.5, fontweight="bold")

    for cx, cy, label in farmer_uc:
        draw_uc(cx, cy, label, C["light_green"])
        ax.plot([1.5, cx-1.4], [5.5, cy], color=C["muted"], lw=0.8)

    for cx, cy, label in doctor_uc:
        draw_uc(cx, cy, label, C["light_blue"])
        ax.plot([10.5, cx+1.4], [5.5, cy], color=C["muted"], lw=0.8)

    for cx, cy, label in admin_uc:
        draw_uc(cx, cy, label, C["light_orange"])
        ax.plot([10.5, cx+1.4], [1.5, cy], color=C["muted"], lw=0.8)

    _save(fig, "use_cases")


# ════════════════════════════════════════════════════════════════════
# 4. Data Pipeline Flowchart
# ════════════════════════════════════════════════════════════════════
def diagram_pipeline_flowchart():
    fig, ax = plt.subplots(figsize=(14, 6))
    fig.set_facecolor(C["bg"])
    ax.set_xlim(0, 14); ax.set_ylim(0, 6)
    ax.axis("off")
    ax.set_title("Data Pipeline — End-to-End Flow", pad=20, fontsize=16, color=C["primary"])

    stages = [
        ("Data\nIngestion", C["light_blue"], "Kaggle · AGMARKNET\nNASA · Open-Meteo"),
        ("Validation\n& Cleaning", C["light_green"], "Pandera Schemas\nMH-Only Filter"),
        ("Deduplication\n& Merge", C["light_orange"], "DuckDB SQL\nUpsert Strategy"),
        ("Feature\nEngineering", C["light_purple"], "GDD · VPD\nDrought Index"),
        ("Model\nTraining", C["light_teal"], "LightGBM\nConformal Pred."),
        ("Serving\n& API", C["light_red"], "FastAPI\nNext.js Frontend"),
    ]

    for i, (title, bg, desc) in enumerate(stages):
        x = 0.5 + i * 2.25
        # Stage box
        _box(ax, x, 2.5, 1.8, 2.0, "", bg, ec=C["border"], fontsize=9)
        ax.text(x + 0.9, 4.0, title, ha="center", va="center", fontsize=10, fontweight="bold", color=C["text"])
        ax.text(x + 0.9, 3.0, desc, ha="center", va="center", fontsize=7.5, color=C["muted"])

        # Stage number
        circle = plt.Circle((x + 0.9, 5.0), 0.3, facecolor=C["primary"], edgecolor="white", linewidth=2)
        ax.add_patch(circle)
        ax.text(x + 0.9, 5.0, str(i+1), ha="center", va="center", fontsize=11, fontweight="bold", color="white")

        # Arrow to next
        if i < len(stages) - 1:
            _arrow(ax, x + 2.3, 3.5, x + 2.45, 3.5, color=C["primary"])

    # Bottom row: outputs
    outputs = [
        (1.4, 1.2, "6.1M Records"),
        (3.65, 1.2, "Clean Parquet"),
        (5.9, 1.2, "Canonical\nDataset"),
        (8.15, 1.2, "Physics\nFeatures"),
        (10.4, 1.2, "87.4% Acc\nR²=0.93"),
        (12.65, 1.2, "REST API\n+ Dashboard"),
    ]
    for ox, oy, label in outputs:
        ax.text(ox, oy, label, ha="center", va="center", fontsize=7.5, color=C["accent"],
                bbox=dict(boxstyle="round,pad=0.3", facecolor="white", edgecolor=C["accent"], linewidth=0.8))

    _save(fig, "pipeline_flowchart")


# ════════════════════════════════════════════════════════════════════
# 5. ML Training Pipeline
# ════════════════════════════════════════════════════════════════════
def diagram_ml_pipeline():
    fig, ax = plt.subplots(figsize=(12, 7))
    fig.set_facecolor(C["bg"])
    ax.set_xlim(0, 12); ax.set_ylim(0, 7)
    ax.axis("off")
    ax.set_title("Machine Learning Training Pipeline", pad=20, fontsize=16, color=C["primary"])

    # Two tracks
    ax.text(2.5, 6.5, "Crop Risk Advisor (Classification)", ha="center", fontsize=11, fontweight="bold", color=C["success"])
    ax.text(9.5, 6.5, "Price Intelligence (Regression)", ha="center", fontsize=11, fontweight="bold", color=C["info"])

    # Divider
    ax.plot([6, 6], [0.5, 6.3], color=C["border"], lw=1, linestyle="--")

    # Left track - Crop Risk
    left_steps = [
        (1, 5.4, "Mandi + Weather\nJoined Data", C["light_green"]),
        (1, 4.0, "Physics Features\n(GDD, VPD, DSI)", C["light_blue"]),
        (1, 2.6, "LightGBM\nFocal-Loss Weights\n{0:1, 1:10, 2:50}", C["light_orange"]),
        (1, 1.2, "Risk: Low / Med / High\nAcc: 87.4%  F1: 61.1%", C["light_green"]),
    ]
    for x, y, label, bg in left_steps:
        _box(ax, x, y, 3, 1.0, label, bg, ec=C["success"], fontsize=8.5, bold=False)
    for i in range(len(left_steps)-1):
        _arrow(ax, 2.5, left_steps[i][1], 2.5, left_steps[i+1][1] + 1.0, color=C["success"])

    # Right track - Price Intelligence
    right_steps = [
        (8, 5.4, "Mandi Only\n2001-2026 Data", C["light_blue"]),
        (8, 4.0, "Lag Features\nRolling Means\nTarget Horizons", C["light_green"]),
        (8, 2.6, "LightGBM × 5\nHorizons: 1,3,7,14,15d", C["light_orange"]),
        (8, 1.2, "R² = 0.93 (1d)\nConformal PI: 80/90/95%", C["light_blue"]),
    ]
    for x, y, label, bg in right_steps:
        _box(ax, x, y, 3, 1.0, label, bg, ec=C["info"], fontsize=8.5, bold=False)
    for i in range(len(right_steps)-1):
        _arrow(ax, 9.5, right_steps[i][1], 9.5, right_steps[i+1][1] + 1.0, color=C["info"])

    _save(fig, "ml_pipeline")


# ════════════════════════════════════════════════════════════════════
# 6. Crop Risk Advisor Results (bar chart)
# ════════════════════════════════════════════════════════════════════
def diagram_crop_risk_results():
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    fig.set_facecolor(C["bg"])
    fig.suptitle("Crop Risk Advisor — Performance Metrics", fontsize=16, fontweight="bold", color=C["primary"], y=1.02)

    # Per-class metrics
    classes = ["Low Risk", "Medium Risk", "High Risk"]
    precision = [0.97, 0.42, 0.34]
    recall    = [0.91, 0.62, 0.46]
    f1        = [0.94, 0.50, 0.39]

    x = np.arange(len(classes))
    w = 0.25
    bars1 = axes[0].bar(x - w, precision, w, label="Precision", color=C["success"], edgecolor="white")
    bars2 = axes[0].bar(x, recall, w, label="Recall", color=C["info"], edgecolor="white")
    bars3 = axes[0].bar(x + w, f1, w, label="F1-Score", color=C["accent"], edgecolor="white")

    axes[0].set_ylim(0, 1.15)
    axes[0].set_xticks(x)
    axes[0].set_xticklabels(classes)
    axes[0].set_ylabel("Score")
    axes[0].set_title("Per-Class Metrics", fontweight="bold")
    axes[0].legend(loc="upper right", fontsize=8)
    axes[0].spines[["top", "right"]].set_visible(False)
    for bars in [bars1, bars2, bars3]:
        for bar in bars:
            h = bar.get_height()
            axes[0].text(bar.get_x() + bar.get_width()/2, h + 0.02, f"{h:.0%}", ha="center", fontsize=7, fontweight="bold")

    # Feature importance top-10
    features = ["district", "temp_std", "stage_progress", "crop", "days_since_sowing",
                "rainfall_14d", "temp_range", "temp_max", "gdd_14d", "temp_min"]
    importance = [0.1241, 0.0702, 0.0565, 0.0555, 0.0549, 0.0487, 0.0476, 0.0456, 0.0439, 0.0427]

    colors = [C["success"] if f == "gdd_14d" else C["info"] for f in features]
    axes[1].barh(range(len(features)), importance[::-1], color=colors[::-1], edgecolor="white", height=0.6)
    axes[1].set_yticks(range(len(features)))
    axes[1].set_yticklabels(features[::-1], fontsize=9)
    axes[1].set_xlabel("Importance (Gain)")
    axes[1].set_title("Top-10 Feature Importance", fontweight="bold")
    axes[1].spines[["top", "right"]].set_visible(False)
    # Highlight GDD
    axes[1].text(0.045, 1, "← Physics Feature", fontsize=7, color=C["success"], fontweight="bold")

    plt.tight_layout()
    _save(fig, "crop_risk_results")


# ════════════════════════════════════════════════════════════════════
# 7. Price Model Results (multi-horizon)
# ════════════════════════════════════════════════════════════════════
def diagram_price_model_results():
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    fig.set_facecolor(C["bg"])
    fig.suptitle("Price Intelligence Engine — Multi-Horizon Performance", fontsize=16, fontweight="bold", color=C["primary"], y=1.02)

    horizons = ["1d", "3d", "7d", "14d", "15d"]
    r2   = [0.9331, 0.9105, 0.8904, 0.8684, 0.8821]
    mae  = [361.72, 435.38, 501.82, 561.81, 546.28]
    rmse = [687.77, 803.34, 896.52, 983.83, 924.92]

    # R² line chart
    axes[0].plot(horizons, r2, "o-", color=C["primary"], linewidth=2.5, markersize=10, markerfacecolor="white", markeredgewidth=2.5)
    axes[0].fill_between(range(len(horizons)), r2, alpha=0.15, color=C["primary"])
    axes[0].set_ylim(0.84, 0.96)
    axes[0].set_ylabel("R² Score")
    axes[0].set_xlabel("Forecast Horizon")
    axes[0].set_title("R² vs Horizon", fontweight="bold")
    axes[0].spines[["top", "right"]].set_visible(False)
    for i, v in enumerate(r2):
        axes[0].text(i, v + 0.005, f"{v:.4f}", ha="center", fontsize=8, fontweight="bold")

    # MAE / RMSE bar chart
    x = np.arange(len(horizons))
    w = 0.35
    axes[1].bar(x - w/2, mae, w, label="MAE (₹/q)", color=C["info"], edgecolor="white")
    axes[1].bar(x + w/2, rmse, w, label="RMSE (₹/q)", color=C["accent"], edgecolor="white")
    axes[1].set_xticks(x)
    axes[1].set_xticklabels(horizons)
    axes[1].set_ylabel("Error (₹/quintal)")
    axes[1].set_xlabel("Forecast Horizon")
    axes[1].set_title("MAE / RMSE vs Horizon", fontweight="bold")
    axes[1].legend(fontsize=8)
    axes[1].spines[["top", "right"]].set_visible(False)

    plt.tight_layout()
    _save(fig, "price_model_results")


# ════════════════════════════════════════════════════════════════════
# 8. Literature Survey Comparison
# ════════════════════════════════════════════════════════════════════
def diagram_lit_survey():
    fig, ax = plt.subplots(figsize=(10, 6))
    fig.set_facecolor(C["bg"])

    papers = [
        "Mandimitra\n(Ours)",
        "AgriPredict\n(2024)",
        "CropWatch\n(2023)",
        "KisanMitra\n(2023)",
        "AgroML\n(2022)",
    ]
    metrics = {
        "Price R²":     [0.93, 0.87, 0.82, 0.79, 0.75],
        "Risk Accuracy": [0.87, 0.83, 0.80, 0.78, 0.72],
    }

    x = np.arange(len(papers))
    w = 0.35
    bars1 = ax.bar(x - w/2, metrics["Price R²"], w, label="Price Prediction R²", color=C["primary"], edgecolor="white")
    bars2 = ax.bar(x + w/2, metrics["Risk Accuracy"], w, label="Risk Classification Acc.", color=C["accent"], edgecolor="white")

    # Highlight our result
    bars1[0].set_edgecolor(C["success"])
    bars1[0].set_linewidth(2.5)
    bars2[0].set_edgecolor(C["success"])
    bars2[0].set_linewidth(2.5)

    ax.set_ylim(0, 1.12)
    ax.set_xticks(x)
    ax.set_xticklabels(papers, fontsize=9)
    ax.set_ylabel("Score")
    ax.set_title("Literature Survey — Comparative Performance", fontsize=14, fontweight="bold", color=C["primary"])
    ax.legend(loc="upper right")
    ax.spines[["top", "right"]].set_visible(False)

    for bars in [bars1, bars2]:
        for bar in bars:
            h = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2, h + 0.02, f"{h:.2f}", ha="center", fontsize=8.5, fontweight="bold")

    plt.tight_layout()
    _save(fig, "lit_survey_comparison")


# ════════════════════════════════════════════════════════════════════
# 9. Scope Diagram
# ════════════════════════════════════════════════════════════════════
def diagram_scope():
    fig, ax = plt.subplots(figsize=(10, 7))
    fig.set_facecolor(C["bg"])
    ax.set_xlim(0, 10); ax.set_ylim(0, 7)
    ax.axis("off")
    ax.set_title("Project Scope — MANDIMITRA", pad=20, fontsize=16, color=C["primary"])

    # In-scope box
    rect_in = FancyBboxPatch((0.5, 2.5), 4.2, 4, boxstyle="round,pad=0.08",
                              facecolor=C["light_green"], edgecolor=C["success"], linewidth=2)
    ax.add_patch(rect_in)
    ax.text(2.6, 6.2, "IN SCOPE", ha="center", fontsize=12, fontweight="bold", color=C["success"])

    in_items = [
        "Maharashtra Mandi Prices (6.1M records)",
        "Weather Integration (NASA + Open-Meteo)",
        "Crop Risk Advisory (LightGBM ML)",
        "Price Forecasting (5 horizons)",
        "Veterinary Booking System",
        "Emergency SOS for Farmers",
        "Admin Verification Panel",
    ]
    for i, item in enumerate(in_items):
        ax.text(0.8, 5.8 - i*0.45, f"• {item}", fontsize=8.5, color=C["text"])

    # Out-of-scope box
    rect_out = FancyBboxPatch((5.3, 2.5), 4.2, 4, boxstyle="round,pad=0.08",
                               facecolor=C["light_red"], edgecolor=C["danger"], linewidth=2)
    ax.add_patch(rect_out)
    ax.text(7.4, 6.2, "OUT OF SCOPE", ha="center", fontsize=12, fontweight="bold", color=C["danger"])

    out_items = [
        "Other states (non-Maharashtra)",
        "Direct e-commerce / buying",
        "Government policy analysis",
        "Pesticide recommendation",
        "Chatbot / conversational AI",
        "Mobile native application",
        "Multi-language support",
    ]
    for i, item in enumerate(out_items):
        ax.text(5.6, 5.8 - i*0.45, f"• {item}", fontsize=8.5, color=C["text"])

    # Bottom: Stakeholders
    _box(ax, 0.5, 0.5, 9, 1.5, "", "#F5F5F5", ec=C["border"])
    ax.text(5, 1.8, "Key Stakeholders", ha="center", fontsize=11, fontweight="bold", color=C["text"])
    stakeholders = ["Maharashtra\nFarmers", "Veterinary\nDoctors", "Mandi\nAdministrators", "Agricultural\nResearchers"]
    for i, s in enumerate(stakeholders):
        ax.text(1.5 + i*2.3, 1.0, s, ha="center", fontsize=9, color=C["muted"])

    _save(fig, "scope_diagram")


# ════════════════════════════════════════════════════════════════════
# 10. Weather Integration Flow
# ════════════════════════════════════════════════════════════════════
def diagram_weather_flow():
    fig, ax = plt.subplots(figsize=(12, 5))
    fig.set_facecolor(C["bg"])
    ax.set_xlim(0, 12); ax.set_ylim(0, 5)
    ax.axis("off")
    ax.set_title("Weather Data Integration Flow", pad=20, fontsize=16, color=C["primary"])

    # Sources
    _box(ax, 0.5, 3.2, 2.2, 1.2, "NASA POWER\n10yr Historical\nPrecip, Temp, RH", C["light_blue"], ec=C["info"], fontsize=8, bold=True)
    _box(ax, 0.5, 1.2, 2.2, 1.2, "Open-Meteo\n16-Day Forecast\nPrecip, Temp", C["light_teal"], ec=C["success"], fontsize=8, bold=True)

    # Processing
    _box(ax, 4.0, 2.2, 2.2, 1.5, "Weather\nProcessing\n• District Norm.\n• QC Validation", C["light_orange"], ec=C["accent"], fontsize=8, bold=True)

    # Join
    _box(ax, 7.5, 2.2, 2.2, 1.5, "Mandi-Weather\nJoin\n• On (date, district)\n• 2016+ records", C["light_green"], ec=C["success"], fontsize=8, bold=True)

    # Output
    _box(ax, 10.5, 2.2, 1.3, 1.5, "ML-Ready\nDataset", C["light_purple"], ec="#7B1FA2", fontsize=8, bold=True)

    # Arrows
    _arrow(ax, 2.7, 3.8, 4.0, 3.2, C["info"])
    _arrow(ax, 2.7, 1.8, 4.0, 2.7, C["success"])
    _arrow(ax, 6.2, 3.0, 7.5, 3.0, C["accent"])
    _arrow(ax, 9.7, 3.0, 10.5, 3.0, C["success"])

    # Labels
    ax.text(6.85, 3.4, "36 Districts", ha="center", fontsize=7.5, color=C["muted"],
            bbox=dict(boxstyle="round,pad=0.2", facecolor="white", edgecolor="none"))

    _save(fig, "weather_integration_flow")


# ════════════════════════════════════════════════════════════════════
# 11. Deduplication Process Flow
# ════════════════════════════════════════════════════════════════════
def diagram_dedup_flow():
    fig, ax = plt.subplots(figsize=(12, 5))
    fig.set_facecolor(C["bg"])
    ax.set_xlim(0, 12); ax.set_ylim(0, 5)
    ax.axis("off")
    ax.set_title("Data Deduplication Strategy", pad=20, fontsize=16, color=C["primary"])

    steps = [
        ("Raw Data\n6.8M Rows", C["light_red"]),
        ("Natural Key\nGrouping\n(7-column key)", C["light_orange"]),
        ("Priority\nRanking\ncurrent > history", C["light_blue"]),
        ("DuckDB SQL\nROW_NUMBER()\nPARTITION BY key", C["light_purple"]),
        ("Canonical\nDataset\n6.1M Rows", C["light_green"]),
    ]

    for i, (label, bg) in enumerate(steps):
        x = 0.5 + i * 2.4
        _box(ax, x, 1.8, 1.8, 2.0, label, bg, ec=C["border"], fontsize=8.5, bold=True)
        if i < len(steps) - 1:
            _arrow(ax, x + 1.8, 2.8, x + 2.4, 2.8, C["primary"])

    # Dedup key at bottom
    ax.text(6, 0.8, "Natural Key: (state, district, market, commodity, variety, grade, arrival_date)",
            ha="center", fontsize=9, color=C["muted"], style="italic",
            bbox=dict(boxstyle="round,pad=0.3", facecolor="white", edgecolor=C["border"], linewidth=0.8))

    # Stats
    ax.text(1.4, 4.3, "Before: 6.8M", fontsize=9, fontweight="bold", color=C["danger"])
    ax.text(10.2, 4.3, "After: 6.1M", fontsize=9, fontweight="bold", color=C["success"])
    ax.text(6, 4.3, "~700K duplicates removed", fontsize=9, fontweight="bold", color=C["accent"])

    _save(fig, "dedup_process_flow")


# ════════════════════════════════════════════════════════════════════
# 12. Module Interaction Diagram
# ════════════════════════════════════════════════════════════════════
def diagram_module_interaction():
    fig, ax = plt.subplots(figsize=(10, 8))
    fig.set_facecolor(C["bg"])
    ax.set_xlim(0, 10); ax.set_ylim(0, 8)
    ax.axis("off")
    ax.set_title("Module Interaction Diagram", pad=20, fontsize=16, color=C["primary"])

    modules = [
        (4, 7.0, 2, 0.8, "Next.js Frontend", C["light_green"], C["success"]),
        (4, 5.5, 2, 0.8, "FastAPI Gateway", C["light_blue"], C["info"]),
        (1, 4.0, 2, 0.8, "Auth Module", C["light_orange"], C["accent"]),
        (4, 4.0, 2, 0.8, "Vet Service", C["light_purple"], "#7B1FA2"),
        (7, 4.0, 2, 0.8, "ML Engine", C["light_teal"], "#00796B"),
        (1, 2.2, 2, 0.8, "Supabase Auth", C["light_red"], C["danger"]),
        (4, 2.2, 2, 0.8, "Supabase DB", C["light_red"], C["danger"]),
        (7, 2.2, 2, 0.8, "Model Store\n(.joblib)", C["light_red"], C["danger"]),
        (4, 0.8, 2, 0.8, "Supabase Storage", C["light_red"], C["danger"]),
    ]

    for x, y, w, h, label, bg, ec in modules:
        _box(ax, x, y, w, h, label, bg, ec=ec, fontsize=9, bold=True)

    # Connections
    connections = [
        (5, 7.0, 5, 6.3),  # Frontend → FastAPI
        (5, 5.5, 2, 4.8),  # FastAPI → Auth
        (5, 5.5, 5, 4.8),  # FastAPI → Vet
        (5, 5.5, 8, 4.8),  # FastAPI → ML
        (2, 4.0, 2, 3.0),  # Auth → Supabase Auth
        (5, 4.0, 5, 3.0),  # Vet → Supabase DB
        (8, 4.0, 8, 3.0),  # ML → Model Store
        (5, 2.2, 5, 1.6),  # DB → Storage
    ]
    for x1, y1, x2, y2 in connections:
        _arrow(ax, x1, y1, x2, y2, C["muted"])

    _save(fig, "module_interaction")


# ════════════════════════════════════════════════════════════════════
# 13. Testing & Validation Flow
# ════════════════════════════════════════════════════════════════════
def diagram_testing_flow():
    fig, ax = plt.subplots(figsize=(12, 6))
    fig.set_facecolor(C["bg"])
    ax.set_xlim(0, 12); ax.set_ylim(0, 6)
    ax.axis("off")
    ax.set_title("Testing & Validation Strategy", pad=20, fontsize=16, color=C["primary"])

    # Testing layers
    layers = [
        (0.5, 4.5, "Unit Testing", C["light_green"], [
            "Pandera Schema Validation",
            "Maharashtra-Only Filter Tests",
            "API Endpoint Tests",
        ]),
        (4.25, 4.5, "Integration Testing", C["light_blue"], [
            "Pipeline End-to-End",
            "API + DB Round-Trip",
            "Auth Flow Validation",
        ]),
        (8, 4.5, "ML Validation", C["light_orange"], [
            "Cross-Validation (5-fold)",
            "Conformal Prediction Calibration",
            "Feature Importance SHAP",
        ]),
    ]

    for x, y, title, bg, items in layers:
        rect = FancyBboxPatch((x, y-3.2), 3.2, 3.5, boxstyle="round,pad=0.05",
                              facecolor=bg, edgecolor=C["border"], linewidth=1.2)
        ax.add_patch(rect)
        ax.text(x+1.6, y, title, ha="center", fontsize=11, fontweight="bold", color=C["text"])
        for i, item in enumerate(items):
            ax.text(x+0.3, y-0.8-i*0.6, f"> {item}", fontsize=8.5, color=C["text"])

    # Bottom: Results
    _box(ax, 1, 0.3, 10, 0.7, "Results: 38 files validated  |  0 non-MH records  |  87.4% accuracy  |  R2=0.93",
         "#E8F5E9", ec=C["success"], fontsize=9, bold=True)

    _save(fig, "testing_validation_flow")


# ════════════════════════════════════════════════════════════════════
# 14. Data Coverage Map (Districts)
# ════════════════════════════════════════════════════════════════════
def diagram_data_coverage():
    fig, axes = plt.subplots(1, 2, figsize=(12, 6))
    fig.set_facecolor(C["bg"])
    fig.suptitle("Maharashtra Data Coverage Analysis", fontsize=16, fontweight="bold", color=C["primary"], y=1.02)

    # District coverage pie chart
    labels_pie = ["Covered\nDistricts\n(35)", "Partial\nCoverage\n(1)"]
    sizes = [35, 1]
    colors_pie = [C["success"], C["warning"]]
    explode = (0.05, 0.1)
    wedges, texts, autotexts = axes[0].pie(sizes, explode=explode, labels=labels_pie, autopct="%1.0f%%",
                                           colors=colors_pie, startangle=90, textprops={"fontsize": 9})
    autotexts[0].set_fontsize(14)
    autotexts[0].set_fontweight("bold")
    axes[0].set_title("District Coverage (36 Total)", fontweight="bold")

    # Data volume by source
    sources = ["AGMARKNET\n(Current)", "Kaggle\n(Historical)", "NASA\nPOWER", "Open-Meteo\n(Forecast)"]
    volumes = [150000, 5950000, 473040, 576]
    volumes_log = [np.log10(v) for v in volumes]
    colors_bar = [C["info"], C["primary"], C["accent"], C["success"]]

    bars = axes[1].bar(range(len(sources)), volumes_log, color=colors_bar, edgecolor="white", width=0.6)
    axes[1].set_xticks(range(len(sources)))
    axes[1].set_xticklabels(sources, fontsize=9)
    axes[1].set_ylabel("Records (log₁₀ scale)")
    axes[1].set_title("Data Volume by Source", fontweight="bold")
    axes[1].spines[["top", "right"]].set_visible(False)
    for bar, vol in zip(bars, volumes):
        h = bar.get_height()
        label = f"{vol:,.0f}" if vol < 1000000 else f"{vol/1000000:.1f}M"
        axes[1].text(bar.get_x() + bar.get_width()/2, h + 0.1, label, ha="center", fontsize=9, fontweight="bold")

    plt.tight_layout()
    _save(fig, "data_coverage")


# ════════════════════════════════════════════════════════════════════
# 15. Veterinary Service Flow
# ════════════════════════════════════════════════════════════════════
def diagram_vet_service_flow():
    fig, ax = plt.subplots(figsize=(12, 7))
    fig.set_facecolor(C["bg"])
    ax.set_xlim(0, 12); ax.set_ylim(0, 7)
    ax.axis("off")
    ax.set_title("Veterinary Service — Complete Flow", pad=20, fontsize=16, color=C["primary"])

    # Swimlanes
    lanes = [("Farmer", 5.3, C["light_green"]), ("System", 3.3, C["light_blue"]), ("Doctor", 1.3, C["light_orange"])]
    for label, y, bg in lanes:
        rect = FancyBboxPatch((0.3, y), 11.4, 1.5, boxstyle="round,pad=0.05",
                              facecolor=bg, edgecolor=C["border"], linewidth=0.8, alpha=0.4)
        ax.add_patch(rect)
        ax.text(0.6, y+1.3, label, fontsize=9, fontweight="bold", color=C["muted"], va="top")

    # Farmer actions
    _box(ax, 1, 5.5, 1.8, 0.9, "Browse\nDoctors", C["light_green"], fontsize=8, bold=True)
    _box(ax, 3.5, 5.5, 1.8, 0.9, "Book\nAppointment", C["light_green"], fontsize=8, bold=True)
    _box(ax, 8.5, 5.5, 1.8, 0.9, "Emergency\nSOS", "#FFCDD2", fontsize=8, bold=True)

    # System actions
    _box(ax, 3.5, 3.5, 1.8, 0.9, "Create\nBooking", C["light_blue"], fontsize=8, bold=True)
    _box(ax, 6, 3.5, 1.8, 0.9, "Send\nNotification", C["light_blue"], fontsize=8, bold=True)
    _box(ax, 8.5, 3.5, 1.8, 0.9, "Broadcast to\nAll Doctors", C["light_blue"], fontsize=8, bold=True)

    # Doctor actions
    _box(ax, 3.5, 1.5, 1.8, 0.9, "Confirm /\nCancel", C["light_orange"], fontsize=8, bold=True)
    _box(ax, 6, 1.5, 1.8, 0.9, "Visit &\nTreat", C["light_orange"], fontsize=8, bold=True)
    _box(ax, 8.5, 1.5, 1.8, 0.9, "Accept\nEmergency", C["light_orange"], fontsize=8, bold=True)
    _box(ax, 10.5, 1.5, 1.2, 0.9, "Mark\nDone", C["light_green"], fontsize=8, bold=True)

    # Arrows
    _arrow(ax, 2.8, 5.95, 3.5, 5.95, C["success"])
    _arrow(ax, 4.4, 5.5, 4.4, 4.4, C["info"])
    _arrow(ax, 5.3, 3.95, 6.0, 3.95, C["info"])
    _arrow(ax, 4.4, 3.5, 4.4, 2.4, C["accent"])
    _arrow(ax, 5.3, 1.95, 6.0, 1.95, C["accent"])
    _arrow(ax, 9.4, 5.5, 9.4, 4.4, C["danger"])
    _arrow(ax, 9.4, 3.5, 9.4, 2.4, C["danger"])
    _arrow(ax, 10.3, 1.95, 10.5, 1.95, C["success"])

    _save(fig, "vet_service_flow")


# ════════════════════════════════════════════════════════════════════
# 16. Sequence Diagram (Booking)
# ════════════════════════════════════════════════════════════════════
def diagram_booking_sequence():
    fig, ax = plt.subplots(figsize=(12, 8))
    fig.set_facecolor(C["bg"])
    ax.set_xlim(0, 12); ax.set_ylim(0, 8)
    ax.axis("off")
    ax.set_title("Sequence Diagram — Appointment Booking", pad=20, fontsize=16, color=C["primary"])

    # Lifelines
    lifelines = [
        (2, "Farmer\n(Browser)"),
        (5, "Next.js\nFrontend"),
        (8, "FastAPI\nBackend"),
        (11, "Supabase\nDB"),
    ]
    for lx, label in lifelines:
        _box(ax, lx-0.7, 7.0, 1.4, 0.8, label, C["light_blue"], ec=C["info"], fontsize=8, bold=True)
        ax.plot([lx, lx], [0.5, 7.0], color=C["border"], linewidth=1, linestyle="--")

    # Messages
    messages = [
        (2, 5, 6.5, "Click 'Book Appointment'", "→"),
        (5, 8, 6.0, "POST /api/vet/farmer/book", "→"),
        (8, 11, 5.5, "INSERT INTO bookings", "→"),
        (11, 8, 5.0, "{ id, status: 'pending' }", "←"),
        (8, 5, 4.5, "{ message: 'Booked' }", "←"),
        (5, 2, 4.0, "Show success toast", "←"),
        (2, 5, 3.2, "View 'My Bookings' tab", "→"),
        (5, 8, 2.7, "GET /api/vet/farmer/bookings", "→"),
        (8, 11, 2.2, "SELECT * WHERE farmer_id=...", "→"),
        (11, 8, 1.7, "[ booking list ]", "←"),
        (8, 5, 1.2, "{ bookings: [...] }", "←"),
    ]

    for x1, x2, y, label, direction in messages:
        color = C["info"] if direction == "→" else C["success"]
        _arrow(ax, x1, y, x2, y, color)
        mx = (x1 + x2) / 2
        ax.text(mx, y + 0.15, label, ha="center", fontsize=7, color=C["text"],
                bbox=dict(boxstyle="round,pad=0.15", facecolor="white", edgecolor="none", alpha=0.9))

    _save(fig, "booking_sequence")


# ════════════════════════════════════════════════════════════════════
# 17. ER Diagram (Database Schema)
# ════════════════════════════════════════════════════════════════════
def diagram_er():
    fig, ax = plt.subplots(figsize=(12, 8))
    fig.set_facecolor(C["bg"])
    ax.set_xlim(0, 12); ax.set_ylim(0, 8)
    ax.axis("off")
    ax.set_title("Entity-Relationship Diagram — Database Schema", pad=20, fontsize=16, color=C["primary"])

    # Profiles table
    _box(ax, 0.5, 4.5, 3.5, 3.2, "", C["light_green"], ec=C["success"])
    ax.text(2.25, 7.4, "profiles", ha="center", fontsize=11, fontweight="bold", color=C["success"])
    fields_p = ["PK  id (uuid)", "    full_name", "    email", "    phone", "    role (farmer/doctor/admin)",
                "    verification_status", "    specialization", "    veterinary_license", "    verification_document_url"]
    for i, f in enumerate(fields_p):
        ax.text(0.7, 7.0 - i*0.3, f, fontsize=7, fontfamily="monospace", color=C["text"])

    # Bookings table
    _box(ax, 4.5, 4.5, 3.2, 3.2, "", C["light_blue"], ec=C["info"])
    ax.text(6.1, 7.4, "bookings", ha="center", fontsize=11, fontweight="bold", color=C["info"])
    fields_b = ["PK  id (uuid)", "FK  farmer_id", "FK  doctor_id", "    booking_date", "    time_slot",
                "    animal_type", "    description", "    status", "    farmer_name", "    doctor_name"]
    for i, f in enumerate(fields_b):
        ax.text(4.7, 7.0 - i*0.3, f, fontsize=7, fontfamily="monospace", color=C["text"])

    # Emergency Requests table
    _box(ax, 8.2, 4.5, 3.3, 3.2, "", C["light_orange"], ec=C["accent"])
    ax.text(9.85, 7.4, "emergency_requests", ha="center", fontsize=11, fontweight="bold", color=C["accent"])
    fields_e = ["PK  id (uuid)", "FK  farmer_id", "FK  accepted_by", "    animal_type", "    description",
                "    location", "    latitude / longitude", "    status", "    farmer_name", "    doctor_name"]
    for i, f in enumerate(fields_e):
        ax.text(8.4, 7.0 - i*0.3, f, fontsize=7, fontfamily="monospace", color=C["text"])

    # Relationships
    ax.annotate("", xy=(4.5, 6.5), xytext=(4.0, 6.5),
                arrowprops=dict(arrowstyle="-|>", color=C["info"], lw=2))
    ax.text(4.25, 6.7, "1:N", fontsize=8, fontweight="bold", color=C["info"])

    ax.annotate("", xy=(8.2, 6.5), xytext=(7.7, 6.5),
                arrowprops=dict(arrowstyle="-|>", color=C["accent"], lw=2))
    # Connect profiles to bookings (doctor_id)
    ax.annotate("", xy=(4.5, 5.8), xytext=(4.0, 5.8),
                arrowprops=dict(arrowstyle="-|>", color=C["success"], lw=1.5))

    # Mandi data
    _box(ax, 0.5, 0.5, 5, 3.0, "", "#F5F5F5", ec=C["border"])
    ax.text(3, 3.2, "mandi_canonical (Parquet)", ha="center", fontsize=11, fontweight="bold", color=C["primary"])
    fields_m = ["state, district, market", "commodity, variety, grade", "arrival_date",
                "min_price, max_price, modal_price", "source (current/history)"]
    for i, f in enumerate(fields_m):
        ax.text(0.8, 2.8 - i*0.4, f, fontsize=8, fontfamily="monospace", color=C["text"])

    # Weather data
    _box(ax, 6.0, 0.5, 5.5, 3.0, "", "#F5F5F5", ec=C["border"])
    ax.text(8.75, 3.2, "weather_data (Parquet)", ha="center", fontsize=11, fontweight="bold", color=C["primary"])
    fields_w = ["date, district", "t2m_max, t2m_min, humidity",
                "precipitation, wind_speed", "solar_radiation", "source (POWER/Open-Meteo)"]
    for i, f in enumerate(fields_w):
        ax.text(6.3, 2.8 - i*0.4, f, fontsize=8, fontfamily="monospace", color=C["text"])

    _save(fig, "er_diagram")


# ════════════════════════════════════════════════════════════════════
# 18. Deployment Architecture
# ════════════════════════════════════════════════════════════════════
def diagram_deployment():
    fig, ax = plt.subplots(figsize=(12, 7))
    fig.set_facecolor(C["bg"])
    ax.set_xlim(0, 12); ax.set_ylim(0, 7)
    ax.axis("off")
    ax.set_title("Deployment Architecture", pad=20, fontsize=16, color=C["primary"])

    # User
    ax.text(6, 6.5, "Users (Farmer / Doctor / Admin)", ha="center", fontsize=12, fontweight="bold")

    # Frontend
    _box(ax, 3.5, 5.0, 5, 1.0, "Next.js Frontend\n(Vercel / Static Export)", C["light_green"], ec=C["success"], fontsize=10, bold=True)

    # API Layer
    _box(ax, 1, 3.2, 3.5, 1.2, "FastAPI Backend\n(Python Server)", C["light_blue"], ec=C["info"], fontsize=9, bold=True)
    _box(ax, 7.5, 3.2, 3.5, 1.2, "ML Inference\nEngine", C["light_purple"], ec="#7B1FA2", fontsize=9, bold=True)

    # Data Layer
    _box(ax, 0.5, 1.0, 2.5, 1.5, "Supabase\n• Auth\n• PostgreSQL\n• Storage", C["light_orange"], ec=C["accent"], fontsize=8, bold=True)
    _box(ax, 3.5, 1.0, 2.5, 1.5, "DuckDB\nAnalytics\n(6.1M rows)", C["light_teal"], ec="#00796B", fontsize=8, bold=True)
    _box(ax, 6.5, 1.0, 2.5, 1.5, "Model Files\n(.joblib)\n5 horizons + CRA", "#F3E5F5", ec="#7B1FA2", fontsize=8, bold=True)
    _box(ax, 9.5, 1.0, 2.2, 1.5, "External\nAPIs\n(Weather)", C["light_red"], ec=C["danger"], fontsize=8, bold=True)

    # Arrows
    _arrow(ax, 6, 6.2, 6, 6.0, C["muted"])
    _arrow(ax, 6, 5.0, 2.75, 4.4, C["info"])
    _arrow(ax, 6, 5.0, 9.25, 4.4, "#7B1FA2")
    _arrow(ax, 2.75, 3.2, 1.75, 2.5, C["accent"])
    _arrow(ax, 2.75, 3.2, 4.75, 2.5, "#00796B")
    _arrow(ax, 9.25, 3.2, 7.75, 2.5, "#7B1FA2")
    _arrow(ax, 9.25, 3.2, 10.6, 2.5, C["danger"])

    _save(fig, "deployment_architecture")


# ════════════════════════════════════════════════════════════════════
# Main
# ════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("Generating MANDIMITRA diagrams (300 DPI)...\n")
    diagram_system_architecture()
    diagram_dfd_level0()
    diagram_use_cases()
    diagram_pipeline_flowchart()
    diagram_ml_pipeline()
    diagram_crop_risk_results()
    diagram_price_model_results()
    diagram_lit_survey()
    diagram_scope()
    diagram_weather_flow()
    diagram_dedup_flow()
    diagram_module_interaction()
    diagram_testing_flow()
    diagram_data_coverage()
    diagram_vet_service_flow()
    diagram_booking_sequence()
    diagram_er()
    diagram_deployment()
    print("All 18 diagrams saved in:", OUT)
