/**
 * On-device Crop Disease Detection using TensorFlow.js
 * ====================================================
 * Runs the MobileNetV2 model locally in the browser/WebView.
 * Used as PRIMARY inference on Capacitor (APK) and as fallback when server is down.
 *
 * Model: MobileNetV2 fine-tuned on 17 crop disease classes
 * Input:  224×224×3 RGB image (pixel values 0-255, MobileNetV2 preprocessing applied)
 * Output: 17 class probabilities (softmax)
 */

import * as tf from '@tensorflow/tfjs';

// ── Model metadata (matches metadata.json) ──────────────────────────────────

const CLASS_NAMES = [
  'Corn___Common_Rust',
  'Corn___Gray_Leaf_Spot',
  'Corn___Healthy',
  'Corn___Northern_Leaf_Blight',
  'Potato___Early_Blight',
  'Potato___Healthy',
  'Potato___Late_Blight',
  'Rice___Brown_Spot',
  'Rice___Healthy',
  'Rice___Leaf_Blast',
  'Rice___Neck_Blast',
  'Sugarcane_Bacterial Blight',
  'Sugarcane_Healthy',
  'Sugarcane_Red Rot',
  'Wheat___Brown_Rust',
  'Wheat___Healthy',
  'Wheat___Yellow_Rust',
];

const IMG_SIZE = 224;
const MODEL_ACCURACY = 0.9347; // 93.47% validation accuracy

const KNOWN_CROPS = ['Corn', 'Potato', 'Rice', 'Sugarcane', 'Wheat'];

// ── Singleton model instance ─────────────────────────────────────────────────

let _model: tf.LayersModel | null = null;
let _loading = false;
let _loadError: string | null = null;

/**
 * Load the TF.js model. Safe to call multiple times (lazy singleton).
 * The model files are in /models/crop_disease/model.json + shards.
 */
export async function loadModel(): Promise<tf.LayersModel> {
  if (_model) return _model;
  if (_loading) {
    // Wait for in-progress load
    while (_loading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (_model) return _model;
    throw new Error(_loadError || 'Model load failed');
  }

  _loading = true;
  _loadError = null;

  try {
    console.log('[CropDisease] Loading TF.js model...');

    // Determine model URL based on environment
    let modelUrl: string;
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      // Capacitor: model is bundled in the app assets
      modelUrl = '/models/crop_disease/model.json';
    } else {
      // Browser: served from public/
      modelUrl = '/models/crop_disease/model.json';
    }

    _model = await tf.loadLayersModel(modelUrl);
    console.log('[CropDisease] Model loaded successfully');
    return _model;
  } catch (err: any) {
    _loadError = err.message || 'Failed to load model';
    console.error('[CropDisease] Model load error:', err);
    throw err;
  } finally {
    _loading = false;
  }
}

/**
 * Check if the model can be loaded (files exist).
 */
export function isModelLoaded(): boolean {
  return _model !== null;
}

// ── Class name parsing ───────────────────────────────────────────────────────

function parseClassName(className: string): { crop: string; disease: string } {
  // Try triple-underscore separator first (most classes)
  if (className.includes('___')) {
    const [crop, disease] = className.split('___', 2);
    return { crop, disease };
  }
  // Fallback: match known crop prefixes (Sugarcane uses single underscore)
  for (const crop of KNOWN_CROPS) {
    if (className.startsWith(crop + '_') || className.startsWith(crop + ' ')) {
      const disease = className.slice(crop.length + 1);
      return { crop, disease };
    }
  }
  return { crop: className, disease: 'Unknown' };
}

// ── Image preprocessing ──────────────────────────────────────────────────────

/**
 * Convert a File/Blob to a preprocessed tensor ready for MobileNetV2.
 * MobileNetV2 expects pixel values in [-1, 1] range.
 */
async function preprocessImage(imageFile: File | Blob): Promise<tf.Tensor4D> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const tensor = tf.tidy(() => {
          // Create tensor from image
          const raw = tf.browser.fromPixels(img); // [h, w, 3] uint8
          // Resize to 224x224
          const resized = tf.image.resizeBilinear(raw, [IMG_SIZE, IMG_SIZE]);
          // Cast to float32 (values 0-255)
          const float32 = resized.toFloat();
          // MobileNetV2 preprocessing: scale from [0, 255] to [-1, 1]
          // tf.keras.applications.mobilenet_v2.preprocess_input does: x / 127.5 - 1
          const preprocessed = float32.div(127.5).sub(1);
          // Add batch dimension
          return preprocessed.expandDims(0) as tf.Tensor4D;
        });
        resolve(tensor);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
}

