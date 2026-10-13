import { createRecipe } from "./actions";

const field = "w-full rounded border border-neutral-300 p-2 dark:border-neutral-700 dark:bg-neutral-900";

export default function NewRecipePage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">New recipe</h1>
      <form action={createRecipe} className="space-y-4">
        <input name="title" placeholder="Title" required className={field} />
        <textarea name="description" placeholder="Short description (optional)" rows={2} className={field} />
        <label className="block">
          <span className="text-sm">Ingredients, one per line</span>
          <textarea name="ingredients" required rows={6} className={field} />
        </label>
        <label className="block">
          <span className="text-sm">Steps, one per line, in order</span>
          <textarea name="steps" required rows={8} className={field} />
        </label>
        <button className="rounded bg-orange-600 px-4 py-2 text-white">Post recipe</button>
      </form>
    </main>
  );
}
