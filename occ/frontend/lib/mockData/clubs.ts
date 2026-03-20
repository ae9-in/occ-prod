import { Club, ClubEvent, ClubGalleryItem, ClubMember } from "@/lib/dataProvider";

export interface ClubRecord extends Club {
  tagline: string;
  fullDescription: string;
  bannerImage: string;
  profileImage: string;
  location: string;
  university: string;
  membersCount: number;
  eventsCount: number;
  members: ClubMember[];
  events: ClubEvent[];
  gallery: ClubGalleryItem[];
  isJoined?: boolean;
  isOwner?: boolean;
  visibility?: "PUBLIC" | "PRIVATE";
  membershipRole?: "OWNER" | "ADMIN" | "MEMBER" | null;
  hasPendingJoinRequest?: boolean;
  canJoin?: boolean;
  canRequestToJoin?: boolean;
  canLeave?: boolean;
  canEdit?: boolean;
  canPost?: boolean;
}

export const mockClubs: ClubRecord[] = [];
