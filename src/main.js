import { encodeWav } from './audio-utils.js';

// DOM elements
const statusEl = document.getElementById('status');
const statusTextEl = document.getElementById('status-text');
const textInput = document.getElementById('text-input');
const generateBtn = document.getElementById('generate-btn');
const downloadBtn = document.getElementById('download-btn');
const audioSection = document.getElementById('audio-section');
const audioPlayer = document.getElementById('audio-player');
const progressEl = document.getElementById('progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

// State
let worker = null;
let currentAudioData = null;
let sampleRate = 22050;

// Initialize worker
function initWorker() {
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

  worker.onmessage = (e) => {
    const { type, ...data } = e.data;

    switch (type) {
      case 'status':
        handleStatus(data);
        break;
      case 'progress':
        handleProgress(data);
        break;
      case 'audio':
        handleAudio(data);
        break;
      case 'error':
        handleError(data);
        break;
    }
  };

  worker.onerror = (err) => {
    console.error('Worker error:', err);
    setStatus('error', `Worker error: ${err.message}`);
  };

  // Start loading the model
  worker.postMessage({ type: 'init' });
}

function handleStatus(data) {
  const { status, backend, message } = data;

  if (status === 'loading') {
    setStatus('loading', message || 'Loading model...');
  } else if (status === 'ready') {
    const backendInfo = backend ? ` (${backend.toUpperCase()})` : '';
    setStatus('ready', `Ready${backendInfo}`);
    textInput.disabled = false;
    generateBtn.disabled = false;
  } else if (status === 'error') {
    setStatus('error', message || 'An error occurred');
  }
}

function handleProgress(data) {
  const { progress, message } = data;
  progressEl.classList.add('visible');
  progressFill.style.width = `${progress}%`;
  progressText.textContent = message || `${progress}%`;
}

function handleAudio(data) {
  const { audio, rate } = data;
  currentAudioData = new Float32Array(audio);
  sampleRate = rate;

  // Play audio
  playAudio(currentAudioData, sampleRate);

  // Enable download
  downloadBtn.disabled = false;

  // Hide progress, show audio
  progressEl.classList.remove('visible');
  audioSection.classList.add('visible');

  // Re-enable generate button
  generateBtn.disabled = false;
  generateBtn.textContent = 'Generate Speech';
}

function handleError(data) {
  const { message } = data;
  setStatus('error', message);
  generateBtn.disabled = false;
  generateBtn.textContent = 'Generate Speech';
  progressEl.classList.remove('visible');
}

function setStatus(type, message) {
  statusEl.className = `status ${type}`;
  statusTextEl.textContent = message;
}

async function playAudio(pcmData, rate) {
  const audioContext = new AudioContext({ sampleRate: rate });
  const audioBuffer = audioContext.createBuffer(1, pcmData.length, rate);
  audioBuffer.getChannelData(0).set(pcmData);

  // Create blob URL for audio element
  const wavBlob = encodeWav(pcmData, rate);
  const url = URL.createObjectURL(wavBlob);

  // Revoke old URL if exists
  if (audioPlayer.src) {
    URL.revokeObjectURL(audioPlayer.src);
  }

  audioPlayer.src = url;
  audioPlayer.play().catch(console.error);
}

function downloadWav() {
  if (!currentAudioData) return;

  const wavBlob = encodeWav(currentAudioData, sampleRate);
  const url = URL.createObjectURL(wavBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'speech.wav';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateSpeech() {
  const text = textInput.value.trim();
  if (!text) {
    setStatus('error', 'Please enter some text');
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';
  progressFill.style.width = '0%';
  progressEl.classList.add('visible');

  worker.postMessage({ type: 'generate', text });
}

// Event listeners
generateBtn.addEventListener('click', generateSpeech);
downloadBtn.addEventListener('click', downloadWav);

// Allow Ctrl+Enter to generate
textInput.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter' && !generateBtn.disabled) {
    generateSpeech();
  }
});

// Initialize
initWorker();
