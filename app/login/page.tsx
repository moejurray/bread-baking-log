import { login, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; mode?: string }>;
}) {
  const { error, message, mode } = await searchParams;
  const signupMode = mode === "signup";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Bread Baking Log</p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900">{signupMode ? "Create account" : "Sign in"}</h1>
        <p className="mt-3 leading-6 text-stone-600">{signupMode ? "Create your own private baking notebook." : "Your baking notebook is private."}</p>
      </div>

      <form action={signupMode ? signUp : login} className="space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-stone-700">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base outline-none focus:border-stone-600" />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-stone-700">Password</label>
          <input id="password" name="password" type="password" autoComplete={signupMode ? "new-password" : "current-password"} minLength={signupMode ? 6 : undefined} required className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base outline-none focus:border-stone-600" />
          {signupMode ? <p className="mt-2 text-xs text-stone-400">At least 6 characters.</p> : null}
        </div>
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-700">{message}</p> : null}
        <button type="submit" className="min-h-12 w-full rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white">{signupMode ? "Create account" : "Sign in"}</button>
      </form>

      <div className="mt-5 text-center text-sm text-stone-600">
        {signupMode ? (
          <a href="/login" className="font-semibold text-stone-900 underline underline-offset-4">Already have an account? Sign in</a>
        ) : (
          <a href="/login?mode=signup" className="font-semibold text-stone-900 underline underline-offset-4">New here? Create an account</a>
        )}
      </div>
    </main>
  );
}
