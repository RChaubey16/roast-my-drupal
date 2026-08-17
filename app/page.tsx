export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col items-center gap-6 px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Roast My Drupal
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Enter a drupal.org username or profile URL and get roasted.
        </p>
        <form className="flex w-full gap-2">
          <input
            type="text"
            name="username"
            placeholder="e.g. dries"
            className="flex-1 rounded-full border border-black/[.08] bg-white px-5 py-3 text-black outline-none dark:border-white/[.145] dark:bg-black dark:text-zinc-50"
          />
          <button
            type="submit"
            className="rounded-full bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Roast
          </button>
        </form>
      </main>
    </div>
  );
}
