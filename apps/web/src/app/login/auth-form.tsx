"use client";

import { useActionState } from "react";
import type { AuthState } from "./actions";

const field = "w-full rounded border border-neutral-300 p-2 dark:border-neutral-700 dark:bg-neutral-900";

export function AuthForm({
  action,
  submitLabel,
  withName = false,
}: {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel: string;
  withName?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      {withName && <input name="name" placeholder="Name" required autoComplete="name" defaultValue={state.name} className={field} />}
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        autoComplete="email"
        defaultValue={state.email}
        className={field}
      />
      <input
        name="password"
        type="password"
        placeholder={withName ? "Password (8+ characters)" : "Password"}
        required
        autoComplete={withName ? "new-password" : "current-password"}
        className={field}
      />
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="rounded bg-orange-600 px-4 py-2 text-white disabled:opacity-60">
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
