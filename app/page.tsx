export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-24 pt-8 sm:max-w-2xl">
      <header className="mb-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Bread Baking Log</p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900">Bakes</h1>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center shadow-sm">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-2xl text-white" aria-hidden="true">+</div>
        <h2 className="text-xl font-semibold text-stone-900">No bakes yet</h2>
        <p className="mt-2 max-w-sm leading-6 text-stone-600">Your bread experiments will appear here. Soon you'll be able to record a bake, evaluate it, bake it again, and compare what changed.</p>
        <button type="button" disabled className="mt-7 min-h-12 rounded-xl bg-stone-900 px-6 py-3 font-semibold text-white opacity-50">New Bake — coming next</button>
      </section>

      <nav className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur" aria-label="Primary navigation">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2 text-center text-sm font-medium sm:max-w-2xl">
          <span className="rounded-xl bg-stone-100 px-3 py-2 text-stone-900">Bakes</span>
          <span className="px-3 py-2 text-stone-500">New Bake</span>
          <span className="px-3 py-2 text-stone-500">Compare</span>
        </div>
      </nav>
    </main>
  );
}
