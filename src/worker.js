import * as ort from 'onnxruntime-web';
import { textToPhonemeIds, initPhonemizerData } from './phonemizer.js';

let session = null;
let modelConfig = null;
let backend = 'unknown';
let baseUrl = '';

async function initModel(providedBaseUrl) {
  // Use provided base URL from main thread
  baseUrl = providedBaseUrl || '';
  postMessage({ type: 'status', status: 'loading', message: 'Loading phonemizer data...' });

  // Initialize phonemizer lookup tables
  await initPhonemizerData();

  postMessage({ type: 'status', status: 'loading', message: 'Loading model configuration...' });

  // Load model config
  const configUrl = `${baseUrl}models/en_US-lessac-medium.onnx.json`;
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

  const modelUrl = `${baseUrl}models/en_US-lessac-medium.onnx`;

  try {
    // Configure ONNX Runtime WASM paths
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.3/dist/';
    ort.env.wasm.numThreads = 1;

    // Fetch model as ArrayBuffer
    postMessage({ type: 'status', status: 'loading', message: 'Downloading model...' });
    const modelResponse = await fetch(modelUrl);
    if (!modelResponse.ok) {
      throw new Error(`Failed to fetch model: ${modelResponse.status}`);
    }
    const modelBuffer = await modelResponse.arrayBuffer();

    postMessage({ type: 'status', status: 'loading', message: 'Initializing inference session...' });

    // Create session with WASM backend (WebGPU is still experimental)
    session = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    backend = 'wasm';

    postMessage({ type: 'status', status: 'ready', backend });
  } catch (err) {
    console.error('Model load error:', err);
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
      await initModel(data.baseUrl);
      break;
    case 'generate':
      await generateSpeech(data.text);
      break;
  }
};
