'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';

const COUNTRIES = [
  'Singapore', 'United Kingdom', 'United States', 'Spain', 'France', 'Italy',
  'Germany', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Portugal',
  'Greece', 'Ireland', 'Denmark', 'Sweden', 'Norway', 'Finland', 'Iceland',
  'Australia', 'New Zealand', 'Japan', 'South Korea', 'Thailand', 'Vietnam',
  'Indonesia', 'Malaysia', 'Philippines', 'India', 'United Arab Emirates',
  'Saudi Arabia', 'Qatar', 'Turkey', 'Egypt', 'Morocco', 'South Africa',
  'Kenya', 'Mexico', 'Canada', 'Brazil', 'Argentina', 'Chile', 'Colombia',
  'Peru', 'China', 'Hong Kong', 'Taiwan', 'Other',
];

interface FieldErrors {
  hotelName?: string;
  city?: string;
  country?: string;
  contactName?: string;
  contactEmail?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function HotelSignupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [hotelName, setHotelName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [description, setDescription] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auth guard — redirect unauthenticated users to /login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/hotel/signup');
    }
  }, [authLoading, user, router]);

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (!hotelName.trim()) errs.hotelName = 'Hotel name is required';
    if (!city.trim()) errs.city = 'City is required';
    if (!country.trim()) errs.country = 'Country is required';
    if (!contactName.trim()) errs.contactName = 'Contact name is required';
    if (!contactEmail.trim() || !isValidEmail(contactEmail)) {
      errs.contactEmail = 'Valid email is required';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowser();
      const token = supabase
        ? (await supabase.auth.getSession()).data.session?.access_token
        : null;

      if (!token) {
        setSubmitError('Your session has expired. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      const res = await fetch('/api/admin/hotels/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hotel_name: hotelName.trim(),
          city: city.trim(),
          country: country.trim(),
          contact_name: contactName.trim(),
          contact_email: contactEmail.trim().toLowerCase(),
          description: description.trim() || null,
        }),
      });

      const data = (await res.json()) as { property_id?: string; error?: string };

      if (!res.ok || !data.property_id) {
        setSubmitError(data.error || 'Failed to create hotel. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push('/hotel-admin/dashboard');
      }, 2000);
    } catch {
      setSubmitError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  }

  // Loading state while auth resolves
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fieldIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-card    { animation: fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .anim-brand   { animation: fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0s both; }
        .anim-overlay { animation: fadeIn 1.2s ease both; }
        .field-row    { animation: fieldIn 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .field-row:nth-child(1) { animation-delay: 0.05s; }
        .field-row:nth-child(2) { animation-delay: 0.10s; }
        .field-row:nth-child(3) { animation-delay: 0.15s; }
        .field-row:nth-child(4) { animation-delay: 0.20s; }
        .field-row:nth-child(5) { animation-delay: 0.25s; }
        .field-row:nth-child(6) { animation-delay: 0.30s; }
        .field-row:nth-child(7) { animation-delay: 0.35s; }

        .signup-input, .signup-select {
          width: 100%;
          height: 44px;
          padding: 0 16px;
          border-radius: 8px;
          background: rgba(250,248,245,0.06);
          border: 1px solid rgba(250,248,245,0.12);
          color: #FAF8F5;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          -webkit-appearance: none;
        }
        .signup-input::placeholder { color: rgba(250,248,245,0.25); }
        .signup-input:focus, .signup-select:focus {
          border-color: rgba(193,127,58,0.55);
          background: rgba(250,248,245,0.09);
          box-shadow: 0 0 0 3px rgba(193,127,58,0.1);
        }
        .signup-input.error, .signup-select.error {
          border-color: rgba(239,68,68,0.4);
        }

        .signup-textarea {
          width: 100%;
          padding: 12px 16px;
          border-radius: 8px;
          background: rgba(250,248,245,0.06);
          border: 1px solid rgba(250,248,245,0.12);
          color: #FAF8F5;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          resize: none;
        }
        .signup-textarea::placeholder { color: rgba(250,248,245,0.25); }
        .signup-textarea:focus {
          border-color: rgba(193,127,58,0.55);
          background: rgba(250,248,245,0.09);
          box-shadow: 0 0 0 3px rgba(193,127,58,0.1);
        }

        .submit-btn {
          width: 100%;
          height: 44px;
          border-radius: 8px;
          background: #C17F3A;
          color: #FAF8F5;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.07em;
          border: none;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
          font-family: inherit;
        }
        .submit-btn:hover:not(:disabled) { background: #D6A252; }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .field-label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(250,248,245,0.35);
          margin-bottom: 8px;
        }
        .field-error {
          font-size: 11px;
          color: #F87171;
          margin-top: 6px;
        }

        .error-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: #F87171;
          font-size: 12px;
          animation: fieldIn 0.3s ease both;
        }

        .back-link {
          font-size: 12px;
          color: #C17F3A;
          text-decoration: none;
          font-weight: 500;
          letter-spacing: 0.05em;
          transition: color 0.2s;
        }
        .back-link:hover { color: #D6A252; }
      `}</style>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
        {/* ── Video background ── */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden="true"
          >
            <source src="/videos/login.mp4" type="video/mp4" />
          </video>
          <div
            className="anim-overlay absolute inset-0"
            style={{ background: 'rgba(8,6,4,0.62)' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 35%, rgba(4,2,0,0.65) 100%)',
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-[1px]"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(193,127,58,0.6) 30%, rgba(214,162,82,0.85) 50%, rgba(193,127,58,0.6) 70%, transparent)',
            }}
          />
        </div>

        {/* ── Content ── */}
        <div className="relative z-10 w-full max-w-[440px]">
          {/* Brand */}
          <div className="anim-brand text-center mb-8">
            <Link href="/" style={{ textDecoration: 'none' }}>
              <h1
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '2rem',
                  color: '#C17F3A',
                  letterSpacing: '0.06em',
                  fontWeight: 400,
                  margin: '0 0 6px',
                }}
              >
                StayScape
              </h1>
            </Link>
            <p
              style={{
                fontSize: '12px',
                color: 'rgba(250,248,245,0.4)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Sign Up Your Hotel
            </p>
          </div>

          {/* Card */}
          <div
            className="anim-card"
            style={{
              background: 'rgba(10,8,6,0.7)',
              border: '1px solid rgba(250,248,245,0.1)',
              borderRadius: '16px',
              padding: '28px',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              boxShadow:
                '0 24px 64px rgba(0,0,0,0.5), 0 1px 0 rgba(193,127,58,0.1) inset',
            }}
          >
            {showSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ margin: '0 auto 20px', color: '#C17F3A' }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#FAF8F5',
                    marginBottom: '8px',
                  }}
                >
                  Hotel Created
                </h2>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'rgba(250,248,245,0.6)',
                    lineHeight: 1.6,
                    marginBottom: '20px',
                  }}
                >
                  Your hotel has been created successfully. Redirecting to your dashboard…
                </p>
                <div
                  className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/70 animate-spin"
                  style={{ margin: '0 auto' }}
                />
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {/* Hotel Name */}
                <div className="field-row">
                  <label className="field-label">Hotel Name *</label>
                  <input
                    type="text"
                    required
                    value={hotelName}
                    onChange={(e) => {
                      setHotelName(e.target.value);
                      if (fieldErrors.hotelName)
                        setFieldErrors({ ...fieldErrors, hotelName: undefined });
                    }}
                    placeholder="e.g. The Sultan Heritage Hotel"
                    className={`signup-input${fieldErrors.hotelName ? ' error' : ''}`}
                  />
                  {fieldErrors.hotelName && (
                    <div className="field-error">{fieldErrors.hotelName}</div>
                  )}
                </div>

                {/* City */}
                <div className="field-row">
                  <label className="field-label">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (fieldErrors.city)
                        setFieldErrors({ ...fieldErrors, city: undefined });
                    }}
                    placeholder="e.g. Singapore"
                    className={`signup-input${fieldErrors.city ? ' error' : ''}`}
                  />
                  {fieldErrors.city && (
                    <div className="field-error">{fieldErrors.city}</div>
                  )}
                </div>

                {/* Country */}
                <div className="field-row">
                  <label className="field-label">Country *</label>
                  <select
                    required
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      if (fieldErrors.country)
                        setFieldErrors({ ...fieldErrors, country: undefined });
                    }}
                    className={`signup-select${fieldErrors.country ? ' error' : ''}`}
                  >
                    <option value="" style={{ background: '#1a1a1a', color: '#FAF8F5' }}>
                      Select a country
                    </option>
                    {COUNTRIES.map((c) => (
                      <option
                        key={c}
                        value={c}
                        style={{ background: '#1a1a1a', color: '#FAF8F5' }}
                      >
                        {c}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.country && (
                    <div className="field-error">{fieldErrors.country}</div>
                  )}
                </div>

                {/* Contact Name */}
                <div className="field-row">
                  <label className="field-label">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => {
                      setContactName(e.target.value);
                      if (fieldErrors.contactName)
                        setFieldErrors({ ...fieldErrors, contactName: undefined });
                    }}
                    placeholder="Your full name"
                    className={`signup-input${fieldErrors.contactName ? ' error' : ''}`}
                  />
                  {fieldErrors.contactName && (
                    <div className="field-error">{fieldErrors.contactName}</div>
                  )}
                </div>

                {/* Contact Email */}
                <div className="field-row">
                  <label className="field-label">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value);
                      if (fieldErrors.contactEmail)
                        setFieldErrors({ ...fieldErrors, contactEmail: undefined });
                    }}
                    placeholder="you@hotel.com"
                    className={`signup-input${fieldErrors.contactEmail ? ' error' : ''}`}
                  />
                  {fieldErrors.contactEmail && (
                    <div className="field-error">{fieldErrors.contactEmail}</div>
                  )}
                </div>

                {/* Description (optional) */}
                <div className="field-row">
                  <label className="field-label">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A short description of your hotel"
                    rows={3}
                    className="signup-textarea"
                  />
                </div>

                {/* Submit error */}
                {submitError && (
                  <div className="error-box">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {submitError}
                  </div>
                )}

                {/* Submit */}
                <div className="field-row">
                  <button type="submit" disabled={isSubmitting} className="submit-btn">
                    {isSubmitting ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <svg
                          className="animate-spin"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            opacity="0.25"
                          />
                          <path
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            opacity="0.75"
                          />
                        </svg>
                        Creating hotel…
                      </span>
                    ) : (
                      'Create Hotel'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Back to login */}
          {!showSuccess && (
            <p
              style={{
                textAlign: 'center',
                marginTop: '20px',
                fontSize: '12px',
                color: 'rgba(250,248,245,0.4)',
              }}
            >
              Already have a hotel admin account?{' '}
              <Link href="/login" className="back-link">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
