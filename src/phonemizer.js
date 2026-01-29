/**
 * Phonemizer for Piper TTS using espeak-ng IPA phonemes
 *
 * This provides English text-to-phoneme conversion compatible with Piper models.
 */

// Comprehensive pronunciation dictionary using espeak-ng IPA format
// Format: word -> IPA phoneme string
const LEXICON = {
  // Articles & Determiners
  'a': 'ə',
  'an': 'æn',
  'the': 'ðə',
  'this': 'ðɪs',
  'that': 'ðæt',
  'these': 'ðiːz',
  'those': 'ðoʊz',
  'some': 'sʌm',
  'any': 'ɛni',
  'no': 'noʊ',
  'every': 'ɛvɹi',
  'each': 'iːtʃ',
  'all': 'ɔːl',
  'both': 'boʊθ',
  'few': 'fjuː',
  'many': 'mɛni',
  'much': 'mʌtʃ',
  'other': 'ʌðɚ',
  'another': 'ənʌðɚ',

  // Pronouns
  'i': 'aɪ',
  'me': 'miː',
  'my': 'maɪ',
  'mine': 'maɪn',
  'myself': 'maɪsɛlf',
  'you': 'juː',
  'your': 'jɔːɹ',
  'yours': 'jɔːɹz',
  'yourself': 'jɔːɹsɛlf',
  'he': 'hiː',
  'him': 'hɪm',
  'his': 'hɪz',
  'himself': 'hɪmsɛlf',
  'she': 'ʃiː',
  'her': 'hɜːɹ',
  'hers': 'hɜːɹz',
  'herself': 'hɜːɹsɛlf',
  'it': 'ɪt',
  'its': 'ɪts',
  'itself': 'ɪtsɛlf',
  'we': 'wiː',
  'us': 'ʌs',
  'our': 'aʊɹ',
  'ours': 'aʊɹz',
  'ourselves': 'aʊɹsɛlvz',
  'they': 'ðeɪ',
  'them': 'ðɛm',
  'their': 'ðɛɹ',
  'theirs': 'ðɛɹz',
  'themselves': 'ðɛmsɛlvz',
  'who': 'huː',
  'whom': 'huːm',
  'whose': 'huːz',
  'what': 'wɑːt',
  'which': 'wɪtʃ',
  'where': 'wɛɹ',
  'when': 'wɛn',
  'why': 'waɪ',
  'how': 'haʊ',

  // Common verbs - be
  'be': 'biː',
  'am': 'æm',
  'is': 'ɪz',
  'are': 'ɑːɹ',
  'was': 'wɑːz',
  'were': 'wɜːɹ',
  'been': 'bɪn',
  'being': 'biːɪŋ',

  // Common verbs - have
  'have': 'hæv',
  'has': 'hæz',
  'had': 'hæd',
  'having': 'hævɪŋ',

  // Common verbs - do
  'do': 'duː',
  'does': 'dʌz',
  'did': 'dɪd',
  'done': 'dʌn',
  'doing': 'duːɪŋ',

  // Modal verbs
  'will': 'wɪl',
  'would': 'wʊd',
  'shall': 'ʃæl',
  'should': 'ʃʊd',
  'can': 'kæn',
  'could': 'kʊd',
  'may': 'meɪ',
  'might': 'maɪt',
  'must': 'mʌst',

  // Common verbs
  'go': 'ɡoʊ',
  'goes': 'ɡoʊz',
  'went': 'wɛnt',
  'gone': 'ɡɔːn',
  'going': 'ɡoʊɪŋ',
  'come': 'kʌm',
  'comes': 'kʌmz',
  'came': 'keɪm',
  'coming': 'kʌmɪŋ',
  'get': 'ɡɛt',
  'gets': 'ɡɛts',
  'got': 'ɡɑːt',
  'getting': 'ɡɛtɪŋ',
  'make': 'meɪk',
  'makes': 'meɪks',
  'made': 'meɪd',
  'making': 'meɪkɪŋ',
  'know': 'noʊ',
  'knows': 'noʊz',
  'knew': 'nuː',
  'known': 'noʊn',
  'knowing': 'noʊɪŋ',
  'think': 'θɪŋk',
  'thinks': 'θɪŋks',
  'thought': 'θɔːt',
  'thinking': 'θɪŋkɪŋ',
  'take': 'teɪk',
  'takes': 'teɪks',
  'took': 'tʊk',
  'taken': 'teɪkən',
  'taking': 'teɪkɪŋ',
  'see': 'siː',
  'sees': 'siːz',
  'saw': 'sɔː',
  'seen': 'siːn',
  'seeing': 'siːɪŋ',
  'want': 'wɑːnt',
  'wants': 'wɑːnts',
  'wanted': 'wɑːntɪd',
  'wanting': 'wɑːntɪŋ',
  'use': 'juːz',
  'uses': 'juːzɪz',
  'used': 'juːzd',
  'using': 'juːzɪŋ',
  'find': 'faɪnd',
  'finds': 'faɪndz',
  'found': 'faʊnd',
  'finding': 'faɪndɪŋ',
  'give': 'ɡɪv',
  'gives': 'ɡɪvz',
  'gave': 'ɡeɪv',
  'given': 'ɡɪvən',
  'giving': 'ɡɪvɪŋ',
  'tell': 'tɛl',
  'tells': 'tɛlz',
  'told': 'toʊld',
  'telling': 'tɛlɪŋ',
  'say': 'seɪ',
  'says': 'sɛz',
  'said': 'sɛd',
  'saying': 'seɪɪŋ',
  'work': 'wɜːɹk',
  'works': 'wɜːɹks',
  'worked': 'wɜːɹkt',
  'working': 'wɜːɹkɪŋ',
  'call': 'kɔːl',
  'calls': 'kɔːlz',
  'called': 'kɔːld',
  'calling': 'kɔːlɪŋ',
  'try': 'tɹaɪ',
  'tries': 'tɹaɪz',
  'tried': 'tɹaɪd',
  'trying': 'tɹaɪɪŋ',
  'ask': 'æsk',
  'asks': 'æsks',
  'asked': 'æskt',
  'asking': 'æskɪŋ',
  'need': 'niːd',
  'needs': 'niːdz',
  'needed': 'niːdɪd',
  'needing': 'niːdɪŋ',
  'feel': 'fiːl',
  'feels': 'fiːlz',
  'felt': 'fɛlt',
  'feeling': 'fiːlɪŋ',
  'become': 'bɪkʌm',
  'becomes': 'bɪkʌmz',
  'became': 'bɪkeɪm',
  'becoming': 'bɪkʌmɪŋ',
  'leave': 'liːv',
  'leaves': 'liːvz',
  'left': 'lɛft',
  'leaving': 'liːvɪŋ',
  'put': 'pʊt',
  'puts': 'pʊts',
  'putting': 'pʊtɪŋ',
  'mean': 'miːn',
  'means': 'miːnz',
  'meant': 'mɛnt',
  'meaning': 'miːnɪŋ',
  'keep': 'kiːp',
  'keeps': 'kiːps',
  'kept': 'kɛpt',
  'keeping': 'kiːpɪŋ',
  'let': 'lɛt',
  'lets': 'lɛts',
  'letting': 'lɛtɪŋ',
  'begin': 'bɪɡɪn',
  'begins': 'bɪɡɪnz',
  'began': 'bɪɡæn',
  'begun': 'bɪɡʌn',
  'beginning': 'bɪɡɪnɪŋ',
  'seem': 'siːm',
  'seems': 'siːmz',
  'seemed': 'siːmd',
  'seeming': 'siːmɪŋ',
  'help': 'hɛlp',
  'helps': 'hɛlps',
  'helped': 'hɛlpt',
  'helping': 'hɛlpɪŋ',
  'show': 'ʃoʊ',
  'shows': 'ʃoʊz',
  'showed': 'ʃoʊd',
  'shown': 'ʃoʊn',
  'showing': 'ʃoʊɪŋ',
  'hear': 'hɪɹ',
  'hears': 'hɪɹz',
  'heard': 'hɜːɹd',
  'hearing': 'hɪɹɪŋ',
  'play': 'pleɪ',
  'plays': 'pleɪz',
  'played': 'pleɪd',
  'playing': 'pleɪɪŋ',
  'run': 'ɹʌn',
  'runs': 'ɹʌnz',
  'ran': 'ɹæn',
  'running': 'ɹʌnɪŋ',
  'move': 'muːv',
  'moves': 'muːvz',
  'moved': 'muːvd',
  'moving': 'muːvɪŋ',
  'live': 'lɪv',
  'lives': 'lɪvz',
  'lived': 'lɪvd',
  'living': 'lɪvɪŋ',
  'believe': 'bɪliːv',
  'believes': 'bɪliːvz',
  'believed': 'bɪliːvd',
  'believing': 'bɪliːvɪŋ',

  // Prepositions
  'to': 'tuː',
  'of': 'ʌv',
  'in': 'ɪn',
  'for': 'fɔːɹ',
  'on': 'ɑːn',
  'with': 'wɪð',
  'at': 'æt',
  'by': 'baɪ',
  'from': 'fɹʌm',
  'up': 'ʌp',
  'about': 'əbaʊt',
  'into': 'ɪntuː',
  'over': 'oʊvɚ',
  'after': 'æftɚ',
  'beneath': 'bɪniːθ',
  'under': 'ʌndɚ',
  'above': 'əbʌv',

  // Conjunctions
  'and': 'ænd',
  'or': 'ɔːɹ',
  'but': 'bʌt',
  'if': 'ɪf',
  'because': 'bɪkɔːz',
  'as': 'æz',
  'until': 'ʌntɪl',
  'while': 'waɪl',
  'although': 'ɔːlðoʊ',
  'though': 'ðoʊ',
  'since': 'sɪns',
  'unless': 'ənlɛs',
  'than': 'ðæn',
  'so': 'soʊ',
  'then': 'ðɛn',

  // Adjectives
  'good': 'ɡʊd',
  'new': 'nuː',
  'first': 'fɜːɹst',
  'last': 'læst',
  'long': 'lɔːŋ',
  'great': 'ɡɹeɪt',
  'little': 'lɪtəl',
  'own': 'oʊn',
  'old': 'oʊld',
  'right': 'ɹaɪt',
  'big': 'bɪɡ',
  'high': 'haɪ',
  'different': 'dɪfɹənt',
  'small': 'smɔːl',
  'large': 'lɑːɹdʒ',
  'next': 'nɛkst',
  'early': 'ɜːɹli',
  'young': 'jʌŋ',
  'important': 'ɪmpɔːɹtənt',
  'public': 'pʌblɪk',
  'bad': 'bæd',
  'same': 'seɪm',
  'able': 'eɪbəl',

  // Adverbs
  'not': 'nɑːt',
  'very': 'vɛɹi',
  'also': 'ɔːlsoʊ',
  'just': 'dʒʌst',
  'only': 'oʊnli',
  'now': 'naʊ',
  'here': 'hɪɹ',
  'there': 'ðɛɹ',
  'today': 'tədeɪ',
  'well': 'wɛl',
  'back': 'bæk',
  'even': 'iːvən',
  'still': 'stɪl',
  'never': 'nɛvɚ',
  'always': 'ɔːlweɪz',
  'often': 'ɔːfən',
  'again': 'əɡɛn',
  'really': 'ɹɪli',
  'already': 'ɔːlɹɛdi',
  'maybe': 'meɪbi',
  'perhaps': 'pɚhæps',
  'yes': 'jɛs',
  'yet': 'jɛt',
  'too': 'tuː',

  // Nouns - common
  'time': 'taɪm',
  'year': 'jɪɹ',
  'people': 'piːpəl',
  'way': 'weɪ',
  'day': 'deɪ',
  'man': 'mæn',
  'woman': 'wʊmən',
  'child': 'tʃaɪld',
  'children': 'tʃɪldɹən',
  'world': 'wɜːɹld',
  'life': 'laɪf',
  'hand': 'hænd',
  'part': 'pɑːɹt',
  'place': 'pleɪs',
  'case': 'keɪs',
  'week': 'wiːk',
  'company': 'kʌmpəni',
  'system': 'sɪstəm',
  'program': 'pɹoʊɡɹæm',
  'question': 'kwɛstʃən',
  'work': 'wɜːɹk',
  'government': 'ɡʌvɚnmənt',
  'number': 'nʌmbɚ',
  'night': 'naɪt',
  'point': 'pɔɪnt',
  'home': 'hoʊm',
  'water': 'wɔːtɚ',
  'room': 'ɹuːm',
  'mother': 'mʌðɚ',
  'area': 'ɛɹiə',
  'money': 'mʌni',
  'story': 'stɔːɹi',
  'fact': 'fækt',
  'month': 'mʌnθ',
  'lot': 'lɑːt',
  'study': 'stʌdi',
  'book': 'bʊk',
  'eye': 'aɪ',
  'job': 'dʒɑːb',
  'word': 'wɜːɹd',
  'business': 'bɪznəs',
  'issue': 'ɪʃuː',
  'side': 'saɪd',
  'kind': 'kaɪnd',
  'head': 'hɛd',
  'house': 'haʊs',
  'service': 'sɜːɹvɪs',
  'friend': 'fɹɛnd',
  'father': 'fɑːðɚ',
  'power': 'paʊɚ',
  'hour': 'aʊɚ',
  'game': 'ɡeɪm',
  'line': 'laɪn',
  'end': 'ɛnd',
  'member': 'mɛmbɚ',
  'law': 'lɔː',
  'car': 'kɑːɹ',
  'city': 'sɪti',
  'community': 'kəmjuːnɪti',
  'name': 'neɪm',
  'president': 'pɹɛzɪdənt',
  'team': 'tiːm',
  'minute': 'mɪnɪt',
  'idea': 'aɪdiə',
  'body': 'bɑːdi',
  'information': 'ɪnfɚmeɪʃən',
  'thing': 'θɪŋ',
  'things': 'θɪŋz',

  // Greetings & expressions
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

  // Tech words
  'test': 'tɛst',
  'testing': 'tɛstɪŋ',
  'text': 'tɛkst',
  'speech': 'spiːtʃ',
  'browser': 'bɹaʊzɚ',
  'computer': 'kəmpjuːtɚ',
  'software': 'sɔːftwɛɹ',
  'internet': 'ɪntɚnɛt',
  'website': 'wɛbsaɪt',
  'application': 'æplɪkeɪʃən',
  'technology': 'tɛknɑːlədʒi',
  'data': 'deɪtə',
  'file': 'faɪl',
  'audio': 'ɔːdioʊ',
  'video': 'vɪdioʊ',
  'model': 'mɑːdəl',
  'piper': 'paɪpɚ',
};

