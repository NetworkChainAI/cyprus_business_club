export function photoSrc(photo?: string | null, width?: number): string | null {
  if (!photo) return null;

  if (
    photo.startsWith("http://") ||
    photo.startsWith("https://") ||
    photo.startsWith("data:")
  ) {
    return photo;
  }

  const file = photo.split("/").pop();
  if (!file) return null;

  let url = `/api/photo/${encodeURIComponent(file)}`;
  if (width) url += `?w=${width}`;
  return url;
}

export function resolveUserPhoto(user: any, width?: number): string | null {
  return photoSrc(user?.info?.photo ?? null, width);
}

export function userAvatarOrFallback(user: any, width?: number): string {
  const src = resolveUserPhoto(user, width);
  if (src) return src;

  const name = user?.info?.name || user?.email || "User";
  return "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(name);
}
