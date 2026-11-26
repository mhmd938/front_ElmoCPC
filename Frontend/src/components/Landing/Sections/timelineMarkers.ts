import red from "@/assets/birds/red.svg?url";
import egg from "@/assets/pigs/timeline/egg.webp";
import king from "@/assets/pigs/timeline/king_pig.webp";
import defeatedKing from "@/assets/pigs/timeline/king_pig_defeated.webp";
import normal from "@/assets/pigs/timeline/normal_pig.webp";
import defeatedNormal from "@/assets/pigs/timeline/normal_pig_defeated.webp";
import old from "@/assets/pigs/timeline/old_pig.webp";
import defeatedOld from "@/assets/pigs/timeline/old_pig_defeated.webp";

export type TimelineStatus = "done" | "active" | "upcoming";
export type TimelineMarkerRole = "normal" | "old" | "king" | "egg";

const pigMarkers = {
  normal: { done: defeatedNormal, upcoming: normal },
  old: { done: defeatedOld, upcoming: old },
  king: { done: defeatedKing, upcoming: king },
};

export function getTimelineMarker(
  status: TimelineStatus,
  role: TimelineMarkerRole = "normal",
): string {
  if (role === "egg") return egg;
  if (status === "active") return red;

  return pigMarkers[role][status];
}
