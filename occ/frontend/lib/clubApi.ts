import api from "@/lib/api";
import { normalizeAssetUrl } from "@/lib/assetUrl";
import type { ClubRecord } from "@/lib/mockData/clubs";

export const CLUB_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
] as const;

export const CLUB_IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif";
export const CLUB_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

type ApiClub = {
  id: string;
  slug?: string | null;
  name: string;
  description: string;
  university?: string | null;
  locationName?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  memberCount?: number;
  category?: { name?: string | null } | null;
  isOwner?: boolean;
  isMember?: boolean;
  visibility?: "PUBLIC" | "PRIVATE";
  membershipRole?: "OWNER" | "ADMIN" | "MEMBER" | null;
  hasPendingJoinRequest?: boolean;
  canJoin?: boolean;
  canRequestToJoin?: boolean;
  canLeave?: boolean;
  canEdit?: boolean;
  canPost?: boolean;
};

type ListClubsResponse = {
  data?: {
    items?: ApiClub[];
  };
};

type SingleClubResponse = {
  data?: {
    club?: ApiClub | null;
  };
};

export type ClubUpsertInput = {
  name: string;
  description: string;
  category: string;
  university?: string;
  location?: string;
  logoFile?: File | null;
  bannerFile?: File | null;
  removeLogo?: boolean;
  removeBanner?: boolean;
};

const toTagline = (name: string, description: string) => {
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const firstSentence = trimmedDescription.split(/[.!?]/)[0]?.trim();
  if (firstSentence && firstSentence.length <= 72) {
    return firstSentence;
  }
  return `${trimmedName} starts here.`;
};

export const toClubRecord = (club: ApiClub, fallbackCategory = "Community"): ClubRecord => {
  const resolvedLogo = normalizeAssetUrl(club.logoUrl, "/globe.svg") || "/globe.svg";
  const resolvedDescription = club.description?.trim() || "A new OCC club is taking shape.";
  const resolvedName = club.name?.trim() || "Untitled Club";

  return {
    id: club.id,
    slug: club.slug?.trim() || undefined,
    name: resolvedName,
    description: resolvedDescription,
    tagline: toTagline(resolvedName, resolvedDescription),
    fullDescription: resolvedDescription,
    logo: resolvedLogo,
    bannerImage: normalizeAssetUrl(club.bannerUrl, "") || "",
    profileImage: resolvedLogo,
    category: club.category?.name?.trim() || fallbackCategory,
    location: club.locationName?.trim() || "Campus Hub",
    university: club.university?.trim() || "Independent",
    membersCount: club.memberCount ?? 0,
    eventsCount: 0,
    members: [],
    events: [],
    gallery: [],
    isJoined: !!club.isMember || !!club.isOwner,
    isOwner: !!club.isOwner,
    visibility: club.visibility || "PUBLIC",
    membershipRole: club.membershipRole || null,
    hasPendingJoinRequest: !!club.hasPendingJoinRequest,
    canJoin: !!club.canJoin,
    canRequestToJoin: !!club.canRequestToJoin,
    canLeave: !!club.canLeave,
    canEdit: !!club.canEdit,
    canPost: !!club.canPost,
  };
};

function appendOptionalField(formData: FormData, key: string, value?: string) {
  const trimmed = value?.trim();
  if (trimmed) {
    formData.append(key, trimmed);
  }
}

function buildClubFormData(input: ClubUpsertInput) {
  const formData = new FormData();
  formData.append("name", input.name.trim());
  formData.append("description", input.description.trim());
  appendOptionalField(formData, "university", input.university);
  appendOptionalField(formData, "locationName", input.location);

  if (input.logoFile) {
    formData.append("logo", input.logoFile);
  }

  if (input.bannerFile) {
    formData.append("banner", input.bannerFile);
  }

  if (input.removeLogo) {
    formData.append("removeLogo", "true");
  }

  if (input.removeBanner) {
    formData.append("removeBanner", "true");
  }

  return formData;
}

export async function listClubsFromApi() {
  const response = await api.get<ListClubsResponse>("/clubs");
  return response.data?.data?.items ?? [];
}

export async function joinClubOnApi(clubId: string) {
  await api.post(`/clubs/${clubId}/join`);
}

export async function requestClubJoinOnApi(clubId: string) {
  await api.post(`/clubs/${clubId}/request`);
}

export async function leaveClubOnApi(clubId: string, userId: string) {
  await api.delete(`/clubs/${clubId}/members/${userId}`);
}

export async function createClubOnApi(input: ClubUpsertInput) {
  const response = await api.post<SingleClubResponse>("/clubs", buildClubFormData(input));
  const club = response.data?.data?.club;
  if (!club) {
    throw new Error("Club response did not include a club record.");
  }
  return toClubRecord(club, input.category);
}

export async function updateClubOnApi(clubId: string, input: ClubUpsertInput) {
  const response = await api.patch<SingleClubResponse>(`/clubs/${clubId}`, buildClubFormData(input));
  const club = response.data?.data?.club;
  if (!club) {
    throw new Error("Club response did not include a club record.");
  }
  return toClubRecord(club, input.category);
}
