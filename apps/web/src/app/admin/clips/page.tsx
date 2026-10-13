import { db } from "@/lib/db";
import { publicUrl } from "@/lib/storage";
import { setClipStatus } from "./actions";

const field = "rounded border border-neutral-300 p-2 dark:border-neutral-700 dark:bg-neutral-900";

export default async function ClipLibraryPage() {
  const clips = await db.clipAsset.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Clip library</h1>

      <form action="/api/clips" method="post" encType="multipart/form-data" className="mb-8 grid gap-3 rounded border border-neutral-300 p-4 dark:border-neutral-700">
        <h2 className="font-medium">Add real footage</h2>
        <input type="file" name="file" accept="video/*" required />
        <div className="grid grid-cols-3 gap-3">
          <input name="technique" placeholder="technique (mince)" required className={field} />
          <input name="ingredient" placeholder="ingredient (garlic), blank = any" className={field} />
          <input name="durationS" type="number" step="0.1" min="0.5" placeholder="seconds" required className={field} />
        </div>
        <input name="description" placeholder="description (optional)" className={field} />
        <button className="w-fit rounded bg-orange-600 px-4 py-2 text-white">Upload clip</button>
      </form>

      <ul className="space-y-3">
        {clips.length === 0 && <li className="text-neutral-500">No clips yet.</li>}
        {clips.map((c) => (
          <li key={c.id} className="flex items-center gap-4 rounded border border-neutral-300 p-3 dark:border-neutral-700">
            <video src={publicUrl(c.file)} controls className="h-24 rounded" />
            <div className="flex-1 text-sm">
              <p className="font-medium">
                {c.technique}{c.ingredient ? ` · ${c.ingredient}` : " · any ingredient"}
              </p>
              <p className="text-neutral-500">
                <span className={c.source === "ai" ? "text-purple-600" : "text-green-700"}>
                  {c.source === "ai" ? "AI" : "Real"}
                </span>{" "}
                · {c.status} · {c.durationS}s
              </p>
            </div>
            <form action={setClipStatus.bind(null, c.id, c.status === "approved" ? "rejected" : "approved")}>
              <button className="rounded border px-2 py-1 text-sm">{c.status === "approved" ? "Reject" : "Approve"}</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
