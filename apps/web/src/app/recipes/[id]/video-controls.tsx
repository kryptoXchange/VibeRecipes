"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestVideo } from "./actions";

export function GenerateButtons({ recipeId }: { recipeId: string }) {
  const [pending, start] = useTransition();
  const btn = "rounded bg-orange-600 px-3 py-1.5 text-white disabled:opacity-50";
  return (
    <div className="flex gap-2">
      <button className={btn} disabled={pending} onClick={() => start(() => requestVideo(recipeId, "stitched"))}>
        Generate video (stitched)
      </button>
      <button className={btn} disabled={pending} onClick={() => start(() => requestVideo(recipeId, "ai"))}>
        Generate video (AI)
      </button>
    </div>
  );
}

/** Re-fetches the page every 2s while any video is still rendering. */
export function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(t);
  }, [active, router]);
  return null;
}
