/**
 * /terms — Stayscape Terms of Service
 *
 * ⚠️ BEFORE PUBLISHING — replace every [[PLACEHOLDER]]:
 *   [[LEGAL_ENTITY]]    e.g. "Stayscape Pte. Ltd."
 *   [[REG_ADDRESS]]     registered business address
 *   [[SUPPORT_EMAIL]]   e.g. hello@stayscape.app
 *   [[EFFECTIVE_DATE]]  e.g. "21 May 2026"
 *   [[GOVERNING_LAW]]   e.g. "Singapore"
 *
 * Not legal advice — have a lawyer or your advisor review before going live.
 * Note: Singapore is governing law; the Stripe pledge tiers ("lifetime access",
 * limited spots) create real commitments — flag Section 6 to your reviewer.
 */

import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'Terms of Service · Stayscape',
  description: 'The terms governing your use of Stayscape.',
};

const EFFECTIVE_DATE = '26/03/3036';

export default function TermsPage() {
  return (
    <main style={{ background: '#14100D', minHeight: '100vh', color: '#E8E2D8' }}>
      <LandingNav />

      <article
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: 'clamp(64px,9vw,120px) clamp(20px,5vw,32px) 96px',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <header style={{ marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#C9A875', margin: '0 0 16px' }}>
            Legal
          </p>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(2.2rem,5vw,3.4rem)',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: '#F5F1EA',
              margin: '0 0 16px',
            }}
          >
            Terms of Service
          </h1>
          <p style={{ fontSize: 14, color: '#8A8580', margin: 0 }}>Effective 21/03/2026</p>
        </header>

        <Intro>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Stayscape
          app and website (the &ldquo;Service&rdquo;), operated by <strong>Dayzero Ventures Private Limited</strong>{' '}
          (&ldquo;Stayscape&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By using the Service you agree
          to these Terms. If you do not agree, do not use the Service.
        </Intro>

        <Section n="1" title="Eligibility & accounts">
          <P>
            You must be at least 18 years old, or the age of majority in your jurisdiction, to create
            an account. You are responsible for keeping your login credentials secure and for all
            activity under your account. Notify us promptly of any unauthorised use.
          </P>
        </Section>

        <Section n="2" title="The Service">
          <P>
            Stayscape provides an AI concierge (&ldquo;Aria&rdquo;), local discovery, itinerary
            planning, and — where you are staying with a partner hotel — the ability to send service
            requests to that hotel. Features available to you may depend on whether you access the
            Service through a hotel or as a personal user.
          </P>
          <P>
            Aria&rsquo;s suggestions, recommendations, and information are provided for convenience
            and may be inaccurate or incomplete. They are not professional advice. Always verify
            important details (opening hours, prices, bookings, safety) independently before relying
            on them.
          </P>
        </Section>

        <Section n="3" title="Hotel services & third parties">
          <P>
            Service requests submitted through the app are fulfilled by the relevant hotel, not by
            Stayscape. We pass your request to the hotel but do not guarantee that any request will be
            accepted or fulfilled. Discovery content may reference third-party venues and services
            that we do not operate or endorse, and whose availability and quality we do not control.
          </P>
        </Section>

        <Section n="4" title="Acceptable use">
          <P>You agree not to:</P>
          <UL
            items={[
              'Use the Service for any unlawful purpose or in breach of these Terms.',
              'Attempt to access data belonging to other users, hotels, or accounts.',
              'Interfere with, probe, or disrupt the Service or its infrastructure.',
              'Use Aria to generate unlawful, harmful, or abusive content.',
              'Reverse-engineer, scrape, or copy the Service except as permitted by law.',
            ]}
          />
        </Section>

        <Section n="5" title="Your content">
          <P>
            You retain ownership of the content you submit (e.g. messages, notes, preferences). You
            grant us a limited licence to use that content solely to operate and provide the Service
            to you. You are responsible for the content you submit and confirm you have the right to
            submit it.
          </P>
        </Section>

        <Section n="6" title="Early-access pledges & payments">
          <P>
            Where you purchase an early-access pledge or paid tier, the perks described at the point
            of purchase (which may include &ldquo;lifetime access&rdquo; to Stayscape Personal and
            limited founding-member benefits) form part of these Terms. Payments are processed by
            Stripe. Refunds, where offered, are handled on a case-by-case basis; contact us at{' '}
            <strong>Founder@thestayscape.com</strong>. We will honour purchased perks in good faith, but the
            Service, its features, and roadmap may evolve over time.
          </P>
        </Section>

        <Section n="7" title="Intellectual property">
          <P>
            The Service, including its software, branding, and design, is owned by Stayscape and
            protected by intellectual property laws. These Terms do not grant you any right to our
            trademarks or brand without our written permission.
          </P>
        </Section>

        <Section n="8" title="Availability & changes">
          <P>
            We aim to keep the Service available but do not guarantee uninterrupted access. We may
            modify, suspend, or discontinue features at any time. We may also update these Terms;
            material changes will be notified in the app or by email, and continued use after changes
            take effect constitutes acceptance.
          </P>
        </Section>

        <Section n="9" title="Disclaimers">
          <P>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            warranties of any kind, whether express or implied, to the fullest extent permitted by
            law, including any warranties of merchantability, fitness for a particular purpose, and
            non-infringement.
          </P>
        </Section>

        <Section n="10" title="Limitation of liability">
          <P>
            To the maximum extent permitted by law, Stayscape will not be liable for any indirect,
            incidental, special, or consequential damages, or for loss of data, profits, or goodwill,
            arising from your use of the Service. Our total liability for any claim relating to the
            Service will not exceed the amount you paid us in the 12 months before the claim, or SGD
            100, whichever is greater.
          </P>
        </Section>

        <Section n="11" title="Indemnity">
          <P>
            You agree to indemnify and hold Stayscape harmless from any claims, losses, or expenses
            arising out of your misuse of the Service or breach of these Terms.
          </P>
        </Section>

        <Section n="12" title="Termination">
          <P>
            You may stop using the Service and close your account at any time. We may suspend or
            terminate your access if you breach these Terms or use the Service in a way that risks
            harm to others or to us. Sections that by their nature should survive termination
            (including ownership, disclaimers, and limitation of liability) will continue to apply.
          </P>
        </Section>

        <Section n="13" title="Governing law">
          <P>
            These Terms are governed by the laws of <strong>Singapore</strong>, and the
            courts of Singapore will have exclusive jurisdiction over any dispute, without
            affecting any mandatory consumer-protection rights you may have where you live.
          </P>
        </Section>

        <Section n="14" title="Contact">
          <P>
            Questions about these Terms can be sent to <strong>Founder@thestayscape.com</strong> or by post
            to Ubi Ave 1, Singapore.
          </P>
        </Section>

        <p style={{ fontSize: 13, color: '#8A8580', marginTop: 40 }}>
          See also our{' '}
          <a href="/privacy" style={{ color: '#C9A875', textDecoration: 'none', borderBottom: '1px solid rgba(201,168,117,0.4)' }}>
            Privacy Policy
          </a>
          .
        </p>
      </article>

      <LandingFooter />
    </main>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Presentational helpers (same as /privacy)                       */
/* ────────────────────────────────────────────────────────────── */

function Intro({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 17, lineHeight: 1.75, color: 'rgba(232,226,216,0.82)', margin: '0 0 48px' }}>
      {children}
    </p>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 44 }}>
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(1.4rem,2.6vw,1.9rem)',
          fontWeight: 500,
          color: '#F5F1EA',
          letterSpacing: '-0.01em',
          margin: '0 0 18px',
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
        }}
      >
        <span style={{ fontSize: '0.7em', color: '#C9A875', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 15, lineHeight: 1.72, color: 'rgba(232,226,216,0.74)', margin: '0 0 16px' }}>
      {children}
    </p>
  );
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(232,226,216,0.74)', paddingLeft: 22, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 0, top: 9, width: 6, height: 6, borderRadius: '50%', background: '#C9A875' }} />
          {item}
        </li>
      ))}
    </ul>
  );
}
