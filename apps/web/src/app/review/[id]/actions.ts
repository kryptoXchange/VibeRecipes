"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const score = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 5) throw new Error("Scores must be 1-5");
  return n;
};

// One overall rating per reviewer per video; resubmitting replaces it.
export async function rateVideo(videoId: string, recipeId: string, formData: FormData) {
  const user = await getCurrentUser();
  const data = {
    videoId,
    reviewerId: user.id,
    techniqueCorrect: score(formData.get("techniqueCorrect")),
    ingredientsRight: score(formData.get("ingredientsRight")),
    clarity: score(formData.get("clarity")),
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
  await db.$transaction([
    db.rating.deleteMany({ where: { videoId, reviewerId: user.id, stepPosition: null } }),
    db.rating.create({ data }),
  ]);
  revalidatePath(`/review/${recipeId}`);
}
