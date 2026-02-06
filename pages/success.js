import Head from 'next/head';
import Link from 'next/link';
import Script from 'next/script';
import { Check, Calendar, MessageCircle, Star } from 'lucide-react';

export default function Success() {
  return (
    <>
      <Head>
        <title>Payment Successful | BridgeLang</title>
        <meta name="description" content="Your payment has been processed successfully" />
      </Head>

      {/* Google ADS conversion */}
      <Script
        id="google-ads-conversion"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `gtag('event', 'conversion', {'send_to': 'AW-17608551252/T34CCPf6sqbENTtWmXb'});`,
        }}
      />

      {/* META PIXEL – PURCHASE EVENT */}
      <Script id="meta-purchase" strategy="afterInteractive">
        {`
          fbq('track', 'Purchase', {
            value: 0,
            currency: 'GBP'
          });
        `}
      </Script>

      <div style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
        }}>
          {/* Success Card */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            {/* Green Success Header */}
            <div style={{
              background: '#10b981',
              padding: '2.5rem 2rem',
              textAlign: 'center',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <Check style={{ width: '48px', height: '48px', color: 'white', strokeWidth: 3 }} />
              </div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: 'white',
                margin: 0,
              }}>
                Payment Successful!
              </h1>
            </div>

            {/* Content */}
            <div style={{ padding: '2.5rem 2rem' }}>
              <p style={{
                fontSize: '1.0625rem',
                color: '#374151',
                marginBottom: '2rem',
                lineHeight: '1.6',
                textAlign: 'center',
              }}>
                Your booking has been confirmed. We've sent a confirmation email with all the details.
              </p>

              {/* Info Cards */}
              <div style={{
                display: 'grid',
                gap: '1rem',
                marginBottom: '2rem',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0',
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: '#22c55e',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Calendar style={{ width: '22px', height: '22px', color: 'white' }} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      color: '#166534',
                      margin: '0 0 0.25rem 0',
                    }}>
                      Check Your Email
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#15803d',
                      margin: 0,
                      lineHeight: '1.5',
                    }}>
                      We've sent you a confirmation with date, time, and meeting details
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: '#3b82f6',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <MessageCircle style={{ width: '22px', height: '22px', color: 'white' }} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      color: '#1e40af',
                      margin: '0 0 0.25rem 0',
                    }}>
                      Message Your Teacher
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#1d4ed8',
                      margin: 0,
                      lineHeight: '1.5',
                    }}>
                      Feel free to send a message if you have any questions
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  border: '1px solid #fde047',
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: '#eab308',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Star style={{ width: '22px', height: '22px', color: 'white' }} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      color: '#854d0e',
                      margin: '0 0 0.25rem 0',
                    }}>
                      Prepare for Your Lesson
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#a16207',
                      margin: 0,
                      lineHeight: '1.5',
                    }}>
                      Join a few minutes early and make sure you have a good connection
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginTop: '2rem',
              }}>
                <Link
                  href="/student/dashboard"
                  style={{
                    display: 'block',
                    padding: '0.875rem 1.5rem',
                    background: '#2563eb',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '0.9375rem',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1d4ed8';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(37, 99, 235, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(37, 99, 235, 0.2)';
                  }}
                >
                  View My Dashboard
                </Link>

                <Link
                  href="/student/lessons"
                  style={{
                    display: 'block',
                    padding: '0.875rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '0.9375rem',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                >
                  View All Lessons
                </Link>
              </div>
            </div>
          </div>

          {/* Footer Help */}
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            textAlign: 'center',
            marginTop: '1.5rem',
          }}>
            Need help?{' '}
            <a
              href="mailto:support@bridgelang.co.uk"
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
