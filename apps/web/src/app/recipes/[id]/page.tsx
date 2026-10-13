import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AutoRefresh, GenerateButtons } from "./video-controls";

const SOURCE_LABEL = { real: "Real footage", ai: "AI-generated", placeholder: "Placeholder" } as const;
const SOURCE_STYLE = {
  real: "bg-green-100 text-green-800",
  ai: "bg-purple-100 text-purple-800",
  placeholder: "bg-neutral-200 text-neutral-700",
} as const;

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await db.recipe.findUnique({
    where: { id },
    include: { steps: { orderBy: { position: "asc" } }, author: true, videos: { orderBy: { createdAt: "desc" } } },
  });
  if (!recipe) notFound();
  const ingredients = recipe.ingredients as { name: string }[];

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-semibold">{recipe.title}</h1>
      <p className="text-sm text-neutral-500">by {recipe.author.name ?? "unknown"}</p>
      {recipe.description && <p className="mt-3">{recipe.description}</p>}

      <section className="mt-6 space-y-4">
        <GenerateButtons recipeId={recipe.id} />
        <a href={`/review/${recipe.id}`} className="inline-block text-sm underline">Compare stitched vs AI side by side →</a>
        <AutoRefresh active={recipe.videos.some((v) => v.status === "queued" || v.status === "running")} />
        {recipe.videos.length === 0 && <p className="text-sm text-neutral-500">No videos yet.</p>}
        {recipe.videos.map((v) => (
          <div key={v.id} className="rounded border border-neutral-300 p-3 dark:border-neutral-700">
            <p className="mb-2 text-sm text-neutral-500">
              {v.strategy} · {v.status}
              {v.renderSeconds != null && ` · rendered in ${v.renderSeconds.toFixed(1)}s`}
              {v.costUsd != null && ` · $${v.costUsd.toFixed(2)}`}
            </p>
            {v.status === "done" && v.url && <video src={v.url} controls className="w-full rounded" />}
            {v.status === "done" && Array.isArray(v.stepSources) && (
              <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                {(v.stepSources as { position: number; source: "real" | "ai" | "placeholder" }[]).map((s) => (
                  <li key={s.position} className={`rounded px-2 py-0.5 ${SOURCE_STYLE[s.source]}`}>
                    Step {s.position}: {SOURCE_LABEL[s.source]}
                  </li>
                ))}
              </ul>
            )}
            {v.status === "failed" && <p className="text-sm text-red-600">Failed: {v.error}</p>}
          </div>
        ))}
      </section>

      <h2 className="mt-6 text-xl font-medium">Ingredients</h2>
      <ul className="list-disc pl-6">{ingredients.map((i, n) => <li key={n}>{i.name}</li>)}</ul>

      <h2 className="mt-6 text-xl font-medium">Steps</h2>
      <ol className="list-decimal space-y-2 pl-6">{recipe.steps.map((s) => <li key={s.id}>{s.text}</li>)}</ol>
    </main>
  );
}
