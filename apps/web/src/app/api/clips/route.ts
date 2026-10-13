import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { putObject } from "@/lib/storage";

// Upload a real-footage clip to the library. Plain multipart form post (no server-action size limit).
export async function POST(req: Request) {
  await getCurrentUser(); // TODO: restrict to admins once real auth exists
  const form = await req.formData();
  const file = form.get("file");
  const technique = String(form.get("technique") ?? "").trim().toLowerCase();
  const ingredient = String(form.get("ingredient") ?? "").trim().toLowerCase() || null;
  const durationS = Number(form.get("durationS"));
  if (!(file instanceof File) || file.size === 0 || !technique || !(durationS > 0)) {
    return NextResponse.json({ error: "file, technique and durationS are required" }, { status: 400 });
  }
  const key = `clips/real/${randomUUID()}.mp4`;
  await putObject(key, Buffer.from(await file.arrayBuffer()), file.type || "video/mp4");
  await db.clipAsset.create({
    data: {
      source: "real", file: key, technique, ingredient, durationS,
      description: String(form.get("description") ?? "").trim() || null,
      tags: [technique, ...(ingredient ? [ingredient] : [])],
    },
  });
  return NextResponse.redirect(new URL("/admin/clips", req.url), 303);
}
