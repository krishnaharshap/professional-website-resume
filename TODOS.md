# TODOS

Deferred scope from the 2026-07-01 /autoplan review (CEO/Design/Eng phases).

## P2 - Promote design spec to DESIGN.md
- What: Extract the Design Specification section of PLAN.md into a standalone DESIGN.md.
- Why: Future design changes calibrate against a named system instead of a plan appendix.
- Context: Tokens, type, spacing, motion, and component states are fully specified in PLAN.md Phase 2.
- Effort: S (CC: ~5min)

## P2 - Privacy-friendly analytics (taste decision, gate item)
- What: Add GoatCounter or Plausible beacon.
- Why: Both review voices flagged that without visitor signal the site's job-search value is unmeasurable (do recruiters click GitHub? bounce on slide 1?).
- Cons: Third-party script on a privacy-positioned site; GoatCounter is free and cookieless.
- Effort: S (CC: ~10min). Blocked by: user privacy decision at the final gate.

## P3 - GitHub profile README mirroring the site positioning
- What: Pinned-repo cleanup + profile README with the same risk-based positioning, metrics, and live report links.
- Why: Both voices: recruiters weigh GitHub profile above the portfolio site; highest-leverage funnel work outside this repo.
- Context: Belongs to the github.com/krishnaharshap profile repo, not this one.
- Effort: M (CC: ~20min in a separate session)

## P3 - Per-JD resume variants / role-targeted landing anchors
- What: SDET vs QA Automation vs Hybrid QA landing anchors or JSON variants.
- Why: Codex CEO voice: conversion benefits from role-specific positioning.
- Effort: M-L. Depends on: JSON schema shipped in this rebuild (already designed to extend).

## P3 - Live GitHub Actions status widget (beyond static badge)
- What: Client-side workflow-run fetch with graceful degradation.
- Why: Deferred at CEO phase: unauth API rate limits; static badge.svg shipped instead.
- Effort: M

## P3 - Bilingual (EN/FR) version
- What: Language toggle + translated resume-data-fr.json.
- Why: Calgary/Canada bilingual employers; outside current blast radius.
- Effort: L
