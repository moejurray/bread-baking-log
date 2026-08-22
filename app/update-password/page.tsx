import { updatePassword } from "./actions";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Bread Baking Log</p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900">Choose a new password</h1>
        <p className="mt-3 leading-6 text-stone-600">Enter your new password below.</p>
      </div>

      <form action={updatePassword} className="space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-stone-700">New password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base outline-none focus:border-stone-600" />
        </div>
        <div>
          <label htmlFor="confirm_password" className="mb-2 block text-sm font-medium text-stone-700">Confirm password</label>
          <input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" minLength={6} required className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base outline-none focus:border-stone-600" />
        </div>
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        <button type="submit" className="min-h-12 w-full rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white">Update password</button>
      </form>
    </main>
  );
}
