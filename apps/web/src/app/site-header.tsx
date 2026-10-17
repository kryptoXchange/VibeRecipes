import Link from "next/link";
import { Suspense } from "react";
import { getOptionalUser } from "@/lib/auth";
import { logout } from "./login/actions";

async function UserNav() {
  const user = await getOptionalUser();
  if (!user) {
    return (
      <>
        <Link href="/login" className="text-sm underline">Log in</Link>
        <Link href="/signup" className="rounded bg-orange-600 px-3 py-1.5 text-white">Sign up</Link>
      </>
    );
  }
  return (
    <>
      <Link href="/admin/clips" className="text-sm underline">Clip library</Link>
      <Link href="/recipes/new" className="rounded bg-orange-600 px-3 py-1.5 text-white">Post a recipe</Link>
      <span className="text-sm text-neutral-500">{user.name ?? user.email}</span>
      <form action={logout}>
        <button className="text-sm underline">Log out</button>
      </form>
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between p-6 pb-0">
      <Link href="/" className="text-2xl font-semibold">Cooking</Link>
      <nav className="flex items-center gap-4">
        <Suspense fallback={null}>
          <UserNav />
        </Suspense>
      </nav>
    </header>
  );
}
