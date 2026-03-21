import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { CanvasDotOverlayFullBleed } from '@/components/ui/canvas-texture'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Artist Agreement — Surfaced Art',
  description:
    'Read the Surfaced Art artist agreement covering handmade requirements, commission structure, shipping, intellectual property, and platform commitments.',
  alternates: {
    canonical: `${SITE_URL}/artist-agreement`,
  },
  openGraph: {
    title: 'Artist Agreement — Surfaced Art',
    description:
      'Read the Surfaced Art artist agreement covering handmade requirements, commission structure, shipping, and more.',
    type: 'website',
    url: `${SITE_URL}/artist-agreement`,
  },
}

const bodyStyle = 'text-base leading-relaxed text-muted-text'
const listStyle =
  'list-disc list-inside space-y-2 text-base text-muted-text pl-2'

export default function ArtistAgreementPage() {
  return (
    <div className="relative space-y-12 md:space-y-16">
      <CanvasDotOverlayFullBleed />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Artist Agreement',
          url: `${SITE_URL}/artist-agreement`,
          description: metadata.description,
          isPartOf: {
            '@type': 'WebSite',
            name: 'Surfaced Art',
            url: SITE_URL,
          },
        }}
      />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Artist Agreement' },
        ]}
      />

      {/* Hero */}
      <section data-testid="agreement-hero" className="max-w-2xl">
        <h1 className="font-heading text-4xl tracking-tight text-foreground sm:text-5xl">
          Artist Agreement
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Version 0.1 — Draft | March 2026
        </p>
        <p className="mt-6 text-lg leading-relaxed text-muted-text">
          We wrote this agreement in plain language on purpose. We want you to
          actually understand what you&rsquo;re agreeing to &mdash; not sign
          something and wonder later what it said. If anything is unclear, write
          to us at{' '}
          <a
            href="mailto:support@surfaced.art"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            support@surfaced.art
          </a>{' '}
          and we&rsquo;ll explain it.
        </p>
      </section>

      {/* Draft Notice */}
      <section
        data-testid="agreement-draft-notice"
        className="max-w-2xl rounded-md border border-border bg-surface/50 p-6"
      >
        <p className="text-sm font-medium text-foreground">
          This agreement is currently in draft form.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          It is pending attorney review and is not yet in effect. The final
          version will replace this page once all open items are resolved.
        </p>
      </section>

      {/* 1. Who this agreement is between */}
      <section data-testid="agreement-parties" className="max-w-2xl space-y-4">
        <h2 className="font-heading text-2xl text-foreground">
          1. Who This Agreement Is Between
        </h2>
        <p className={bodyStyle}>
          This agreement is between you (the artist) and Surfaced Art LLC, a
          Texas limited liability company (&ldquo;Surfaced Art,&rdquo;
          &ldquo;we,&rdquo; or &ldquo;us&rdquo;). When you apply to join
          Surfaced Art and we accept your application, this agreement becomes
          binding on both of us.
        </p>
      </section>

      {/* 2. What Surfaced Art is */}
      <section
        data-testid="agreement-platform"
        className="max-w-2xl space-y-4"
      >
        <h2 className="font-heading text-2xl text-foreground">
          2. What Surfaced Art Is
        </h2>
        <p className={bodyStyle}>
          Surfaced Art is a curated digital gallery for handmade art. We review
          every application by hand. We don&rsquo;t accept AI-generated work,
          print-on-demand products, or mass-produced items. Every artist on the
          platform made what they&rsquo;re selling.
        </p>
        <p className={bodyStyle}>
          We act as your gallery &mdash; we provide the platform, handle
          transactions, calculate and collect shipping costs, manage customer
          service, and pay you when your work sells. We do not take ownership of
          your work at any point.
        </p>
      </section>

      {/* 3. What "handmade by you" means */}
      <section
        data-testid="agreement-handmade"
        className="max-w-2xl space-y-4"
      >
        <h2 className="font-heading text-2xl text-foreground">
          3. What &ldquo;Handmade by You&rdquo; Means
        </h2>
        <p className={bodyStyle}>
          This is the most important part of this agreement. Every piece you list
          on Surfaced Art must meet all three of the following:
        </p>
        <p className={bodyStyle}>
          <strong>You were meaningfully involved in making it.</strong> That
          means more than just designing something or finishing it at the end.
          Your hands and decisions have to be central to the making process, not
          just the start or the finish. Tool assistance is fine &mdash;
          outsourcing the actual fabrication to someone else is not.
        </p>
        <p className={bodyStyle}>
          <strong>Your handwork is substantial.</strong> If you use digital
          tools, machines, or equipment, you have to be the one operating them
          and making the creative decisions at every step. A jeweler using a
          laser cutter they operate themselves: fine. Sending a file to a factory
          and receiving finished pieces: not fine.
        </p>
        <p className={bodyStyle}>
          <strong>
            No third-party manufacturer is primarily responsible for producing
            the piece.
          </strong>{' '}
          This means no print-on-demand services, no factories, no
          drop-shipping. The piece has to come from your studio, not someone
          else&rsquo;s.
        </p>
        <p className={bodyStyle}>
          If you&rsquo;re unsure whether a specific piece or process qualifies,
          write to us before listing it. We&rsquo;d rather answer a question
          than remove a listing after the fact.
        </p>
      </section>

      {/* 4. Applying and getting accepted */}
      <section
        data-testid="agreement-application"
        className="max-w-2xl space-y-4"
      >
        <h2 className="font-heading text-2xl text-foreground">
          4. Applying and Getting Accepted
        </h2>
        <p className={bodyStyle}>
          Applying to Surfaced Art does not guarantee acceptance. We review every
          application ourselves &mdash; a real person looks at your work, your
          process, and your story. We&rsquo;re looking for authenticity, not fame
          or follower counts.
        </p>
        <p className={bodyStyle}>
          If we accept your application, we&rsquo;ll send you a formal
          acceptance email with instructions to set up your profile. Your
          agreement with us starts from the moment you complete your profile
          setup and publish your first listing.
        </p>
        <p className={bodyStyle}>
          If we don&rsquo;t accept your application, we&rsquo;ll let you know.
          We won&rsquo;t always be able to give detailed feedback, but
          we&rsquo;ll be honest that it wasn&rsquo;t the right fit.
        </p>
      </section>

      {/* 5. Your profile and listings */}
      <section
        data-testid="agreement-listings"
        className="max-w-2xl space-y-4"
      >
        <h2 className="font-heading text-2xl text-foreground">
          5. Your Profile and Listings
        </h2>
        <p className={bodyStyle}>
          <strong>Your profile</strong> is your public-facing gallery page on
          Surfaced Art. You control your bio, photos, CV, process media, and all
          content on your profile. You&rsquo;re responsible for keeping it
          accurate and up to date.
        </p>
        <p className={bodyStyle}>
          <strong>Your listings</strong> must accurately represent the work being
          sold. Photos, dimensions, materials, edition information, and
          descriptions must all reflect the actual piece. Misrepresenting a piece
          &mdash; intentionally or carelessly &mdash; is a violation of this
          agreement.
        </p>
        <p className={bodyStyle}>
          <strong>Minimum listings:</strong> You must maintain at least 3 active
          listings on your profile to keep your account active. If your active
          listing count drops below 3, we&rsquo;ll reach out before taking any
          action. If it stays below 3 for 45 days without a response or
          explanation, we may pause your profile until listings are restored.
        </p>
        <p className={bodyStyle}>
          <strong>Availability:</strong> When you mark a piece as available, it
          must genuinely be available for purchase. Don&rsquo;t list pieces
          you&rsquo;ve already sold, pieces you no longer have, or pieces
          you&rsquo;re not willing to ship.
        </p>
      </section>

      {/* 6. Commission and how you get paid */}
      <section
        data-testid="agreement-commission"
        className="max-w-2xl space-y-4"
      >
        <h2 className="font-heading text-2xl text-foreground">
          6. Commission and How You Get Paid
        </h2>
        <p className={bodyStyle}>
          <strong>Our commission is 30% of the sale price of each piece.</strong>{' '}
          This covers the platform, payment processing, customer service, and
          marketing. You keep 70%.
        </p>
        <p className={bodyStyle}>
          We do not take any commission on shipping costs. Whatever the buyer
          pays for shipping goes to you in full.
        </p>
        <p className={bodyStyle}>
          <strong>How payouts work:</strong> When a buyer purchases your work,
          payment is captured immediately and held by Stripe (our payment
          processor). After the buyer confirms delivery &mdash; or after 7 days
          from the expected delivery date, whichever comes first &mdash; your
          payout is released to your connected bank account. This window exists
          to give buyers a fair chance to flag a problem before you receive the
          funds.
        </p>
        <p className={bodyStyle}>
          <strong>Founding artist rates:</strong> If you joined as part of our
          founding artist cohort, your commission rate is different from the
          standard 30% and is specified in your acceptance email. Those terms
          take precedence over this section for as long as they apply.
        </p>
        <p className={bodyStyle}>
          <strong>
            To receive payouts, you must complete Stripe Connect onboarding.
          </strong>{' '}
          This is a one-time identity and banking verification handled directly
          by Stripe. We never see your banking details &mdash; only a Stripe
          account ID. You won&rsquo;t be able to receive payment until this is
          complete.
        </p>
      </section>

      {/* 7. Shipping */}
      <section
        data-testid="agreement-shipping"
        className="max-w-2xl space-y-4"
      >
        <h2 className="font-heading text-2xl text-foreground">7. Shipping</h2>
        <p className={bodyStyle}>
          You are responsible for packing and shipping every order yourself.
          Surfaced Art does not hold inventory or fulfill orders on your behalf.
        </p>
        <p className={bodyStyle}>
          <strong>Shipping rates</strong> are calculated at checkout using the
          packed dimensions and weight you provide for each listing. Buyers pay
          shipping directly &mdash; it&rsquo;s shown as a separate line item
          from the artwork price. Please measure and weigh your packed box
          carefully when you list a piece, not just the artwork itself.
          Inaccurate dimensions cause rate errors that affect buyers.
        </p>
        <p className={bodyStyle}>
          <strong>
            You must enter a tracking number within 3 business days of a sale.
          </strong>{' '}
          This protects you as much as the buyer &mdash; tracking is your
          evidence of shipment in any dispute.
        </p>
        <p className={bodyStyle}>
          <strong>Pack your work well.</strong> Carriers are not known for gentle
          handling. Breakage due to poor packaging is not covered by Surfaced
          Art, and repeated packaging complaints may affect your standing on the
          platform.
        </p>
        <p className={bodyStyle}>
          <strong>US shipping only.</strong> Surfaced Art is US-only at launch.
          You must be able to ship to any US address.
        </p>
      </section>

      {/* 8. Buyer disputes and returns */}
      <section
        data-testid="agreement-disputes"
        className="max-w-2xl space-y-4"
      >
        <h2 className="font-heading text-2xl text-foreground">
          8. Buyer Disputes and Returns
        </h2>
        <p className={bodyStyle}>
          If a buyer has a problem with their order, they contact Surfaced Art
          first. We handle the initial back-and-forth so you can stay in your
          studio.
        </p>
        <p className={bodyStyle}>
          <strong>
            We will contact you if a dispute requires your input.
          </strong>{' '}
          Most issues are straightforward. If something is genuinely wrong with
          the piece &mdash; it doesn&rsquo;t match its description, it arrived
          damaged due to poor packaging, or it was never shipped &mdash; we will
          work with you to find a fair resolution. In some cases this may include
          a refund, which may be funded from your payout.
        </p>
        <p className={bodyStyle}>
          We don&rsquo;t expect perfection. We do expect honesty and a
          good-faith effort to make things right.
        </p>
      </section>

      {/* 9. Your content and your intellectual property */}
      <section data-testid="agreement-ip" className="max-w-2xl space-y-4">
        <h2 className="font-heading text-2xl text-foreground">
          9. Your Content and Your Intellectual Property
        </h2>
        <p className={bodyStyle}>
          <strong>You own your work.</strong> Selling through Surfaced Art does
          not transfer any intellectual property rights to us. The copyright in
          your artwork remains yours.
        </p>
        <p className={bodyStyle}>
          <strong>What you give us permission to do:</strong> By listing work on
          Surfaced Art, you give us a non-exclusive license to display,
          reproduce, and promote your work for the purpose of operating and
          marketing the platform. This means we can show your photos on the
          platform, share them on our social media, and use them in marketing
          materials. We&rsquo;ll always credit you. We won&rsquo;t do anything
          with your work that you haven&rsquo;t consented to &mdash; if we want
          to feature your work in a specific campaign, we&rsquo;ll ask first.
        </p>
        <p className={bodyStyle}>
          <strong>Your profile content</strong> &mdash; your bio, your photos,
          your process videos &mdash; belongs to you. You can take it with you
          if you leave the platform.
        </p>
      </section>

      {/* 10. What we expect from you */}
      <section
        data-testid="agreement-expectations"
        className="max-w-2xl space-y-4"
      >
        <h2 className="font-heading text-2xl text-foreground">
          10. What We Expect from You
        </h2>
        <p className={bodyStyle}>
          Beyond the handmade requirement, here&rsquo;s what being an artist on
          Surfaced Art means:
        </p>
        <ul className={listStyle}>
          <li>
            List work that you actually made and that you actually have.
            Don&rsquo;t list pieces you&rsquo;ve already sold elsewhere or that
            no longer exist.
          </li>
          <li>
            Be honest in your descriptions. If a piece has a flaw, note it. If
            dimensions are approximate, say so.
          </li>
          <li>
            Ship promptly. Enter a tracking number within 3 business days. Let
            us know if something comes up that will delay a shipment.
          </li>
          <li>
            Respond to our messages within 5 business days. We only reach out
            when something needs your attention.
          </li>
          <li>Keep at least 3 active listings on your profile.</li>
          <li>
            Don&rsquo;t list work that violates someone else&rsquo;s
            intellectual property or that you don&rsquo;t have the right to
            sell.
          </li>
        </ul>
      </section>

      {/* 11. What you can expect from us */}
      <section
        data-testid="agreement-commitments"
        className="max-w-2xl space-y-4"
      >
        <h2 className="font-heading text-2xl text-foreground">
          11. What You Can Expect from Us
        </h2>
        <p className={bodyStyle}>
          This isn&rsquo;t a one-way agreement. Here&rsquo;s what we commit to:
        </p>
        <ul className={listStyle}>
          <li>
            We will pay you accurately and on time. Your 70% (or your applicable
            founding artist rate) goes to your bank account after the buyer
            confirmation window closes.
          </li>
          <li>
            We will handle buyer communications first. You won&rsquo;t spend
            your studio time answering customer service questions.
          </li>
          <li>
            We will never show ads on your profile page or recommend other
            artists&rsquo; work on your listing pages. Your pages are yours.
          </li>
          <li>
            We will be honest with you. If something changes &mdash; our
            commission structure, our policies, our plans &mdash; we will tell
            you directly and in advance.
          </li>
          <li>
            We will not ask you to sell exclusively with us. Sell on your
            website, at galleries, at art fairs. We&rsquo;re one channel among
            many, and that&rsquo;s how we want it.
          </li>
        </ul>
      </section>

      {/* 12. Non-exclusivity */}
      <section
        data-testid="agreement-nonexclusive"
        className="max-w-2xl space-y-4"
      >
        <h2 className="font-heading text-2xl text-foreground">
          12. Non-Exclusivity
        </h2>
        <p className={bodyStyle}>
          To be completely explicit:{' '}
          <strong>this agreement is non-exclusive.</strong> You can sell your
          work anywhere else you want &mdash; your own website, Etsy, galleries,
          art fairs, direct to buyers. We will never ask you to give that up.
          Your participation on Surfaced Art does not restrict your ability to
          sell or show your work through any other channel.
        </p>
      </section>

      {/* 13. Changes to this agreement */}
      <section
        data-testid="agreement-changes"
        className="max-w-2xl space-y-4"
      >
        <h2 className="font-heading text-2xl text-foreground">
          13. Changes to This Agreement
        </h2>
        <p className={bodyStyle}>
          We may update this agreement from time to time. If we make changes
          that affect your rights or obligations in a meaningful way, we will
          notify you by email at least 30 days before those changes take effect.
          You&rsquo;ll have the opportunity to review the changes and, if you
          don&rsquo;t agree with them, to close your account before they apply
          to you.
        </p>
        <p className={bodyStyle}>
          Minor changes &mdash; fixing typos, clarifying language without
          changing meaning &mdash; may be made without notice. The current
          version of this agreement is always available at this page.
        </p>
      </section>

      {/* 14. Closing your account */}
      <section
        data-testid="agreement-closure"
        className="max-w-2xl space-y-4"
      >
        <h2 className="font-heading text-2xl text-foreground">
          14. Closing Your Account
        </h2>
        <p className={bodyStyle}>
          <strong>You can leave any time.</strong> If you want to close your
          account, email us at{' '}
          <a
            href="mailto:support@surfaced.art"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            support@surfaced.art
          </a>
          . We&rsquo;ll remove your active listings and close your profile. Any
          pending payouts for completed sales will still be released to you on
          schedule.
        </p>
        <p className={bodyStyle}>
          <strong>We can close your account too,</strong> but only for a real
          reason &mdash; a serious or repeated violation of this agreement,
          fraudulent activity, or conduct that harms buyers or other artists on
          the platform. We&rsquo;ll always tell you why, and for anything other
          than fraud or serious misconduct, we&rsquo;ll give you a chance to
          respond before taking action.
        </p>
        <p className={bodyStyle}>
          We won&rsquo;t close your account because your work stopped selling,
          because you&rsquo;re not active on social media, or for any reason
          that&rsquo;s really about us rather than you.
        </p>
      </section>

      {/* 15. The legal stuff */}
      <section data-testid="agreement-legal" className="max-w-2xl space-y-4">
        <h2 className="font-heading text-2xl text-foreground">
          15. The Legal Stuff
        </h2>
        <p className={bodyStyle}>
          We&rsquo;ve written this agreement in plain language, but it&rsquo;s
          still a contract. A few things that need to be stated clearly:
        </p>
        <p className={bodyStyle}>
          <strong>Governing law:</strong> This agreement is governed by the laws
          of the State of Texas.
        </p>
        <p className={bodyStyle}>
          <strong>Disputes:</strong> If we have a disagreement that we
          can&rsquo;t resolve between ourselves, we agree to try mediation
          before pursuing any other legal action. Additional dispute resolution
          terms are pending attorney review.
        </p>
        <p className={bodyStyle}>
          <strong>Limitation of liability:</strong> Surfaced Art&rsquo;s
          liability to you is limited to the amounts actually paid to you through
          the platform in the 12 months before any claim arises. We&rsquo;re not
          liable for indirect or consequential damages.
        </p>
        <p className={bodyStyle}>
          <strong>Entire agreement:</strong> This agreement, along with your
          acceptance email (which may specify different commission terms for
          founding artists), is the entire agreement between us. It replaces any
          prior conversations or understandings.
        </p>
        <p className={bodyStyle}>
          <strong>Severability:</strong> If any part of this agreement turns out
          to be unenforceable, the rest of it still applies.
        </p>
      </section>

      {/* 16. Questions */}
      <section
        data-testid="agreement-questions"
        className="max-w-2xl space-y-4"
      >
        <h2 className="font-heading text-2xl text-foreground">16. Questions</h2>
        <p className={bodyStyle}>
          If anything in this agreement is unclear, or if you have a situation
          that doesn&rsquo;t seem to be covered, please write to us at{' '}
          <a
            href="mailto:support@surfaced.art"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            support@surfaced.art
          </a>
          . We&rsquo;d much rather talk it through than have either of us
          operating on a misunderstanding.
        </p>
        <p className="mt-8 text-sm text-muted-foreground">
          Surfaced Art LLC |{' '}
          <a
            href="https://surfaced.art"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            surfaced.art
          </a>{' '}
          |{' '}
          <a
            href="mailto:support@surfaced.art"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            support@surfaced.art
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          This agreement was last updated March 2026.
        </p>
      </section>
    </div>
  )
}
