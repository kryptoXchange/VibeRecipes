import Link from "next/link";
import { db } from "@/lib/db";

export default async function Home() {
  const recipes = await db.recipe.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { author: true, _count: { select: { steps: true, videos: true } } },
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cooking</h1>
        <nav className="flex items-center gap-4">
          <Link href="/admin/clips" className="text-sm underline">Clip library</Link>
          <Link href="/recipes/new" className="rounded bg-orange-600 px-3 py-1.5 text-white">Post a recipe</Link>
        </nav>
      </header>
      {recipes.length === 0 && <p className="text-neutral-500">No recipes yet. Post the first one.</p>}
      <ul className="space-y-3">
        {recipes.map((r) => (
          <li key={r.id} className="rounded border border-neutral-300 p-4 dark:border-neutral-700">
            <Link href={`/recipes/${r.id}`} className="text-lg font-medium hover:underline">{r.title}</Link>
            <p className="text-sm text-neutral-500">
              {r.author.name ?? "unknown"} · {r._count.steps} steps · {r._count.videos} videos
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
