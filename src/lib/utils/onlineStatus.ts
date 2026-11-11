import { timeAgo } from "./timeAgo";

/** 2 minutes — matches heartbeat (30s) with comfortable buffer */
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export function isOnlineNow(date?: string | Date | null): boolean {
  if (!date) return false;
  return Date.now() - new Date(date).getTime() < ONLINE_THRESHOLD_MS;
}

export function onlineStatus(date?: string | Date | null): string {
  if (!date) return "неизвестно";
  if (isOnlineNow(date)) return "Онлайн";
  return "Был(а) онлайн: " + timeAgo(date);
}
