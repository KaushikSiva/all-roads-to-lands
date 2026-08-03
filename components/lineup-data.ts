import type { ArtistCandidate } from "./types";
import { outsideLands2026Featured, outsideLands2026Lineup } from "@/lib/outside-lands-2026";

export { outsideLands2026Featured, outsideLands2026Lineup } from "@/lib/outside-lands-2026";

const displayOrder = [
  ...outsideLands2026Featured,
  ...outsideLands2026Lineup.filter((name) => !outsideLands2026Featured.includes(name as (typeof outsideLands2026Featured)[number])),
];

function demoId(name: string) {
  return `jambase:demo-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

export const demoArtists: ArtistCandidate[] = displayOrder.map((name, index) => ({
  jambaseArtistId: demoId(name),
  name,
  artistUrl: "https://www.jambase.com/festival/outside-lands-2026",
  upcomingEvents: Math.max(4, 42 - index),
}));
