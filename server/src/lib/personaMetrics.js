/**
 * Extract persona metrics from text.
 * tone_score: 0 = formal, 1 = casual (contractions, casual markers)
 * sentiment_avg: -1 to 1 (negative to positive)
 * question_ratio: 0 to 1
 * exclamation_ratio: 0 to 1
 */

const CASUAL_MARKERS = /\b(yeah|yep|nope|gonna|wanna|gotta|kinda|sorta|dunno|ok|okay|cool|hey|dude|guys)\b/i;
const CONTRACTIONS = /\b(i'm|you're|we're|they're|it's|that's|what's|who's|isn't|aren't|wasn't|weren't|don't|doesn't|didn't|won't|wouldn't|couldn't|shouldn't|can't|couldn't|haven't|hasn't|hadn't|i'll|you'll|we'll|they'll)\b/i;

const POSITIVE_WORDS = new Set(
  "good great excellent amazing wonderful love like happy best nice awesome".split(" ")
);
const NEGATIVE_WORDS = new Set(
  "bad terrible awful horrible hate dislike sad worst poor boring".split(" ")
);

function avgSentenceLength(text) {
  const sents = text.split(/[.!?]+/).filter((s) => s.trim());
  if (!sents.length) return 0;
  const total = sents.reduce(
    (sum, s) => sum + s.trim().split(/\s+/).filter(Boolean).length,
    0
  );
  return total / sents.length;
}

function vocabComplexity(text) {
  const words = (text || "").toLowerCase().match(/\b[a-z]+\b/g) || [];
  if (!words.length) return 0;
  return new Set(words).size / words.length;
}

function toneScore(text) {
  if (!text?.trim()) return 0.5;
  const lower = text.toLowerCase();
  let casual = 0;
  if (CASUAL_MARKERS.test(lower)) casual += 0.4;
  const contractionMatches = lower.match(CONTRACTIONS);
  if (contractionMatches) casual += Math.min(0.4, contractionMatches.length * 0.1);
  const avgLen = avgSentenceLength(text);
  if (avgLen < 8) casual += 0.2;
  return Math.min(1, 0.3 + casual);
}

function sentimentScore(text) {
  const words = (text || "").toLowerCase().match(/\b[a-z]+\b/g) || [];
  if (!words.length) return 0;
  let pos = 0;
  let neg = 0;
  for (const w of words) {
    if (POSITIVE_WORDS.has(w)) pos++;
    if (NEGATIVE_WORDS.has(w)) neg++;
  }
  const total = pos + neg || 1;
  return (pos - neg) / total;
}

function questionRatio(text) {
  const sents = text.split(/[.!?]+/).filter((s) => s.trim());
  if (!sents.length) return 0;
  const questions = (text.match(/\?/g) || []).length;
  return Math.min(1, questions / sents.length);
}

function exclamationRatio(text) {
  const sents = text.split(/[.!?]+/).filter((s) => s.trim());
  if (!sents.length) return 0;
  const excls = (text.match(/!/g) || []).length;
  return Math.min(1, excls / Math.max(1, sents.length));
}

export function extractPersonaMetrics(text) {
  if (!text?.trim()) return {};
  return {
    avg_sentence_length: avgSentenceLength(text),
    vocab_complexity: vocabComplexity(text),
    tone_score: toneScore(text),
    sentiment_avg: sentimentScore(text),
    question_ratio: questionRatio(text),
    avg_message_length: text.trim().split(/\s+/).filter(Boolean).length,
    exclamation_ratio: exclamationRatio(text),
  };
}
