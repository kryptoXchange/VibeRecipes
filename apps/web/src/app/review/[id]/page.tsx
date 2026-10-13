import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AutoRefresh, GenerateButtons } from "../../recipes/[id]/video-controls";
import { rateVideo } from "./actions";

type Source = "real" | "ai" | "placeholder";
const LABEL: Record<Source, string> = { real: "Real", ai: "AI", placeholder: "Placeholder" };
const STYLE: Record<Source, string> = {
  real: "bg-green-100 text-green-800",
  ai: "bg-purple-100 text-purple-800",
  placeholder: "bg-neutral-200 text-neutral-700",
};
const FIELDS = [
  ["techniqueCorrect", "Technique correct"],
  ["ingredientsRight", "Ingredients right"],
  ["clarity", "Clarity"],
] as const;

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const recipe = await db.recipe.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { position: "asc" } },
      videos: { orderBy: { createdAt: "desc" }, include: { ratings: true } },
    },
  });
  if (!recipe) notFound();

  // Latest video per strategy, so both sides always compare like for like.
  const latest = (s: "stitched" | "ai") => recipe.videos.find((v) => v.strategy === s);
  const columns = [
    { title: "Stitched (real, then AI clips)", video: latest("stitched") },
    { title: "AI-generated", video: latest("ai") },
  ];
  const inProgress = recipe.videos.some((v) => v.status === "queued" || v.status === "running");

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href={`/recipes/${recipe.id}`} className="text-sm underline">← {recipe.title}</Link>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">Compare videos</h1>
      <GenerateButtons recipeId={recipe.id} />
      <AutoRefresh active={inProgress} />

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {columns.map(({ title, video: v }) => (
          <section key={title} className="rounded border border-neutral-300 p-4 dark:border-neutral-700">
            <h2 className="mb-3 font-medium">{title}</h2>
            {!v && <p className="text-sm text-neutral-500">No video yet. Generate one above.</p>}
            {v && v.status !== "done" && (
              <p className={`text-sm ${v.status === "failed" ? "text-red-600" : "text-neutral-500"}`}>
                {v.status === "failed" ? `Failed: ${v.error}` : `Status: ${v.status}…`}
              </p>
            )}
            {v && v.status === "done" && v.url && (
              <>
                <video src={v.url} controls className="w-full rounded" />
                <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div><dt className="text-neutral-500">Cost</dt><dd>${(v.costUsd ?? 0).toFixed(2)}</dd></div>
                  <div><dt className="text-neutral-500">Render time</dt><dd>{(v.renderSeconds ?? 0).toFixed(1)}s</dd></div>
                  <div><dt className="text-neutral-500">Length</dt><dd>{(v.durationS ?? 0).toFixed(0)}s</dd></div>
                </dl>

                <ul className="mt-3 space-y-1 text-sm">
                  {recipe.steps.map((s) => {
                    const src = (v.stepSources as { position: number; source: Source }[] | null)
                      ?.find((x) => x.position === s.position)?.source;
                    return (
                      <li key={s.id} className="flex items-start gap-2">
                        {src && <span className={`mt-0.5 shrink-0 rounded px-1.5 text-xs ${STYLE[src]}`}>{LABEL[src]}</span>}
                        <span>{s.position}. {s.text}</span>
                      </li>
                    );
                  })}
                </ul>

                {v.ratings.length > 0 && (
                  <p className="mt-3 text-sm text-neutral-500">
                    {v.ratings.length} rating(s) · avg{" "}
                    {FIELDS.map(([k, label]) =>
                      `${label.split(" ")[0].toLowerCase()} ${(v.ratings.reduce((a, r) => a + r[k], 0) / v.ratings.length).toFixed(1)}`
                    ).join(", ")}
                  </p>
                )}

                <form action={rateVideo.bind(null, v.id, recipe.id)} className="mt-3 space-y-2 border-t pt-3 text-sm">
                  {FIELDS.map(([name, label]) => (
                    <label key={name} className="flex items-center justify-between gap-2">
                      {label} (1-5)
                      <input name={name} type="number" min={1} max={5} required
                        defaultValue={v.ratings.find((r) => r.reviewerId === user.id)?.[name]}
                        className="w-16 rounded border border-neutral-300 p-1 dark:border-neutral-700 dark:bg-neutral-900" />
                    </label>
                  ))}
                  <input name="notes" placeholder="Notes (optional)"
                    defaultValue={v.ratings.find((r) => r.reviewerId === user.id)?.notes ?? ""}
                    className="w-full rounded border border-neutral-300 p-1.5 dark:border-neutral-700 dark:bg-neutral-900" />
                  <button className="rounded bg-orange-600 px-3 py-1 text-white">Save rating</button>
                </form>
              </>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
