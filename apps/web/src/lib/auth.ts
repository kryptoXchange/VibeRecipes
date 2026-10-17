import { redirect } from "next/navigation";
import { db } from "./db";
import { readSessionUserId } from "./session";

const select = { id: true, email: true, name: true } as const;

export async function getOptionalUser() {
  const id = await readSessionUserId();
  return id ? db.user.findUnique({ where: { id }, select }) : null;
}

// Use in pages and actions that need a signed-in user; sends visitors to /login.
export async function getCurrentUser() {
  const user = await getOptionalUser();
  if (!user) redirect("/login");
  return user;
}