// ── Fallback advice (when server/Gemini unavailable) ─────────────────────────

function generateLocalAdvice(crop: string, disease: string, confidence: number) {
  const isHealthy = disease.toLowerCase().includes('healthy');

  if (isHealthy) {
    return {
      status: 'healthy',
      summary: `Your ${crop} crop appears healthy.`,
      description: `The on-device AI analysis indicates your ${crop} crop is in good condition with ${(confidence * 100).toFixed(1)}% confidence. No diseases were detected. Continue monitoring regularly.`,
      preventive_tips: [
        'Continue regular watering and fertilization',
        'Monitor for any changes in leaf color or texture',
        'Maintain proper spacing between plants for air circulation',
        'Schedule next check in 1-2 weeks',
      ],
      recommended_actions: [
        'Continue current farming practices',
        'For detailed expert advice, ensure internet connectivity',
      ],
    };
  } else {
    const displayDisease = disease.replace(/_/g, ' ');
    return {
      status: 'diseased',
      disease_name: displayDisease,
      summary: `Possible ${displayDisease} detected in your ${crop} crop.`,
      description: `The on-device AI detected signs of ${displayDisease} in your ${crop} crop with ${(confidence * 100).toFixed(1)}% confidence. For detailed treatment guidance, connect to the internet to get AI-powered expert advice.`,
      causes: 'Connect to the internet for detailed cause analysis',
      symptoms: [`Signs of ${displayDisease} detected on leaves`],
      treatment: [
        {
          method: 'Consult Expert',
          name: 'Professional Consultation',
          details:
            'Visit your nearest agricultural extension office or connect to the internet for AI-powered treatment recommendations.',
        },
      ],
      preventive_tips: [
        'Isolate affected plants if possible',
        'Ensure proper drainage and air circulation',
        'Connect to internet for AI-powered detailed advice',
      ],
      severity: confidence > 0.85 ? 'moderate' : 'mild',
      recommended_actions: [
        'Take photos and consult a local agricultural officer',
        'Connect to internet for detailed Gemini AI advice',
      ],
    };
  }
}

// ── Main inference function ──────────────────────────────────────────────────

export interface LocalDiseaseResult {
  crop: string;
  disease: string | null;
  is_healthy: boolean;
  predicted_class: string;
  confidence: number;
  top_predictions: Array<{ class: string; confidence: number }>;
  advice: any;
  model_accuracy: number;
  inference_mode: 'on-device';
}

/**
 * Run crop disease detection entirely on-device.
 * Returns the same response format as the server API.
 */
export async function analyzeLocally(imageFile: File | Blob): Promise<LocalDiseaseResult> {
  // Ensure model is loaded
  const model = await loadModel();

  // Preprocess image
  const inputTensor = await preprocessImage(imageFile);

  try {
    // Run inference
    const output = model.predict(inputTensor) as tf.Tensor;
    const predictions = await output.data();
    output.dispose();

    // Get top prediction
    const predsArray = Array.from(predictions);
    const topIdx = predsArray.indexOf(Math.max(...predsArray));
    const confidence = predsArray[topIdx];
    const predictedClass = CLASS_NAMES[topIdx];

    // Get top 3
    const indexed = predsArray.map((p, i) => ({ prob: p, idx: i }));
    indexed.sort((a, b) => b.prob - a.prob);
    const top3 = indexed.slice(0, 3).map((item) => ({
      class: CLASS_NAMES[item.idx],
      confidence: Math.round(item.prob * 1000) / 10, // one decimal %
    }));

    // Parse crop and disease
    const { crop, disease } = parseClassName(predictedClass);
    const isHealthy = disease.toLowerCase().includes('healthy');

    // Generate local fallback advice
    const advice = generateLocalAdvice(crop, disease, confidence);

    return {
      crop,
      disease: isHealthy ? null : disease.replace(/_/g, ' '),
      is_healthy: isHealthy,
      predicted_class: predictedClass,
      confidence: Math.round(confidence * 1000) / 10,
      top_predictions: top3,
      advice,
      model_accuracy: Math.round(MODEL_ACCURACY * 1000) / 10,
      inference_mode: 'on-device',
    };
  } finally {
    inputTensor.dispose();
  }
}

/**
 * Preload the model in the background (call on app startup).
 * Silently fails if model files are not available.
 */
export async function preloadModel(): Promise<boolean> {
  try {
    await loadModel();
    return true;
  } catch {
    return false;
  }
}
