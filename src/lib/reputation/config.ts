// ─── Reputation System Configuration ────────────────────────
// All point values, ranks, trust weights, and anti-farm limits in ONE file.
// Change numbers here — logic in trust.ts / social.ts picks them up.

// ─── Trust Score ────────────────────────────────────────────
// Computed from profile completeness + trust events. Range: 0–100.

export const TRUST_STATIC = {
  HAS_PHOTO: 5,
  HAS_PHONE: 5,
  HAS_CUSTODY: 5,
  IS_SPEAKER: 15,
} as const;

// Trust events stored in CbcTrustEvent (manual / moderation)
export const TRUST_EVENTS = {
  KYC_VERIFIED: 25,
  BRAND_APPROVED: 15,
  COMMUNITY_APPROVED: 15,
  COMPLAINT: -25,
  SPAM: -40,
} as const;

export const TRUST_MIN = 0;
export const TRUST_MAX = 100;

// ─── Trust Weight Multiplier ────────────────────────────────
// Applied when a user's action awards SC to ANOTHER user (likes, comments).
// Higher trust = your likes/comments are worth more.

export const TRUST_MULTIPLIERS = [
  { min: 0, max: 29, multiplier: 0.5 },
  { min: 30, max: 59, multiplier: 1.0 },
  { min: 60, max: 79, multiplier: 1.2 },
  { min: 80, max: 100, multiplier: 1.5 },
] as const;

// ─── Social Capital ─────────────────────────────────────────
// Cumulative points. No upper limit. Stored in CbcSocialLedger + CbcSocialTotal.

export const SC_ACTIONS = {
  EVENT_CREATED: 30,
  BRAND_APPROVED: 30,
  COMMUNITY_APPROVED: 30,
  FOLLOWER_RECEIVED: 3,
  CUSTODY_OPENED: 20,
  COMMUNITY_JOINED: 5,
  EVENT_REGISTRATION_RECEIVED: 5, // someone registered for YOUR event
  REFERRAL_REGISTERED: 10,
  PROFILE_COMPLETED: 15,          // one-time: completed onboarding with photo/bio/location
} as const;

// ─── Social Capital Ranks ───────────────────────────────────

export const SC_RANKS = [
  { min: 0, max: 299, name: "Explorer I" },
  { min: 300, max: 599, name: "Explorer II" },
  { min: 600, max: 899, name: "Explorer III" },
  { min: 900, max: 1199, name: "Mentor I" },
  { min: 1200, max: 1499, name: "Mentor II" },
  { min: 1500, max: 1999, name: "Leader I" },
  { min: 2000, max: Infinity, name: "Leader II" },
] as const;

// ─── Anti-Farm Limits ───────────────────────────────────────

export const ANTI_FARM = {
  MIN_ACCOUNT_AGE_DAYS_FOR_LIKES: 7,
  DECAY_INACTIVE_DAYS: 60,
  DECAY_PERCENT: 5,
} as const;
