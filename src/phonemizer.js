/**
 * Phonemizer for Piper TTS using espeak-ng IPA phonemes
 *
 * This provides English text-to-phoneme conversion compatible with Piper models.
 * Uses phonemizer.js which wraps espeak-ng via WebAssembly.
 */

import { phonemize } from 'phonemizer';

// Language to use for phonemization (en-us matches the model)
const LANGUAGE = 'en-us';

// Minimal fallback lexicon for when WASM fails to load
const FALLBACK_LEXICON = {
  'hello': 'həloʊ',
  'hi': 'haɪ',
  'hey': 'heɪ',
  'goodbye': 'ɡʊdbaɪ',
  'bye': 'baɪ',
  'please': 'pliːz',
  'thank': 'θæŋk',
  'thanks': 'θæŋks',
  'sorry': 'sɑːɹi',
  'okay': 'oʊkeɪ',
  'ok': 'oʊkeɪ',
  'welcome': 'wɛlkəm',
  'test': 'tɛst',
  'the': 'ðə',
  'a': 'ə',
  'an': 'æn',
  'is': 'ɪz',
  'are': 'ɑːɹ',
  'you': 'juː',
  'i': 'aɪ',
  'world': 'wɜːɹld',
  'quick': 'kwɪk',
  'brown': 'bɹaʊn',
  'fox': 'fɑːks',
  'jumps': 'dʒʌmps',
  'over': 'oʊvɚ',
  'lazy': 'leɪzi',
  'dog': 'dɔːɡ',
};

let wasmAvailable = false;
let initializationAttempted = false;

/**
 * Initialize phonemizer - tests if WASM is available
 */
export async function initPhonemizerData() {
  if (initializationAttempted) return;

  initializationAttempted = true;

  try {
    // Test if phonemizer works by trying to phonemize a simple word
    const result = await phonemize('test', LANGUAGE);
    if (result && result.length > 0) {
      wasmAvailable = true;
      console.log('Phonemizer WASM module loaded successfully');
    }
  } catch (err) {
    console.warn('Failed to load phonemizer WASM, using fallback lexicon:', err.message);
    wasmAvailable = false;
  }
}

/**
 * Convert a single word using fallback lexicon
 */
function fallbackWordToPhonemes(word) {
  word = word.toLowerCase();
  return FALLBACK_LEXICON[word] || null;
}

/**
 * Convert text to phoneme string using available method
 */
async function textToPhonemes(text) {
  // Normalize text
  text = text.trim();

  if (wasmAvailable) {
    try {
      // Use espeak-ng via phonemizer.js
      // Returns array of phoneme strings, join them
      const result = await phonemize(text, LANGUAGE);
      if (result && result.length > 0) {
        return result.join(' ');
      }
    } catch (err) {
      console.warn('Phonemization failed, falling back:', err.message);
      wasmAvailable = false;
    }
  }

  // Fallback: simple lexicon lookup for each word
  const words = text.toLowerCase().match(/[\w']+/g) || [];
  const phonemeWords = [];

  for (const word of words) {
    const phonemes = fallbackWordToPhonemes(word);
    if (phonemes) {
      phonemeWords.push(phonemes);
    } else {
      // For unknown words, just use the word itself (will be skipped in ID conversion)
      console.warn('Unknown word in fallback lexicon:', word);
    }
  }

  return phonemeWords.join(' ');
}

/**
 * Convert phoneme string to IDs using model config
 */
function phonemesToIds(phonemeString, config) {
  const idMap = config?.phoneme_id_map || {};
  const ids = [];

  // Add BOS (beginning of sequence) token
  if (idMap['^']) {
    ids.push(idMap['^'][0]);
  }

  // Convert each phoneme character
  // espeak-ng phonemes can be multi-character (e.g., ˈ, ː, æ, ð, ŋ, etc.)
  // We process character by character since the phoneme_id_map includes all IPA chars
  for (const char of phonemeString) {
    if (idMap[char]) {
      ids.push(idMap[char][0]);
    }
    // Skip unknown characters silently
  }

  // Add EOS (end of sequence) token
  if (idMap['$']) {
    ids.push(idMap['$'][0]);
  }

  return ids;
}

/**
 * Convert text to phoneme IDs for Piper model
 * @param {string} text - Input text
 * @param {object} config - Model configuration with phoneme_id_map
 * @returns {Promise<number[]>} - Array of phoneme IDs
 */
export async function textToPhonemeIds(text, config) {
  const phonemeString = await textToPhonemes(text);
  console.log('Input text:', text);
  console.log('Phonemes:', phonemeString);
  const ids = phonemesToIds(phonemeString, config);
  console.log('Phoneme IDs:', ids);
  return ids;
}
