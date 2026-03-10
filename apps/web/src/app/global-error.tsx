'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center font-sans text-gray-900">
        <p className="text-6xl font-semibold text-gray-400">500</p>
        <h1 className="mt-4 text-3xl font-bold md:text-4xl">
          Something went wrong
        </h1>
        <p className="mt-4 max-w-md text-gray-500">
          We hit an unexpected error loading the page. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-8 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
        >
          Try again
        </button>
      </body>
    </html>
  )
}
