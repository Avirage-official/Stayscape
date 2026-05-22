/**
 * /privacy — Stayscape Privacy Policy
 *
 * PDPA-first (Singapore Personal Data Protection Act 2012), GDPR-aware.
 *
 * ⚠️ BEFORE PUBLISHING — replace every [[PLACEHOLDER]]:
 *   [[LEGAL_ENTITY]]      e.g. "Stayscape Pte. Ltd."
 *   [[UEN]]               your ACRA UEN, if incorporated
 *   [[REG_ADDRESS]]       registered business address
 *   [[PRIVACY_EMAIL]]     e.g. privacy@stayscape.app
 *   [[DPO_NAME]]          Data Protection Officer name (PDPA requires you appoint one)
 *   [[EFFECTIVE_DATE]]    e.g. "21 May 2026"
 *
 * Not legal advice — have a lawyer or your advisor review before going live.
 */

import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'Privacy Policy · Stayscape',
  description: 'How Stayscape collects, uses, and protects your personal data.',
};

const EFFECTIVE_DATE = '21/03/2026';

export default function PrivacyPolicyPage() {
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
        {/* Header */}
        <header style={{ marginBottom: 56 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: '#C9A875',
              margin: '0 0 16px',
            }}
          >
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
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: '#8A8580', margin: 0 }}>
            Effective {EFFECTIVE_DATE}
          </p>
        </header>

        <Intro>
          This Privacy Policy explains how <strong>Dayzero Ventures Private Limited</strong> (&ldquo;Stayscape&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, discloses, and protects your personal
          data when you use the Stayscape app and website (the &ldquo;Service&rdquo;). We comply with
          the Singapore Personal Data Protection Act 2012 (&ldquo;PDPA&rdquo;). Where guests are
          located in the European Economic Area or the United Kingdom, we also apply the relevant
          principles of the GDPR / UK GDPR.
        </Intro>

        <Section n="1" title="Who we are">
          <P>
            Stayscape is a hospitality platform. Hotels license a guest-facing experience app that
            includes an AI concierge (&ldquo;Aria&rdquo;), local discovery, and itinerary tools.
            Individuals may also use Stayscape directly for personal trip planning.
          </P>
          <P>
            For data collected through a hotel partner, that hotel is the data controller and
            Stayscape acts as a data intermediary (processor) on its behalf. For data you provide
            directly to Stayscape (e.g. a personal account), Stayscape is the controller.
          </P>
          <KV
            rows={[
              ['Entity', 'Dayzero Ventures Private Limited (UEN: 202600385K)'],
              ['Address', 'Ube Ave 1, Singapore'],
              ['Data Protection Officer', 'Benjamin Obaje — Founder@thestayscape.com'],
            ]}
          />
        </Section>

        <Section n="2" title="What we collect">
          <P>We collect the following categories of personal data:</P>
          <UL
            items={[
              <><strong>Account &amp; identity:</strong> name, email address, phone number.</>,
              <><strong>Stay &amp; booking:</strong> booking reference, check-in / check-out dates, room, guest count, trip type, and the hotel property associated with your stay.</>,
              <><strong>Preferences &amp; profile:</strong> age band, home location, and travel-preference answers (e.g. pace, food, discovery style) you give during onboarding.</>,
              <><strong>Conversations with Aria:</strong> the messages you exchange with our AI concierge, stored to maintain context across your stay.</>,
              <><strong>Service requests:</strong> requests you make through the app (e.g. extra towels, late checkout) that are routed to hotel staff.</>,
              <><strong>Technical data:</strong> approximate location, device and browser information, and authentication cookies needed to keep you signed in.</>,
            ]}
          />
        </Section>

        <Section n="3" title="How we use your data">
          <P>Under the PDPA we only use personal data for purposes you would reasonably expect:</P>
          <UL
            items={[
              'To provide the Service — your account, stay, itinerary, discovery, and concierge features.',
              'To personalise recommendations and Aria responses to your stated preferences.',
              'To route service requests to the relevant hotel team.',
              'To operate, secure, and improve the platform.',
              'To communicate with you about your account or stay.',
              'To comply with legal obligations.',
            ]}
          />
          <P>
            Where the GDPR applies, our legal bases are: performance of a contract (providing the
            Service), legitimate interests (security and improvement), consent (preference profiling
            and non-essential cookies), and legal obligation.
          </P>
        </Section>

        <Section n="4" title="Consent">
          <P>
            By creating an account and providing your details during onboarding, you consent to the
            collection and use of your personal data as described here. You may withdraw consent at
            any time by contacting us (see Section&nbsp;11). Withdrawing consent may mean we can no
            longer provide some or all of the Service.
          </P>
        </Section>

        <Section n="5" title="AI processing (Aria)">
          <P>
            Aria is powered by a large language model provided by Anthropic. Your messages are sent
            to Anthropic&rsquo;s API solely to generate responses. We do not use your conversations
            to train third-party models, and we configure the API so that conversation data is not
            retained by the model provider beyond what is needed to return a response. Conversations
            are stored in our own database to give you continuity during your stay.
          </P>
        </Section>

        <Section n="6" title="Who we share data with">
          <P>
            We do not sell your personal data. We share it only with the service providers
            (processors) needed to run Stayscape, and with the hotel hosting your stay:
          </P>
          <KV
            rows={[
              ['Supabase', 'Database, authentication, and file storage'],
              ['Anthropic', 'AI concierge (Aria) responses'],
              ['Mapbox', 'Maps and location display'],
              ['Geoapify', 'Place search and geocoding'],
              ['Vercel', 'Application hosting'],
              ['Stripe', 'Payments (where applicable)'],
              ['Your hotel', 'Stay details and service requests for your booking'],
            ]}
          />
          <P>
            We may also disclose data where required by law or to protect our rights, users, or the
            public.
          </P>
        </Section>

        <Section n="7" title="International transfers">
          <P>
            Some providers above process data outside Singapore. Where we transfer personal data
            overseas, we take steps required by the PDPA to ensure a comparable standard of
            protection, and (for EEA/UK data) rely on appropriate safeguards such as standard
            contractual clauses.
          </P>
        </Section>

        <Section n="8" title="How long we keep it">
          <P>
            We keep personal data only as long as necessary for the purposes above or as required by
            law. As a general guide, account data is kept while your account is active; stay and
            conversation data is retained for a limited period after checkout and then deleted or
            anonymised. You can request deletion at any time (see Section&nbsp;9).
          </P>
        </Section>

        <Section n="9" title="Your rights">
          <P>Subject to applicable law, you may:</P>
          <UL
            items={[
              'Request access to the personal data we hold about you.',
              'Request correction of inaccurate or incomplete data.',
              'Withdraw consent to our use of your data.',
              'Request deletion of your data (right to erasure, where it applies).',
              'Request a copy of your data in a portable format (where the GDPR applies).',
            ]}
          />
          <P>
            To exercise any of these, contact us at <strong>Founder@thestayscape.com</strong>. We will
            respond within the timeframes required by the PDPA (and the GDPR where relevant).
          </P>
        </Section>

        <Section n="10" title="Security">
          <P>
            We protect your data with industry-standard measures, including encryption in transit,
            access controls, and per-user data isolation enforced at the database level. No system
            is perfectly secure, but we work to safeguard your information and will notify you and
            the relevant authority of any breach as required by law.
          </P>
        </Section>

        <Section n="11" title="Cookies">
          <P>
            We use essential cookies to keep you signed in and to operate the Service. We do not use
            cookies for advertising. Where non-essential cookies are used, we will ask for your
            consent. You can control cookies through your browser settings.
          </P>
        </Section>

        <Section n="12" title="Children">
          <P>
            The Service is not directed at children under 13 (or the minimum age in your
            jurisdiction). We do not knowingly collect their data. If you believe a child has
            provided us data, contact us and we will delete it.
          </P>
        </Section>

        <Section n="13" title="Changes & contact">
          <P>
            We may update this Policy from time to time. Material changes will be notified in the
            app or by email. Questions, requests, or complaints can be sent to our Data Protection
            Officer at <strong>Founder@thestayscape.com</strong>. If you are in Singapore and are not
            satisfied with our response, you may contact the Personal Data Protection Commission
            (PDPC).
          </P>
        </Section>
      </article>

      <LandingFooter />
    </main>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Presentational helpers                                          */
/* ────────────────────────────────────────────────────────────── */

function Intro({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 17,
        lineHeight: 1.75,
        color: 'rgba(232,226,216,0.82)',
        margin: '0 0 48px',
      }}
    >
      {children}
    </p>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
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
        <li
          key={i}
          style={{
            fontSize: 15,
            lineHeight: 1.65,
            color: 'rgba(232,226,216,0.74)',
            paddingLeft: 22,
            position: 'relative',
          }}
        >
          <span style={{ position: 'absolute', left: 0, top: 9, width: 6, height: 6, borderRadius: '50%', background: '#C9A875' }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function KV({ rows }: { rows: [string, string][] }) {
  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        background: '#1E1814',
        overflow: 'hidden',
        margin: '0 0 16px',
      }}
    >
      {rows.map(([k, v], i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr',
            gap: 16,
            padding: '14px 18px',
            borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#C9A875' }}>{k}</span>
          <span style={{ fontSize: 14, color: 'rgba(232,226,216,0.78)', lineHeight: 1.5 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
