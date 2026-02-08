# BUILD Instructions - MSBTE Capstone Project Report

## Prerequisites

- Python 3.10 or higher
- `reportlab` package installed

## Install Dependencies

```bash
pip install reportlab
```

## Generate the PDF Report

```bash
cd D:\mandimitra
python reports/generate_report.py
```

## Output Files

| File | Description |
|------|-------------|
| `reports/MSBTE_Capstone_Project_Report.pdf` | Final PDF report (41 pages) |
| `reports/generate_report.py` | Editable Python source for the report |
| `reports/diagrams/` | 18 diagram images embedded in the report |

## Report Structure

### Front Matter (Roman Numerals i-viii)
1. Cover Page
2. Title Page
3. Certificate
4. Acknowledgement
5. Abstract
6. Table of Contents
7. List of Figures
8. List of Tables

### Main Body (Arabic Numerals 1-33)
- Chapter 1: Introduction
- Chapter 2: Literature Survey
- Chapter 3: Scope of the Project
- Chapter 4: Methodology / Approach
- Chapter 5: Details of Designs, Working and Processes
- Chapter 6: Results and Applications
- Conclusion
- References (15 citations)

## Customisation

Edit `reports/generate_report.py` to modify:
- Student names and roll numbers (lines 60-65)
- Guide/HOD/Principal names (lines 66-72)
- College name and department (lines 56-58)
- Any chapter content

After editing, re-run `python reports/generate_report.py` to regenerate the PDF.

## Diagrams

All 18 diagrams are in `reports/diagrams/` and are automatically embedded in the PDF across all chapters:

| Diagram | Used In |
|---------|---------|
| `architecture.png` | Chapter 1 |
| `lit_survey_comparison.png` | Chapter 2 |
| `scope_diagram.png` | Chapter 3 |
| `pipeline_flowchart.png` | Chapter 4 |
| `pipeline_stages_flow.png` | Chapter 4 |
| `weather_integration_flow.png` | Chapter 4 |
| `dfd_level0.png` | Chapter 5 |
| `dedup_flowchart.png` | Chapter 5 |
| `module_interaction.png` | Chapter 5 |
| `ml_training_flow.png` | Chapter 5 |
| `testing_validation_flow.png` | Chapter 5 |
| `use_cases_diagram.png` | Chapter 5 |
| `data_coverage.png` | Chapter 6 |
| `crop_risk_results.png` | Chapter 6 |
| `price_model_results.png` | Chapter 6 |

## Formatting Compliance (MSBTE)

- Paper: A4
- Font: Times New Roman (12pt body, 14pt chapters)
- Margins: Left 3.5cm, Top 2.5cm, Right 1.25cm, Bottom 1.25cm
- Line Spacing: Double (main text), Single (references)
- Page Numbers: Roman (front matter), Arabic (main body)
- Alignment: Justified
