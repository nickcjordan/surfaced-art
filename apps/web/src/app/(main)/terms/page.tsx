import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { CanvasDotOverlayFullBleed } from '@/components/ui/canvas-texture'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Terms of Service — Surfaced Art',
  description:
    'Read the Surfaced Art terms of service covering eligibility, account responsibilities, commission structure, prohibited conduct, and dispute resolution.',
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
  openGraph: {
    title: 'Terms of Service — Surfaced Art',
    description:
      'Read the Surfaced Art terms of service covering eligibility, account responsibilities, commission structure, and more.',
    type: 'website',
    url: `${SITE_URL}/terms`,
  },
}

export default function TermsPage() {
  return (
    <div className="relative space-y-12 md:space-y-16">
      <CanvasDotOverlayFullBleed />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Terms of Service',
        url: `${SITE_URL}/terms`,
        description: metadata.description,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Surfaced Art',
          url: SITE_URL,
        },
      }} />

      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Terms of Service' },
      ]} />

      {/* Hero */}
      <section data-testid="terms-hero" className="max-w-2xl">
        <h1 className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: March 2026
        </p>
        <p className="mt-6 text-lg leading-relaxed text-muted-text">
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the Surfaced Art platform
          (&ldquo;Platform&rdquo;) operated by Surfaced Art (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;). By accessing or using the Platform, you agree to be bound by these Terms.
        </p>
      </section>

      {/* Eligibility */}
      <section data-testid="terms-eligibility" className="max-w-2xl space-y-4">
        <h2 className="font-serif text-2xl text-foreground">Eligibility</h2>
        <p className="text-base leading-relaxed text-muted-text">
          You must be at least 18 years of age to use the Platform. By using the Platform, you represent
          and warrant that you meet this requirement. If you are using the Platform on behalf of a
          business or organization, you represent that you have the authority to bind that entity to
          these Terms.
        </p>
        <p className="text-base leading-relaxed text-muted-text">
          Artist accounts are by application only. Acceptance to sell on Surfaced Art is at our sole
          discretion. We may revoke artist status at any time for violations of these Terms or our
          community standards.
        </p>
      </section>

      {/* Account Responsibilities */}
      <section data-testid="terms-account" className="max-w-2xl space-y-4">
        <h2 className="font-serif text-2xl text-foreground">Account Responsibilities</h2>
        <p className="text-base leading-relaxed text-muted-text">
          You are responsible for maintaining the confidentiality of your account credentials and for
          all activity that occurs under your account. You agree to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-base text-muted-text pl-2">
          <li>Provide accurate and complete information when creating your account</li>
          <li>Keep your contact information and payment details up to date</li>
          <li>Notify us immediately of any unauthorized access to your account</li>
          <li>Not share your account credentials with any third party</li>
          <li>Not create multiple accounts to circumvent restrictions or suspensions</li>
        </ul>
      </section>

      {/* Commission Structure */}
      <section data-testid="terms-commission" className="max-w-2xl space-y-4">
        <h2 className="font-serif text-2xl text-foreground">Commission Structure</h2>
        <p className="text-base leading-relaxed text-muted-text">
          Surfaced Art charges a 30% commission on all sales completed through the Platform. This
          commission is deducted automatically from the sale price before the remaining 70% is
          disbursed to the artist.
        </p>
        <ul className="list-disc list-inside space-y-2 text-base text-muted-text pl-2">
          <li>The commission rate applies to the listed price of the artwork, excluding shipping</li>
          <li>Disbursements are processed via Stripe Connect on a rolling basis (typically within 2–7 business days after a sale clears)</li>
          <li>We reserve the right to modify the commission rate with 30 days&rsquo; written notice to artists</li>
          <li>Refunds processed by the Platform may result in commission clawbacks at our discretion</li>
        </ul>
      </section>

      {/* Prohibited Conduct */}
      <section data-testid="terms-prohibited" className="max-w-2xl space-y-4">
        <h2 className="font-serif text-2xl text-foreground">Prohibited Conduct</h2>
        <p className="text-base leading-relaxed text-muted-text">
          You agree not to use the Platform to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-base text-muted-text pl-2">
          <li>List or sell items that are not handmade by you personally (no dropshipping, no AI-generated works, no mass-produced items)</li>
          <li>Misrepresent the nature, origin, or authenticity of any artwork</li>
          <li>Infringe on the intellectual property rights of others</li>
          <li>Engage in fraudulent, deceptive, or misleading practices</li>
          <li>Harass, threaten, or harm other users of the Platform</li>
          <li>Circumvent our payment systems or conduct transactions off-platform to avoid commission</li>
          <li>Upload content that is illegal, obscene, or violates our community standards</li>
          <li>Use the Platform in any way that could damage, disable, or impair the service</li>
        </ul>
        <p className="text-base leading-relaxed text-muted-text">
          Violation of these prohibitions may result in immediate account suspension or termination
          without refund of any fees.
        </p>
      </section>

      {/* IP Ownership */}
      <section data-testid="terms-ip" className="max-w-2xl space-y-4">
        <h2 className="font-serif text-2xl text-foreground">Intellectual Property</h2>
        <p className="text-base leading-relaxed text-muted-text">
          Artists retain full ownership of the intellectual property rights in their artwork. By
          listing on Surfaced Art, you grant us a limited, non-exclusive, royalty-free license to
          display, reproduce, and distribute images of your artwork solely for the purpose of
          operating and promoting the Platform.
        </p>
        <p className="text-base leading-relaxed text-muted-text">
          The Surfaced Art name, logo, and Platform design are our intellectual property. You may
          not use them without our prior written permission. The sale of a physical artwork does not
          transfer copyright or reproduction rights to the buyer unless explicitly stated in the
          listing.
        </p>
      </section>

      {/* Dispute Resolution */}
      <section data-testid="terms-disputes" className="max-w-2xl space-y-4">
        <h2 className="font-serif text-2xl text-foreground">Dispute Resolution</h2>
        <p className="text-base leading-relaxed text-muted-text">
          If a dispute arises between you and another user of the Platform, we encourage you to
          resolve it directly. If you are unable to do so, you may contact us and we will attempt
          to mediate in good faith, though we are under no obligation to do so.
        </p>
        <p className="text-base leading-relaxed text-muted-text">
          Any dispute between you and Surfaced Art arising from or related to these Terms shall be
          governed by the laws of the State of California, without regard to its conflict of law
          provisions. You agree to submit to the exclusive jurisdiction of courts located in
          San Francisco County, California for resolution of any such dispute.
        </p>
        <p className="text-base leading-relaxed text-muted-text">
          Prior to filing any formal legal action, you agree to attempt to resolve disputes by
          contacting us in writing and giving us 30 days to respond.
        </p>
      </section>

      {/* Limitation of Liability */}
      <section data-testid="terms-liability" className="max-w-2xl space-y-4">
        <h2 className="font-serif text-2xl text-foreground">Limitation of Liability</h2>
        <p className="text-base leading-relaxed text-muted-text">
          To the maximum extent permitted by law, Surfaced Art and its officers, directors, employees,
          and agents shall not be liable for any indirect, incidental, special, consequential, or
          punitive damages arising from your use of or inability to use the Platform.
        </p>
        <p className="text-base leading-relaxed text-muted-text">
          Our total liability to you for any claim arising out of or related to these Terms shall
          not exceed the greater of (a) the total fees paid by you to us in the 12 months preceding
          the claim, or (b) $100 USD.
        </p>
        <p className="text-base leading-relaxed text-muted-text">
          The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind,
          express or implied, including but not limited to implied warranties of merchantability,
          fitness for a particular purpose, or non-infringement.
        </p>
      </section>

      {/* Modifications */}
      <section data-testid="terms-modifications" className="max-w-2xl space-y-4">
        <h2 className="font-serif text-2xl text-foreground">Modifications to These Terms</h2>
        <p className="text-base leading-relaxed text-muted-text">
          We reserve the right to modify these Terms at any time. When we make changes, we will
          update the &ldquo;last updated&rdquo; date at the top of this page. For material changes, we will
          notify active users by email at least 14 days before the changes take effect.
        </p>
        <p className="text-base leading-relaxed text-muted-text">
          Your continued use of the Platform after the effective date of any changes constitutes
          your acceptance of the updated Terms. If you do not agree to the modified Terms, you must
          stop using the Platform and may request account deletion.
        </p>
        <p className="text-base leading-relaxed text-muted-text">
          Questions about these Terms? Contact us at{' '}
          <a href="mailto:legal@surfacedart.com"
             className="underline underline-offset-4 hover:text-foreground transition-colors">
            legal@surfacedart.com
          </a>.
        </p>
      </section>
    </div>
  )
}
