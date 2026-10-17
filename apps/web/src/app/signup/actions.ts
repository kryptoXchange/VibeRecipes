"use server";

import { redirect } from "next/navigation";
import type { AuthState } from "../login/actions";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name) return { error: "Name is required", email, name };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email", email, name };
  if (password.length < 8) return { error: "Password must be at least 8 characters", email, name };
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "An account with that email already exists", email, name };
  }
  const user = await db.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  redirect("/");
}
