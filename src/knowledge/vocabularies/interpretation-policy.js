export const INTERPRETATION_POLICY = {
  "version": "1.0.0",
  "runtimeMode": "deterministic-rules-only",
  "principles": [
    "Interpretations are bounded hypotheses, not supernatural fact claims.",
    "Question, position, orientation, and evidence references remain explicit.",
    "Advice uses observable actions, conditions, and stop criteria.",
    "Conflicting evidence is explained, downgraded, or retained; never silently deleted.",
    "RWS-specific imagery never changes cross-deck core semantics."
  ],
  "prohibited": [
    "certain-external-fact",
    "diagnosis",
    "exact-date",
    "financial-guarantee",
    "guaranteed-outcome",
    "mortality-prediction",
    "pregnancy-certainty",
    "third-party-certainty"
  ],
  "sourceRules": {
    "formalSourceRequired": true,
    "unknownSourceRejected": true,
    "publicReferenceMayBeBibliographic": true,
    "verbatimCopyrightTextForbidden": true
  },
  "aliasRules": {
    "aliasesAcceptedAtImportBoundary": true,
    "canonicalStorageRequired": true,
    "publishedProfilesMayNotStoreAliases": true
  }
};
