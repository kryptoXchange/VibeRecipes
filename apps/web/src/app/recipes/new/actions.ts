"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const lines = (v: FormDataEntryValue | null) =>
  String(v ?? "").split("\n").map((l) => l.trim()).filter(Boolean);

export async function createRecipe(formData: FormData) {
  const user = await getCurrentUser();
  const title = String(formData.get("title") ?? "").trim();
  const ingredients = lines(formData.get("ingredients"));
  const steps = lines(formData.get("steps"));
  if (!title || ingredients.length === 0 || steps.length === 0) {
    throw new Error("Title, ingredients and steps are required");
  }

  const recipe = await db.recipe.create({
    data: {
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      ingredients: ingredients.map((name) => ({ name })),
      authorId: user.id,
      steps: { create: steps.map((text, i) => ({ position: i + 1, text })) },
    },
  });
  redirect(`/recipes/${recipe.id}`);
}