// Fallback letter-to-phoneme rules for unknown words
const LETTER_RULES = {
  'a': 'æ',
  'b': 'b',
  'c': 'k',
  'd': 'd',
  'e': 'ɛ',
  'f': 'f',
  'g': 'ɡ',
  'h': 'h',
  'i': 'ɪ',
  'j': 'dʒ',
  'k': 'k',
  'l': 'l',
  'm': 'm',
  'n': 'n',
  'o': 'ɑː',
  'p': 'p',
  'q': 'k',
  'r': 'ɹ',
  's': 's',
  't': 't',
  'u': 'ʌ',
  'v': 'v',
  'w': 'w',
  'x': 'ks',
  'y': 'i',
  'z': 'z',
};

// Digraph rules
const DIGRAPH_RULES = {
  'th': 'θ',
  'sh': 'ʃ',
  'ch': 'tʃ',
  'ph': 'f',
  'wh': 'w',
  'ng': 'ŋ',
  'ck': 'k',
  'gh': '',
  'kn': 'n',
  'wr': 'ɹ',
  'ee': 'iː',
  'ea': 'iː',
  'oo': 'uː',
  'ou': 'aʊ',
  'ow': 'oʊ',
  'ai': 'eɪ',
  'ay': 'eɪ',
  'oi': 'ɔɪ',
  'oy': 'ɔɪ',
  'er': 'ɚ',
  'ir': 'ɜːɹ',
  'ur': 'ɜːɹ',
  'ar': 'ɑːɹ',
  'or': 'ɔːɹ',
};

