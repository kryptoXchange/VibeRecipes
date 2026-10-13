"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function requestVideo(recipeId: string, strategy: "stitched" | "ai") {
  await getCurrentUser();
  if (strategy !== "stitched" && strategy !== "ai") throw new Error("Invalid strategy");
  const recipe = await db.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
  if (!recipe) throw new Error("Recipe not found");
  // The worker polls for rows with status = queued.
  await db.video.create({ data: { recipeId, strategy } });
  revalidatePath(`/recipes/${recipeId}`);
}
