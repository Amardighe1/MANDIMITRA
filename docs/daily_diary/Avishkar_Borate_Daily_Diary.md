# CAPSTONE PROJECT DAILY DIARY

**Name of the Student:** Avishkar Borate

**Name of Guide (Faculty):** Mayur Gund

**Enrolment Number:** 01

**Semester:** AN-6-K

**Role Focus:** Data Pipeline & Backend Development

---

## WEEK: 1

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 08/12/25 | Review of problem statement and project objective | Clear understanding of MANDIMITRA scope and goals | |
| Tuesday | 09/12/25 | Study of AGMARKNET API documentation and data.gov.in portal | API structure and data fields understood | |
| Wednesday | 10/12/25 | Literature survey on data pipeline architectures for agricultural data | Knowledge of ETL patterns for large-scale data gained | |
| Thursday | 11/12/25 | Analysis of existing agricultural data platforms and their limitations | Performance gaps and feature gaps identified | |
| Friday | 12/12/25 | Environment setup — Python 3.10, virtual environment, project structure | Dev environment configured with all dependencies | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 2

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 15/12/25 | Study of Data.gov.in REST API authentication and rate limiting | API key registration and request patterns understood | |
| Tuesday | 16/12/25 | Initial prototype for AGMARKNET data download script | Basic API call to fetch mandi prices working | |
| Wednesday | 17/12/25 | Research on Maharashtra districts, mandis, and commodity classification | 36 district mapping and commodity list finalized | |
| Thursday | 18/12/25 | Design of project.yaml and data_sources.yaml configuration schema | Config-driven pipeline architecture designed | |
| Friday | 19/12/25 | Setup of .env template and secure API key management | API key handling with no hardcoded secrets achieved | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 3

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 22/12/25 | Implementation of chunked download system for AGMARKNET data | Resumable by-district chunking logic implemented | |
| Tuesday | 23/12/25 | Development of adaptive rate limiting with token bucket algorithm | 429 error handling and backoff strategy working | |
| Wednesday | 24/12/25 | Building Maharashtra-only validation filters — reject non-MH data | Strict state constraint enforced in pipeline | |
| Thursday | 25/12/25 | Implementation of district name normalization (35 raw → 36 canonical) | District mapping table with fuzzy matching complete | |
| Friday | 26/12/25 | Creation of Pandera validation schemas for mandi price data | Schema validation with strict type and range checks done | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 4

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 29/12/25 | Integration of NASA POWER API for historical rainfall data | Daily precipitation for 36 district HQs downloading | |
| Tuesday | 30/12/25 | Development of Open-Meteo weather forecast integration | 16-day rainfall forecast for Maharashtra districts working | |
| Wednesday | 31/12/25 | Building parallel download with ThreadPoolExecutor | Configurable worker pool for concurrent API calls done | |
| Thursday | 01/01/26 | Implementation of atomic progress tracking for downloads | Resume-safe download state using JSON checkpoints | |
| Friday | 02/01/26 | Creation of markdown audit reports for data compliance | Automated audit log generation for every pipeline run | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 5

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 05/01/26 | Design of FastAPI backend architecture and route structure | API module structure with auth, crop, weather, vet routes planned | |
| Tuesday | 06/01/26 | Implementation of FastAPI main application with CORS and middleware | api/main.py with health check and CORS configured | |
| Wednesday | 07/01/26 | Development of authentication module using Supabase | api/auth.py with JWT-based user auth implemented | |
| Thursday | 08/01/26 | Building weather and market data API endpoints | api/weather_market.py serving real-time price and weather data | |
| Friday | 09/01/26 | Implementation of veterinary emergency services API | api/vet.py with nearby vet lookup and emergency contacts | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 6

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 12/01/26 | Supabase PostgreSQL database schema design and table creation | supabase_setup.sql with all required tables written | |
| Tuesday | 13/01/26 | Implementation of data deduplication logic in pipeline | Dedup flowchart implemented — no duplicate records in DB | |
| Wednesday | 14/01/26 | Development of crop disease detection API endpoint | api/crop_disease.py with image upload and prediction serving | |
| Thursday | 15/01/26 | Building Kaggle dataset integration for historical mandi data | Kaggle API integration for bulk historical data download | |
| Friday | 16/01/26 | Data merge pipeline — combining current and historical datasets | Merge logic with conflict resolution and timestamp handling | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 7

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 19/01/26 | Optimization of data pipeline for 3.5M+ records processing | Memory-safe streaming with constant memory usage achieved | |
| Tuesday | 20/01/26 | Implementation of discovery mode for new mandis and commodities | Streaming discovery without loading full dataset in memory | |
| Wednesday | 21/01/26 | Building data quality validation and completeness checks | Automated data completeness reports generated | |
| Thursday | 22/01/26 | Supabase v2 and v3 schema migrations for enhanced features | supabase_setup_v2.sql and v3.sql with new columns and indexes | |
| Friday | 23/01/26 | API endpoint optimization — response caching and query tuning | Reduced API response time by 40% with query optimization | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 8

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 26/01/26 | Integration testing of full data pipeline end-to-end | All pipeline stages passing with validated output | |
| Tuesday | 27/01/26 | Backend API integration with ML model serving endpoints | FastAPI serving predictions from all 3 trained models | |
| Wednesday | 28/01/26 | Error handling and logging improvements across backend | Structured logging with log files in logs/ directory | |
| Thursday | 29/01/26 | Implementation of locations.csv and maharashtra_locations.csv | District HQ coordinates for 36 districts configured | |
| Friday | 30/01/26 | Load testing of FastAPI backend with concurrent requests | Backend handling 100+ concurrent requests without errors | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 9

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 02/02/26 | Dockerfile creation for containerized backend deployment | Multi-stage Docker build with optimized image size | |
| Tuesday | 03/02/26 | Render.yaml configuration for cloud deployment | render.yaml with environment variables and build commands | |
| Wednesday | 04/02/26 | Requirements file optimization — separate server vs full deps | requirements-server.txt with minimal production dependencies | |
| Thursday | 05/02/26 | Data pipeline automation — scheduled downloads and validation | Automated nightly data refresh pipeline configured | |
| Friday | 06/02/26 | API security hardening — input validation, rate limiting | All endpoints sanitized with proper error responses | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 10

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 09/02/26 | Backend deployment to Render cloud platform | Live API serving at production URL on Render | |
| Tuesday | 10/02/26 | Database migration to production Supabase instance | Production database with all tables and seed data ready | |
| Wednesday | 11/02/26 | Monitoring and health check endpoint implementation | /health and /status endpoints for uptime monitoring | |
| Thursday | 12/02/26 | Bug fixes for edge cases in data pipeline — missing values, encoding | All known data quality issues resolved | |
| Friday | 13/02/26 | Performance benchmarking of production backend | API latency <200ms for all endpoints documented | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 11

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 16/02/26 | Code review and refactoring of pipeline and API modules | Clean, documented codebase with consistent style | |
| Tuesday | 17/02/26 | Writing inline documentation and API docstrings | All functions and endpoints documented with examples | |
| Wednesday | 18/02/26 | Final data pipeline run with full Maharashtra dataset | Complete 3.5M+ record dataset validated and stored | |
| Thursday | 19/02/26 | Backend stress testing and edge case verification | All edge cases handled — empty data, invalid inputs, timeouts | |
| Friday | 20/02/26 | Preparation of backend architecture diagrams for report | DFD Level-0, pipeline flowchart, module interaction diagrams | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 12

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 23/02/26 | Final integration testing with frontend and ML models | Full stack working end-to-end in production | |
| Tuesday | 24/02/26 | README.md finalization with complete setup and usage instructions | Comprehensive README with quick start, config, and API docs | |
| Wednesday | 25/02/26 | Demo preparation — live data pipeline walkthrough | Demo script for capstone presentation ready | |
| Thursday | 26/02/26 | Practice presentation of backend and pipeline components | Confident delivery of technical explanation achieved | |
| Friday | 27/02/26 | Final submission — code freeze, backup, and handover | All backend deliverables submitted and archived | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**
