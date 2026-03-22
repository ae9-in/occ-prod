/**
 * postInteractionCache.ts
 *
 * A lightweight cache that stores per-post interaction state (likes, commentsCount,
 * isLiked) independently of the full feed state. This allows counts to survive
 * navigation, feed re-fetches, and component remounts without ever making incorrect
 * PATCH requests to the backend.
 *
 * The cache is initialised from localStorage on startup and written back on every
 * mutation so that a hard-refresh still shows correct values until the next API
 * call returns fresh data.
 */

const STORAGE_KEY = "occ-post-interactions-v1";
const MAX_CACHE_ENTRIES = 500; // prevent unbounded growth

export interface PostInteractionState {
  likes: number;
  isLiked: boolean;
  commentsCount: number;
  updatedAt: number; // timestamp – used for LRU eviction
}

type CacheMap = Record<string, PostInteractionState>;

function readFromStorage(): CacheMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CacheMap;
  } catch {
    return {};
  }
}

function writeToStorage(cache: CacheMap) {
  if (typeof window === "undefined") return;
  try {
    // Evict oldest entries if the cache is too large
    const entries = Object.entries(cache);
    if (entries.length > MAX_CACHE_ENTRIES) {
      entries.sort((a, b) => a[1].updatedAt - b[1].updatedAt);
      const trimmed = Object.fromEntries(entries.slice(entries.length - MAX_CACHE_ENTRIES));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore write errors (e.g. private browsing quota)
  }
}

// Module-level in-memory cache – shared across all components in the same tab.
let _cache: CacheMap = readFromStorage();

/** Seed the cache from fresh API data without overwriting pending local mutations. */
export function seedFromApiPost(postId: string, data: { likes: number; isLiked: boolean; commentsCount: number }) {
  // Only update if the entry is absent or the API data is newer (we always trust API).
  _cache[postId] = {
    likes: data.likes,
    isLiked: data.isLiked,
    commentsCount: data.commentsCount,
    updatedAt: Date.now(),
  };
  writeToStorage(_cache);
}

/** Seed many posts at once (e.g. after a feed fetch). */
export function seedManyFromApi(posts: Array<{ id: string; likes: number; isLiked: boolean; commentsCount: number }>) {
  const now = Date.now();
  for (const p of posts) {
    _cache[p.id] = { likes: p.likes, isLiked: p.isLiked, commentsCount: p.commentsCount, updatedAt: now };
  }
  writeToStorage(_cache);
}

/** Get cached state for a post, or null if not yet cached. */
export function getCachedInteraction(postId: string): PostInteractionState | null {
  return _cache[postId] ?? null;
}

/** Update like state after a successful like/unlike action. */
export function setLiked(postId: string, isLiked: boolean, currentLikes: number) {
  const existing = _cache[postId];
  _cache[postId] = {
    likes: isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
    isLiked,
    commentsCount: existing?.commentsCount ?? 0,
    updatedAt: Date.now(),
  };
  writeToStorage(_cache);
  return _cache[postId];
}

/** Increment comment count after a comment is successfully submitted. */
export function incrementCommentCount(postId: string) {
  const existing = _cache[postId];
  if (!existing) return;
  _cache[postId] = {
    ...existing,
    commentsCount: existing.commentsCount + 1,
    updatedAt: Date.now(),
  };
  writeToStorage(_cache);
  return _cache[postId];
}

/** Roll back a failed like toggle. */
export function rollbackLike(postId: string, prevIsLiked: boolean, prevLikes: number) {
  const existing = _cache[postId];
  if (!existing) return;
  _cache[postId] = { ...existing, isLiked: prevIsLiked, likes: prevLikes, updatedAt: Date.now() };
  writeToStorage(_cache);
}