/**
 * Initialize phonemizer (no-op, kept for compatibility)
 */
export async function initPhonemizerData() {
  // No initialization needed for rule-based phonemizer
}

/**
 * Convert a single word to phonemes
 */
function wordToPhonemes(word) {
  word = word.toLowerCase();

  // Check dictionary first
  if (LEXICON[word]) {
    return LEXICON[word];
  }

  // Apply rules for unknown words
  let phonemes = '';
  let i = 0;

  while (i < word.length) {
    // Check for digraphs first
    if (i < word.length - 1) {
      const digraph = word.slice(i, i + 2);
      if (DIGRAPH_RULES[digraph] !== undefined) {
        phonemes += DIGRAPH_RULES[digraph];
        i += 2;
        continue;
      }
    }

    // Single letter
    const letter = word[i];
    if (LETTER_RULES[letter]) {
      phonemes += LETTER_RULES[letter];
    }
    i++;
  }

  return phonemes;
}

/**
 * Convert text to phoneme string
 */
function textToPhonemes(text) {
  // Normalize text
  text = text.toLowerCase().trim();

  // Tokenize: split into words and punctuation
  const tokens = text.match(/[\w']+|[.,!?;:]/g) || [];

  const phonemeWords = [];

  for (const token of tokens) {
    // Handle punctuation
    if (/^[.,!?;:]$/.test(token)) {
      phonemeWords.push(token);
      continue;
    }

    // Convert word to phonemes
    const phonemes = wordToPhonemes(token);
    if (phonemes) {
      phonemeWords.push(phonemes);
    }
  }

  // Join with spaces
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
 * @returns {number[]} - Array of phoneme IDs
 */
export function textToPhonemeIds(text, config) {
  const phonemeString = textToPhonemes(text);
  console.log('Input text:', text);
  console.log('Phonemes:', phonemeString);
  const ids = phonemesToIds(phonemeString, config);
  console.log('Phoneme IDs:', ids);
  return ids;
}
