import { GLOBAL_RU, GLOBAL_EN } from "./contexts/global";
import { EVENT_RU, EVENT_EN } from "./contexts/event";
import { EXPERT_RU, EXPERT_EN } from "./contexts/expert";
import { MEMBER_RU, MEMBER_EN } from "./contexts/member";
import { CUSTODY_RU, CUSTODY_EN } from "./contexts/custody";
import { BRAND_RU, BRAND_EN } from "./contexts/brand";
import { BRAND_SEARCH_RU, BRAND_SEARCH_EN } from "./contexts/brandSearch";
import { BRAND_UNIFIED_RU, BRAND_UNIFIED_EN } from "./contexts/brandUnified";
import { BRAND_CREATE_RU, BRAND_CREATE_EN } from "./contexts/brandCreate";
import { EVENT_CREATE_RU, EVENT_CREATE_EN } from "./contexts/eventCreate";
import { COMMUNITY_RU, COMMUNITY_EN } from "./contexts/community";
import {
  COMMUNITY_LIST_RU,
  COMMUNITY_LIST_EN,
} from "./contexts/communityList";

export type ContextKey =
  | "global"
  | "event"
  | "expert"
  | "member"
  | "custody"
  | "brand"
  | "brand_search"
  | "brand_unified"
  | "brand_create"
  | "event_create"
  | "community"
  | "community_list";

export const RULES_RU: Record<ContextKey, string> = {
  global: GLOBAL_RU,
  event: EVENT_RU,
  expert: EXPERT_RU,
  member: MEMBER_RU,
  custody: CUSTODY_RU,
  brand: BRAND_RU,
  brand_search: BRAND_SEARCH_RU,
  brand_unified: BRAND_UNIFIED_RU,
  brand_create: BRAND_CREATE_RU,
  event_create: EVENT_CREATE_RU,
  community: COMMUNITY_RU,
  community_list: COMMUNITY_LIST_RU,
};

export const RULES_EN: Record<ContextKey, string> = {
  global: GLOBAL_EN,
  event: EVENT_EN,
  expert: EXPERT_EN,
  member: MEMBER_EN,
  custody: CUSTODY_EN,
  brand: BRAND_EN,
  brand_search: BRAND_SEARCH_EN,
  brand_unified: BRAND_UNIFIED_EN,
  brand_create: BRAND_CREATE_EN,
  event_create: EVENT_CREATE_EN,
  community: COMMUNITY_EN,
  community_list: COMMUNITY_LIST_EN,
};

export function getSystemPrompt(
  lang: "ru" | "en",
  contextKey: ContextKey
): string {
  const rules = lang === "ru" ? RULES_RU : RULES_EN;
  return rules[contextKey] ?? rules.global;
}
