"use client";

import api from "@/lib/api";
import { normalizeAssetUrl } from "@/lib/assetUrl";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  university: string;
  createdAt?: string;
  profilePicture?: string;
  phoneNumber?: string;
  hobbies?: string;
  role?: string;
}

interface ApiUserResponse {
  id: string;
  email?: string;
  role?: string;
  createdAt?: string;
  profile?: {
    displayName?: string | null;
    university?: string | null;
    avatarUrl?: string | null;
    phoneNumber?: string | null;
    hobbies?: string | null;
  } | null;
}

interface AuthEnvelope {
  data: {
    user: ApiUserResponse;
    accessToken?: string;
    refreshToken?: string;
  };
}

interface CurrentProfileEnvelope {
  data: {
    user: ApiUserResponse;
    memberships?: Array<{
      id: string;
      membershipRole: string;
      joinedAt: string;
      club: {
        id: string;
        slug?: string | null;
        name: string;
        description?: string | null;
        university?: string | null;
        logoUrl?: string | null;
        category?: {
          name?: string | null;
        } | null;
      } | null;
    }>;
  };
}

export interface RegisterStudentInput {
  displayName: string;
  university: string;
  phoneNumber: string;
  email: string;
  password: string;
}

export const mapApiUserToSessionUser = (user: ApiUserResponse): SessionUser => ({
  id: user.id,
  email: user.email || "",
  name: user.profile?.displayName || user.email || "Admin",
  university: user.profile?.university || "",
  createdAt: user.createdAt,
  profilePicture: normalizeAssetUrl(user.profile?.avatarUrl) || undefined,
  phoneNumber: user.profile?.phoneNumber || undefined,
  hobbies: user.profile?.hobbies || undefined,
  role: user.role,
});

export async function loginWithPassword(email: string, password: string) {
  const response = await api.post<AuthEnvelope>("/auth/login", { email, password });
  return {
    user: mapApiUserToSessionUser(response.data.data.user),
    accessToken: response.data.data.accessToken || "",
    refreshToken: response.data.data.refreshToken || "",
  };
}

export async function registerStudent(input: RegisterStudentInput) {
  const response = await api.post<AuthEnvelope>("/auth/register", input);
  return {
    user: mapApiUserToSessionUser(response.data.data.user),
    accessToken: response.data.data.accessToken || "",
    refreshToken: response.data.data.refreshToken || "",
  };
}

export async function refreshSession(refreshToken: string) {
  const response = await api.post<AuthEnvelope>("/auth/refresh", { refreshToken });
  return {
    user: mapApiUserToSessionUser(response.data.data.user),
    accessToken: response.data.data.accessToken || "",
    refreshToken: response.data.data.refreshToken || "",
  };
}

export async function fetchCurrentUser() {
  const response = await api.get<AuthEnvelope>("/auth/me");
  return mapApiUserToSessionUser(response.data.data.user);
}

export async function fetchCurrentProfile() {
  const response = await api.get<CurrentProfileEnvelope>("/users/me");
  return {
    user: mapApiUserToSessionUser(response.data.data.user),
    memberships: (response.data.data.memberships || [])
      .filter((item) => item.club)
      .map((item) => ({
        id: item.club!.id,
        slug: item.club!.slug || item.club!.id,
        name: item.club!.name,
        role: item.membershipRole,
        logo: normalizeAssetUrl(item.club!.logoUrl, "/globe.svg") || "/globe.svg",
        description: item.club!.description || "",
        university: item.club!.university || "",
        category: item.club!.category?.name || "",
        joinedAt: item.joinedAt,
      })),
  };
}
