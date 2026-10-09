export const SUPPORTED_LANGUAGES = [
  {
    code: 'en-IN',
    label: 'English (India)',
    nativeLabel: 'English (India)',
    recognitionLang: 'en-IN',
    synthesisLocales: ['en-IN', 'en-GB', 'en-US'],
    isIndianProfile: true,
    preferredGender: 'male',
    testPhrase: 'Hello Boss! AiRus Indian English voice synthesis is functioning smoothly.'
  },
  {
    code: 'te-IN',
    label: 'Telugu',
    nativeLabel: 'తెలుగు (Telugu)',
    recognitionLang: 'te-IN',
    synthesisLocales: ['te-IN', 'te'],
    isIndianProfile: true,
    preferredGender: 'male',
    testPhrase: 'నమస్కారం బాస్! AiRus వాయిస్ సేవలు సిద్ధంగా ఉన్నాయి.'
  },
  {
    code: 'hi-IN',
    label: 'Hindi',
    nativeLabel: 'हिन्दी (Hindi)',
    recognitionLang: 'hi-IN',
    synthesisLocales: ['hi-IN', 'hi'],
    isIndianProfile: true,
    preferredGender: 'male',
    testPhrase: 'नमस्ते बॉस! AiRus वॉइस असिस्टेंट तैयार है.'
  },
  {
    code: 'en-US',
    label: 'English (US)',
    nativeLabel: 'English (US)',
    recognitionLang: 'en-US',
    synthesisLocales: ['en-US', 'en-CA', 'en'],
    isIndianProfile: false,
    preferredGender: 'neutral',
    testPhrase: 'Hello Boss! AiRus global voice synthesis ready.'
  }
];

export function getLanguageProfile(code) {
  if (!code) return SUPPORTED_LANGUAGES[0];
  const found = SUPPORTED_LANGUAGES.find(
    (l) => l.code.toLowerCase() === code.toLowerCase()
  );
  return found || SUPPORTED_LANGUAGES[0];
}

export function getDefaultLanguage() {
  return SUPPORTED_LANGUAGES[0]; // English (India) is default target
}
