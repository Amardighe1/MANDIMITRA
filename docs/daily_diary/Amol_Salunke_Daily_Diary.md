# CAPSTONE PROJECT DAILY DIARY

**Name of the Student:** Amol Salunke

**Name of Guide (Faculty):** Mayur Gund

**Enrolment Number:** 02

**Semester:** AN-6-K

**Role Focus:** Machine Learning & Model Training

---

## WEEK: 1

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 08/12/25 | Review of problem statement and project objective | Clear understanding of MANDIMITRA AI requirements | |
| Tuesday | 09/12/25 | Study of previously implemented ML models in agriculture | Individual model roles and architectures understood | |
| Wednesday | 10/12/25 | Literature survey on ensemble and hybrid models (MT-CYP-Net, NeuralCrop) | Knowledge of hybrid ML techniques for agriculture gained | |
| Thursday | 11/12/25 | Analysis of model performance metrics — precision, recall, F1, AUC | Performance evaluation criteria for all models identified | |
| Friday | 12/12/25 | Environment setup for ML — TensorFlow, LightGBM, scikit-learn, pandas | Required ML libraries installed and configured | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 2

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 15/12/25 | Exploratory data analysis of mandi price dataset (3.5M+ records) | Data distributions, seasonal patterns, and outliers understood | |
| Tuesday | 16/12/25 | Study of LightGBM algorithm for tabular data prediction | LightGBM hyperparameters and training pipeline understood | |
| Wednesday | 17/12/25 | Research on MobileNetV2 architecture for image classification | Transfer learning approach for disease detection planned | |
| Thursday | 18/12/25 | Analysis of crop lifecycle data from crop_lifecycle.json | Crop stages, growth periods, and risk windows documented | |
| Friday | 19/12/25 | Data preprocessing plan — missing values, encoding, normalization | Complete preprocessing pipeline for all models designed | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 3

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 22/12/25 | Feature engineering — physics-informed features (GDD, VPD, Drought Index) | Growing Degree Days and Vapour Pressure Deficit features computed | |
| Tuesday | 23/12/25 | Feature engineering — temporal features (seasonality, lag, rolling stats) | 30-day rolling averages and seasonal decomposition added | |
| Wednesday | 24/12/25 | Data splitting strategy — train/validation/test with temporal ordering | Time-aware split ensuring no data leakage implemented | |
| Thursday | 25/12/25 | Initial Crop Risk Advisor model training with LightGBM | Baseline model achieving 72% accuracy on validation set | |
| Friday | 26/12/25 | Focal-loss inspired class weighting for high-risk crop detection | Class weighting scheme from MT-CYP-Net paper applied | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 4

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 29/12/25 | Hyperparameter tuning of Crop Risk Advisor — learning rate, depth, leaves | Optimized LightGBM config with best validation score | |
| Tuesday | 30/12/25 | Crop Risk Advisor evaluation — confusion matrix, classification report | High-risk recall improved by 3.1% with focal-loss weighting | |
| Wednesday | 31/12/25 | Design of Price Intelligence Engine — multi-horizon prediction approach | 7-day, 14-day, and 30-day forecast architecture planned | |
| Thursday | 01/01/26 | Feature engineering for price prediction — price lags, volume, seasonal | Commodity-specific feature sets for price models created | |
| Friday | 02/01/26 | Initial Price Intelligence Engine training for Maharashtra commodities | Baseline price prediction model trained on top 10 commodities | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 5

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 05/01/26 | Conformal prediction implementation for prediction intervals | 80/90/95% confidence intervals on price forecasts working | |
| Tuesday | 06/01/26 | Multi-horizon price model training (7-day, 14-day, 30-day) | Three separate forecast models trained and validated | |
| Wednesday | 07/01/26 | Price model evaluation — MAE, RMSE, and interval coverage | Coverage rates: 80% interval = 82.3%, 90% = 91.1%, 95% = 96.2% | |
| Thursday | 08/01/26 | Preparation of Crop Disease dataset — 17 classes, image organization | 17-class dataset with Corn, Potato, Rice, Sugarcane, Wheat organized | |
| Friday | 09/01/26 | Image augmentation pipeline — rotation, flip, zoom, brightness | Training data augmented 5x with realistic transformations | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 6

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 12/01/26 | MobileNetV2 transfer learning — loading pretrained ImageNet weights | Base model loaded with frozen feature extraction layers | |
| Tuesday | 13/01/26 | Custom classification head design — GlobalAveragePooling + Dense layers | 17-class output head with dropout regularization added | |
| Wednesday | 14/01/26 | Disease detection model training — 50 epochs with early stopping | Training accuracy 94.2%, validation accuracy 91.8% achieved | |
| Thursday | 15/01/26 | Fine-tuning top layers of MobileNetV2 for domain adaptation | Validation accuracy improved to 93.5% after fine-tuning | |
| Friday | 16/01/26 | Model evaluation — per-class precision, recall, and confusion matrix | All 17 classes achieving >85% F1 score confirmed | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 7

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 19/01/26 | Model size optimization — quantization and pruning of disease detector | Model size reduced from 22 MB to ~14 MB with minimal accuracy loss | |
| Tuesday | 20/01/26 | TensorFlow Lite conversion for mobile-optimized inference | TFLite model generated for on-device prediction | |
| Wednesday | 21/01/26 | TFJS conversion for web-based disease detection | TensorFlow.js model exported for browser inference | |
| Thursday | 22/01/26 | Model serving pipeline — FastAPI endpoint for image prediction | /predict endpoint accepting image upload and returning disease class | |
| Friday | 23/01/26 | Batch inference testing on unseen disease images | Model correctly identifying diseases on 50 new test images | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 8

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 26/01/26 | Crop Risk Advisor integration with weather forecast features | Risk model using live 16-day weather forecast for prediction | |
| Tuesday | 27/01/26 | Price Intelligence Engine integration with latest mandi data | Price model predictions updated with most recent market data | |
| Wednesday | 28/01/26 | Cross-validation of all 3 models with k-fold strategy | Consistent performance across folds — no overfitting detected | |
| Thursday | 29/01/26 | Model versioning and artifact management in models/ directory | All model files, configs, and metrics saved with version tags | |
| Friday | 30/01/26 | End-to-end ML pipeline testing — data → features → prediction | Complete ML pipeline running without errors on fresh data | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 9

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 02/02/26 | Model optimization plan documentation | MODEL_OPTIMIZATION_PLAN.md with all strategies documented | |
| Tuesday | 03/02/26 | Optimization execution — feature selection, hyperparameter refinement | Top features identified, redundant features removed | |
| Wednesday | 04/02/26 | Optimization results documentation and benchmarking | OPTIMIZATION_RESULTS.md with before/after comparisons | |
| Thursday | 05/02/26 | Crop risk training report generation with detailed metrics | crop_risk_training_report.md with all training details | |
| Friday | 06/02/26 | Model robustness testing — adversarial inputs, edge cases | Models handling noisy data, missing values gracefully | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 10

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 09/02/26 | Production model deployment — model files to Render server | All 3 models serving predictions in production | |
| Tuesday | 10/02/26 | Model inference latency optimization in production | Disease detection <500ms, price/risk prediction <100ms | |
| Wednesday | 11/02/26 | A/B testing of model versions with production traffic | Latest model versions outperforming baselines confirmed | |
| Thursday | 12/02/26 | Model monitoring — tracking prediction distribution shifts | Alerting setup for data drift detection | |
| Friday | 13/02/26 | Model documentation — architecture, training, evaluation details | Complete model cards for all 3 models written | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 11

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 16/02/26 | User feedback analysis on model predictions | Prediction accuracy validated by sample farmer feedback | |
| Tuesday | 17/02/26 | Retraining models with additional data collected in January | Model accuracy improved with larger training dataset | |
| Wednesday | 18/02/26 | Final model evaluation and comparison table for report | Chapter 6 results table with all metrics prepared | |
| Thursday | 19/02/26 | ML training flow and results diagrams for capstone report | ml_training_flow.png, crop_risk_results.png created | |
| Friday | 20/02/26 | Preparation of ML pipeline walkthrough for capstone demo | Live demo of model training and prediction ready | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**

---

## WEEK: 12

| Day | Date | Activity Carried Out | Achievement of milestone/step as per plan | Remark of Faculty |
|-----------|----------|------------------------------------------|-------------------------------------------|-------------------|
| Monday | 23/02/26 | Final model accuracy verification on production data | All models meeting target accuracy thresholds | |
| Tuesday | 24/02/26 | Model export and backup — SavedModel, TFLite, TFJS formats | All model formats archived for submission | |
| Wednesday | 25/02/26 | Literature survey comparison table for capstone report | lit_survey_comparison.png with paper vs implementation mapping | |
| Thursday | 26/02/26 | Practice presentation of ML components and results | Confident explanation of model choices and performance | |
| Friday | 27/02/26 | Final submission — model artifacts, training logs, evaluation reports | All ML deliverables submitted and archived | |

**Dated Signature of Faculty** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Dated Signature of HOD**
