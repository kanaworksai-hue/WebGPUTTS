/**
 * Simple phonemizer for Piper TTS
 *
 * This is a simplified rule-based phonemizer for English text.
 * For production use, consider using espeak-ng WASM for more accurate results.
 */

// Piper phoneme symbols - these map to the model's vocabulary
// The IDs come from the model's config phoneme_id_map
let PHONEME_ID_MAP = null;

// Special tokens
const PAD = '_';
const BOS = '^';
const EOS = '$';

/**
 * Initialize phonemizer data from model config or defaults
 */
export async function initPhonemizerData() {
  // Default phoneme map matching Piper's espeak-ng output
  // This will be overwritten by the model config if available
  PHONEME_ID_MAP = {
    '_': 0, '^': 1, '$': 2,
    ' ': 3, '!': 4, "'": 5, '(': 6, ')': 7, ',': 8, '-': 9, '.': 10, ':': 11, ';': 12, '?': 13,
    'a': 14, 'b': 15, 'c': 16, 'd': 17, 'e': 18, 'f': 19, 'g': 20, 'h': 21, 'i': 22, 'j': 23,
    'k': 24, 'l': 25, 'm': 26, 'n': 27, 'o': 28, 'p': 29, 'q': 30, 'r': 31, 's': 32, 't': 33,
    'u': 34, 'v': 35, 'w': 36, 'x': 37, 'y': 38, 'z': 39,
    'æ': 40, 'ç': 41, 'ð': 42, 'ø': 43, 'ŋ': 44, 'œ': 45, 'ɐ': 46, 'ɑ': 47, 'ɒ': 48, 'ɔ': 49,
    'ə': 50, 'ɚ': 51, 'ɛ': 52, 'ɜ': 53, 'ɡ': 54, 'ɪ': 55, 'ɬ': 56, 'ɹ': 57, 'ɾ': 58, 'ʃ': 59,
    'ʊ': 60, 'ʌ': 61, 'ʒ': 62, 'ˈ': 63, 'ˌ': 64, 'ː': 65, '̃': 66, '̩': 67, 'θ': 68, 'ᵻ': 69,
  };
}

/**
 * Basic English grapheme-to-phoneme rules
 * This is a simplified approximation - real Piper uses espeak-ng
 */
const G2P_RULES = {
  // Common words with irregular pronunciation
  'the': 'ðə',
  'a': 'ə',
  'an': 'æn',
  'is': 'ɪz',
  'are': 'ɑːɹ',
  'was': 'wɒz',
  'were': 'wɜːɹ',
  'have': 'hæv',
  'has': 'hæz',
  'had': 'hæd',
  'do': 'duː',
  'does': 'dʌz',
  'did': 'dɪd',
  'will': 'wɪl',
  'would': 'wʊd',
  'could': 'kʊd',
  'should': 'ʃʊd',
  'can': 'kæn',
  'may': 'meɪ',
  'might': 'maɪt',
  'must': 'mʌst',
  'shall': 'ʃæl',
  'to': 'tuː',
  'of': 'ɒv',
  'in': 'ɪn',
  'for': 'fɔːɹ',
  'on': 'ɒn',
  'with': 'wɪð',
  'at': 'æt',
  'by': 'baɪ',
  'from': 'fɹɒm',
  'or': 'ɔːɹ',
  'and': 'ænd',
  'but': 'bʌt',
  'not': 'nɒt',
  'you': 'juː',
  'this': 'ðɪs',
  'that': 'ðæt',
  'it': 'ɪt',
  'he': 'hiː',
  'she': 'ʃiː',
  'we': 'wiː',
  'they': 'ðeɪ',
  'i': 'aɪ',
  'me': 'miː',
  'my': 'maɪ',
  'your': 'jɔːɹ',
  'his': 'hɪz',
  'her': 'hɜːɹ',
  'our': 'aʊɹ',
  'their': 'ðeɹ',
  'what': 'wɒt',
  'which': 'wɪtʃ',
  'who': 'huː',
  'how': 'haʊ',
  'when': 'wen',
  'where': 'weɹ',
  'why': 'waɪ',
  'hello': 'həˈloʊ',
  'hi': 'haɪ',
  'hey': 'heɪ',
  'yes': 'jes',
  'no': 'noʊ',
  'please': 'pliːz',
  'thank': 'θæŋk',
  'thanks': 'θæŋks',
  'sorry': 'sɒɹi',
  'okay': 'oʊˈkeɪ',
  'ok': 'oʊˈkeɪ',
  'test': 'test',
  'text': 'tekst',
  'speech': 'spiːtʃ',
  'browser': 'bɹaʊzɚ',
  'running': 'ɹʌnɪŋ',
  'piper': 'paɪpɚ',
  'system': 'sɪstəm',
};

/**
 * Simple letter-to-phoneme fallback mapping
 */
const LETTER_PHONEMES = {
  'a': 'æ', 'b': 'b', 'c': 'k', 'd': 'd', 'e': 'ɛ', 'f': 'f', 'g': 'ɡ', 'h': 'h',
  'i': 'ɪ', 'j': 'dʒ', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'ɒ', 'p': 'p',
  'q': 'k', 'r': 'ɹ', 's': 's', 't': 't', 'u': 'ʌ', 'v': 'v', 'w': 'w', 'x': 'ks',
  'y': 'j', 'z': 'z',
};

/**
 * Convert text to phoneme string
 */
function textToPhonemes(text) {
  // Normalize text
  text = text.toLowerCase().trim();

  // Split into words and punctuation
  const tokens = text.match(/[\w']+|[.,!?;:]/g) || [];

  const phonemes = [];
  for (const token of tokens) {
    // Check if it's punctuation
    if (/^[.,!?;:]$/.test(token)) {
      phonemes.push(token);
      continue;
    }

    // Try dictionary lookup first
    if (G2P_RULES[token]) {
      phonemes.push(G2P_RULES[token]);
    } else {
      // Fallback: convert each letter
      let wordPhonemes = '';
      for (const char of token) {
        if (LETTER_PHONEMES[char]) {
          wordPhonemes += LETTER_PHONEMES[char];
        }
      }
      if (wordPhonemes) {
        phonemes.push(wordPhonemes);
      }
    }
  }

  return phonemes.join(' ');
}

/**
 * Convert phoneme string to IDs using model config
 */
function phonemesToIds(phonemeString, config) {
  // Use model's phoneme_id_map if available
  const idMap = config?.phoneme_id_map || PHONEME_ID_MAP;

  const ids = [];

  // Add BOS token
  if (idMap[BOS] !== undefined) {
    ids.push(idMap[BOS]);
  }

  // Convert each phoneme character
  for (const char of phonemeString) {
    if (idMap[char] !== undefined) {
      ids.push(idMap[char]);
    } else if (char === ' ' && idMap[' '] !== undefined) {
      ids.push(idMap[' ']);
    }
    // Skip unknown characters
  }

  // Add EOS token
  if (idMap[EOS] !== undefined) {
    ids.push(idMap[EOS]);
  }

  return ids;
}

/**
 * Convert text to phoneme IDs for Piper model
 * @param {string} text - Input text
 * @param {object} config - Model configuration with phoneme_id_map
 * @returns {number[]} - Array of phoneme IDs
 */
export function textToPhonemeIds(text, config) {
  const phonemeString = textToPhonemes(text);
  console.log('Phonemes:', phonemeString);
  return phonemesToIds(phonemeString, config);
}
