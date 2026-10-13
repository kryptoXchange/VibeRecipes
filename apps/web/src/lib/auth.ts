import { db } from "./db";

// TODO: replace with Auth.js. Until then every request acts as a single dev user.
export async function getCurrentUser() {
  return db.user.upsert({
    where: { email: "dev@cooking.local" },
    update: {},
    create: { email: "dev@cooking.local", name: "Dev Cook" },
  });
}
