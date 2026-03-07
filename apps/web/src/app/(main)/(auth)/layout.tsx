/**
 * Auth route group layout.
 * Centers auth forms in a narrow column with brand context.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
