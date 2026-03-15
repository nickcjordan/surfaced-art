import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { CanvasDotOverlayFullBleed } from '@/components/ui/canvas-texture'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Privacy Policy — Surfaced Art',
  description:
    'Learn how Surfaced Art collects, uses, and protects your personal data. Covers third-party services, cookies, retention, and your deletion rights.',
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
  openGraph: {
    title: 'Privacy Policy — Surfaced Art',
    description:
      'Learn how Surfaced Art collects, uses, and protects your personal data.',
    type: 'website',
    url: `${SITE_URL}/privacy`,
  },
}

export default function PrivacyPage() {
  return (
    <div className="relative space-y-12 md:space-y-16">
      <CanvasDotOverlayFullBleed />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Privacy Policy',
        url: `${SITE_URL}/privacy`,
        description: metadata.description,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Surfaced Art',
          url: SITE_URL,
        },
      }} />

      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Privacy Policy' },
      ]} />

      {/* Hero */}
      <section data-testid="privacy-hero" className="max-w-2xl">
        <h1 className="font-heading text-4xl tracking-tight text-foreground sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: March 2026
        </p>
        <p className="mt-6 text-lg leading-relaxed text-muted-text">
          Surfaced Art (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to
          protecting your privacy. This policy explains what information we collect, how we use it,
          and your rights regarding that information.
        </p>
      </section>

      {/* Data Collected */}
      <section data-testid="privacy-data-collected" className="max-w-2xl space-y-4">
        <h2 className="font-heading text-2xl text-foreground">Information We Collect</h2>
        <p className="text-base leading-relaxed text-muted-text">
          We collect information you provide directly to us, such as when you create an account,
          apply to become an artist, or make a purchase:
        </p>
        <ul className="list-disc list-inside space-y-2 text-base text-muted-text pl-2">
          <li><strong>Account information:</strong> name, email address, and password</li>
          <li><strong>Artist profile data:</strong> biography, location, portfolio images, and social links</li>
          <li><strong>Transaction data:</strong> purchase history, shipping addresses, and payment method details (processed by Stripe — we do not store raw card numbers)</li>
          <li><strong>Communications:</strong> messages you send to us or through the platform</li>
        </ul>
        <p className="text-base leading-relaxed text-muted-text">
          We also collect limited data automatically when you use the platform, including IP address,
          browser type, pages visited, and session duration, for security and analytics purposes.
        </p>
      </section>

      {/* Third-Party Services */}
      <section data-testid="privacy-third-party" className="max-w-2xl space-y-4">
        <h2 className="font-heading text-2xl text-foreground">Third-Party Services</h2>
        <p className="text-base leading-relaxed text-muted-text">
          We use the following third-party services, each with their own privacy policies:
        </p>
        <ul className="list-disc list-inside space-y-2 text-base text-muted-text pl-2">
          <li>
            <strong>Stripe:</strong> Payment processing. Stripe collects and processes payment
            information directly. See{' '}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer"
               className="underline underline-offset-4 hover:text-foreground transition-colors">
              Stripe&rsquo;s Privacy Policy
            </a>.
          </li>
          <li>
            <strong>PostHog:</strong> Product analytics. We use PostHog to understand how the platform
            is used. PostHog collects anonymized usage events. See{' '}
            <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer"
               className="underline underline-offset-4 hover:text-foreground transition-colors">
              PostHog&rsquo;s Privacy Policy
            </a>.
          </li>
          <li>
            <strong>Amazon Web Services (AWS):</strong> Infrastructure hosting. Your data is stored
            on AWS servers in the United States. See{' '}
            <a href="https://aws.amazon.com/privacy/" target="_blank" rel="noopener noreferrer"
               className="underline underline-offset-4 hover:text-foreground transition-colors">
              AWS&rsquo;s Privacy Policy
            </a>.
          </li>
          <li>
            <strong>Vercel:</strong> Frontend hosting and CDN delivery. See{' '}
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer"
               className="underline underline-offset-4 hover:text-foreground transition-colors">
              Vercel&rsquo;s Privacy Policy
            </a>.
          </li>
        </ul>
        <p className="text-base leading-relaxed text-muted-text">
          We do not sell your personal information to any third party.
        </p>
      </section>

      {/* Cookies and Analytics */}
      <section data-testid="privacy-cookies" className="max-w-2xl space-y-4">
        <h2 className="font-heading text-2xl text-foreground">Cookies and Analytics</h2>
        <p className="text-base leading-relaxed text-muted-text">
          We use cookies and similar technologies to maintain your session, remember your preferences,
          and improve the platform experience. Specifically:
        </p>
        <ul className="list-disc list-inside space-y-2 text-base text-muted-text pl-2">
          <li><strong>Session cookies:</strong> Required for authentication and keeping you signed in</li>
          <li><strong>Analytics cookies:</strong> Used by PostHog to measure platform usage in aggregate</li>
        </ul>
        <p className="text-base leading-relaxed text-muted-text">
          You can disable cookies in your browser settings, though some features of the platform
          may not function correctly without them.
        </p>
      </section>

      {/* Data Retention */}
      <section data-testid="privacy-retention" className="max-w-2xl space-y-4">
        <h2 className="font-heading text-2xl text-foreground">Data Retention</h2>
        <p className="text-base leading-relaxed text-muted-text">
          We retain your personal data for as long as your account is active or as needed to provide
          you with our services. Specifically:
        </p>
        <ul className="list-disc list-inside space-y-2 text-base text-muted-text pl-2">
          <li>Account data is retained for the duration of your account and for up to 90 days after deletion</li>
          <li>Transaction records are retained for 7 years for tax and legal compliance</li>
          <li>Analytics data is retained for 12 months, after which it is aggregated or deleted</li>
          <li>Communications with support are retained for 2 years</li>
        </ul>
      </section>

      {/* Your Rights */}
      <section data-testid="privacy-rights" className="max-w-2xl space-y-4">
        <h2 className="font-heading text-2xl text-foreground">Your Rights</h2>
        <p className="text-base leading-relaxed text-muted-text">
          Depending on your location, you may have the following rights regarding your personal data:
        </p>
        <ul className="list-disc list-inside space-y-2 text-base text-muted-text pl-2">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Correction:</strong> Request that we correct inaccurate or incomplete data</li>
          <li><strong>Deletion:</strong> Request that we delete your personal data (subject to legal retention requirements)</li>
          <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
          <li><strong>Objection:</strong> Object to certain types of processing, including direct marketing</li>
        </ul>
        <p className="text-base leading-relaxed text-muted-text">
          To exercise any of these rights, contact us at the address below. We will respond within
          30 days.
        </p>
      </section>

      {/* Contact */}
      <section data-testid="privacy-contact" className="max-w-2xl space-y-4">
        <h2 className="font-heading text-2xl text-foreground">Contact Us</h2>
        <p className="text-base leading-relaxed text-muted-text">
          If you have questions about this privacy policy or how we handle your data, please contact us:
        </p>
        <address className="not-italic text-base text-muted-text space-y-1">
          <p>Surfaced Art</p>
          <p>
            Email:{' '}
            <a href="mailto:privacy@surfaced.art"
               className="underline underline-offset-4 hover:text-foreground transition-colors">
              privacy@surfaced.art
            </a>
          </p>
        </address>
        <p className="text-base leading-relaxed text-muted-text">
          We may update this policy from time to time. When we do, we will update the &ldquo;last
          updated&rdquo; date at the top of this page and, where the changes are material, notify
          you by email or a notice on the platform.
        </p>
      </section>
    </div>
  )
}
