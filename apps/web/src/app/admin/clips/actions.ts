"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function setClipStatus(id: string, status: "approved" | "rejected") {
  await getCurrentUser(); // TODO: admin check
  await db.clipAsset.update({ where: { id }, data: { status } });
  revalidatePath("/admin/clips");
}
