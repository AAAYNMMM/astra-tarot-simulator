# Changelog

## Unreleased

- Added four question output contracts across all 90 stable question IDs: expectation alignment, situation map, action prompt and comparison support.
- Added pre-draw expectation and criterion selection without allowing either to affect cards, orientations or engine evidence.
- Added discrete `SSS`–`E` expectation-alignment grades with explicit process, stability, agency, burden, evidence and conflict caps; non-graded modes remain neutral.
- Reworked the comprehensive view to show only whole-spread reasoning while retaining card meanings in the single-card view.
- Added independent, replayable A/B timeline streams with criterion-focused evidence and no combined score or automatic winner.
- Persisted assessment snapshots and added a 24-hour repeated-reading reality-check prompt.
- Added 90-policy validation, a 72-case pilot, comparison/invariance/UI integration tests, and updated Chrome/Edge offline browser coverage.

## 2.1.0 — 2026-08-01

- Replaced the default long-form reading with a concise Schema 4.0.0 result backed by stable evidence references.
- Fixed legitimate “可能” text and common-noun card names being rejected by rendered-text validation.
- Reconciled final verdicts with outcome-position risk and retained the original draw on retryable failures.
- Changed the reading Worker to core-only warm-up with on-demand question and drawn-card profiles.
- Reduced shuffle time, parallelized dealing and batched reveal-all animation.
- Added user-facing Chinese history summaries and moved internal scores and codes under technical details.
- Fixed all four manifest PNG icons at the real HTTP boundary and hardened Windows browser-profile cleanup.
- Added the 56,160-case real-data generation matrix and four-spread browser-flow performance checks.

## 2.0.0 — 2026-08-01

- Replaced the legacy synthesis path with the deterministic Observation → Relation → Claim → Text engine.
- Added 78-card structured semantics, 90 fixed questions and four fixed spread operators.
- Added independent draw, orientation and rendering random streams with replay metadata.
- Added IndexedDB history, idempotent legacy migration, verified import/export and quota degradation.
- Added evaluation governance, 552 committed development cases and a 48-case controlled blind result.
- Added unified recovery, diagnostics, keyboard and screen-reader support.
- Added atomic PWA staging, controlled multi-tab activation, previous-release rollback and independent deck caches.
- Added performance, privacy, compatibility, license and release evidence.
