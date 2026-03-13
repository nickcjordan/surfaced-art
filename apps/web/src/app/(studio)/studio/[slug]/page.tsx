import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ slug: string }>
}

/**
 * Redirect old /studio/[slug] URLs to the new root-level /[slug] URLs.
 * Permanent redirect (308) preserves HTTP method and signals to search
 * engines that the content has moved permanently.
 */
export default async function StudioRedirect({ params }: Props) {
  const { slug } = await params
  redirect(`/${slug}`)
}
