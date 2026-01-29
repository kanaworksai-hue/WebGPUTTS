import * as ort from 'onnxruntime-web';
import { textToPhonemeIds, initPhonemizerData } from './phonemizer.js';

let session = null;
let modelConfig = null;
let backend = 'unknown';

// Get the base URL for assets
const BASE_URL = self.location.href.includes('/src/')
  ? new URL('..', self.location.href).href
  : new URL('.', self.location.href).href;

async function initModel() {
  postMessage({ type: 'status', status: 'loading', message: 'Loading phonemizer data...' });

  // Initialize phonemizer lookup tables
  await initPhonemizerData();

  postMessage({ type: 'status', status: 'loading', message: 'Loading model configuration...' });

  // Load model config
  const configUrl = new URL('models/en_US-lessac-medium.onnx.json', BASE_URL).href;
  try {
    const configResponse = await fetch(configUrl);
    if (!configResponse.ok) {
      throw new Error(`Failed to load config: ${configResponse.status}`);
    }
    modelConfig = await configResponse.json();
  } catch (err) {
    postMessage({
      type: 'error',
      message: `Failed to load model config. Make sure the model files are in public/models/. Error: ${err.message}`
    });
    return;
  }

  postMessage({ type: 'status', status: 'loading', message: 'Loading ONNX model...' });

  const modelUrl = new URL('models/en_US-lessac-medium.onnx', BASE_URL).href;

  // Try WebGPU first, fallback to WASM
  try {
    // Configure ONNX Runtime WASM paths
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/';

    try {
      // Try WebGPU first
      session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['webgpu'],
        graphOptimizationLevel: 'all',
      });
      backend = 'webgpu';
    } catch (webgpuErr) {
      console.warn('WebGPU not available, falling back to WASM:', webgpuErr);

      // Fallback to WASM
      session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
      backend = 'wasm';
    }

    postMessage({ type: 'status', status: 'ready', backend });
  } catch (err) {
    postMessage({
      type: 'error',
      message: `Failed to load model. Make sure the .onnx file is in public/models/. Error: ${err.message}`
    });
  }
}

async function generateSpeech(text) {
  if (!session || !modelConfig) {
    postMessage({ type: 'error', message: 'Model not loaded' });
    return;
  }

  try {
    postMessage({ type: 'progress', progress: 10, message: 'Converting text to phonemes...' });

    // Convert text to phoneme IDs
    const phonemeIds = textToPhonemeIds(text, modelConfig);

    postMessage({ type: 'progress', progress: 30, message: 'Running inference...' });

    // Prepare input tensors for Piper model
    const inputIds = new BigInt64Array(phonemeIds.map(id => BigInt(id)));
    const inputLengths = new BigInt64Array([BigInt(phonemeIds.length)]);
    const scales = new Float32Array([
      modelConfig.inference?.noise_scale ?? 0.667,
      modelConfig.inference?.length_scale ?? 1.0,
      modelConfig.inference?.noise_w ?? 0.8
    ]);

    const feeds = {
      input: new ort.Tensor('int64', inputIds, [1, phonemeIds.length]),
      input_lengths: new ort.Tensor('int64', inputLengths, [1]),
      scales: new ort.Tensor('float32', scales, [3]),
    };

    postMessage({ type: 'progress', progress: 50, message: 'Generating audio...' });

    // Run inference
    const results = await session.run(feeds);

    postMessage({ type: 'progress', progress: 90, message: 'Processing audio...' });

    // Get audio output
    const audioOutput = results.output.data;
    const sampleRate = modelConfig.audio?.sample_rate ?? 22050;

    // Normalize audio
    let maxAbs = 0;
    for (let i = 0; i < audioOutput.length; i++) {
      maxAbs = Math.max(maxAbs, Math.abs(audioOutput[i]));
    }

    const normalizedAudio = new Float32Array(audioOutput.length);
    const scale = maxAbs > 0 ? 0.95 / maxAbs : 1;
    for (let i = 0; i < audioOutput.length; i++) {
      normalizedAudio[i] = audioOutput[i] * scale;
    }

    postMessage({ type: 'progress', progress: 100, message: 'Done!' });

    // Send audio back to main thread
    postMessage({
      type: 'audio',
      audio: normalizedAudio.buffer,
      rate: sampleRate
    }, [normalizedAudio.buffer]);

  } catch (err) {
    console.error('Generation error:', err);
    postMessage({ type: 'error', message: `Generation failed: ${err.message}` });
  }
}

// Message handler
self.onmessage = async (e) => {
  const { type, ...data } = e.data;

  switch (type) {
    case 'init':
      await initModel();
      break;
    case 'generate':
      await generateSpeech(data.text);
      break;
  }
};
