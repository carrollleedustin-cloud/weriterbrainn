/**
 * Build persona-driven prompt hints from User Cognitive Profile.
 */
export function buildPersonaPrompt(profile) {
  if (!profile || typeof profile !== "object") return "";
  const hints = [];

  if (profile.tone) {
    if (profile.tone === "formal") {
      hints.push("Use a formal, professional tone.");
    } else if (profile.tone === "casual") {
      hints.push("Use a casual, conversational tone. Contractions are fine.");
    }
  }

  if (profile.sentence_length_avg != null) {
    hints.push(`User tends to use ~${Math.round(profile.sentence_length_avg)} words per sentence.`);
  }

  if (profile.vocab_diversity != null && profile.vocab_diversity > 0) {
    hints.push(`Vocabulary diversity: ${profile.vocab_diversity.toFixed(2)}.`);
  }

  if (profile.response_length_preference) {
    if (profile.response_length_preference === "brief") {
      hints.push("Keep responses concise.");
    } else if (profile.response_length_preference === "detailed") {
      hints.push("User prefers longer, detailed responses.");
    }
  }

  if (profile.asks_questions_often) {
    hints.push("User often asks questions; address them directly.");
  }

  if (profile.expressive_punctuation) {
    hints.push("User uses expressive punctuation; match energy when appropriate.");
  }

  if (profile.sentiment_tendency === "positive") {
    hints.push("User tends positive; mirror that energy.");
  } else if (profile.sentiment_tendency === "cautious") {
    hints.push("User tends cautious; be measured and supportive.");
  }

  return hints.length ? "\nPersona: " + hints.join(" ") : "";
}
