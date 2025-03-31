
export interface NostrProfile {
  npub: string;
  pubkey: string;
  name?: string;
  name?: string;  // Keep this as snake_case for consistency
  picture?: string;
  about?: string;
  website?: string;
  lud16?: string;
  banner?: string;
  relays: string[];
  content?: string;  // Added content field to support raw profile event content
}

export interface FollowList {
  follows: string[];
}

export const DEFAULT_PROFILE: NostrProfile = {
  npub: "npub1Default",
  pubkey: "Default",
  name: "BookVerse User",
  name: "Bookworm",
  picture: "https://i.pravatar.cc/300",
  about: "I love books!",
  relays: []
};
