import Head from 'next/head';
import styles from '../../scss/CookiePolicy.module.scss';

export default function CookiePolicy() {
  return (
    <>
      <Head>
        <title>Cookie Policy | BridgeLang</title>
        <meta
          name="description"
          content="BridgeLang Ltd Cookie Policy: how we use cookies, categories (strictly necessary, functional, analytics, advertising), third-party cookies, control options, legal compliance, and contact details."
        />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className={`container py-4 ${styles.legal}`} style={{ '--nav-height': '64px' }}>
        <header className={styles.header}>
          <h1>Cookie Policy – BridgeLang UK Ltd.</h1>
          <p className={styles.sub}>
            <em>Last Updated: 10 September 2025</em>
          </p>
        </header>

        <aside className={styles.toc} aria-label="Contents">
          <h3>Contents</h3>
          <ol>
            <li><a href="#intro">Introduction</a></li>
            <li><a href="#what">What Are Cookies?</a></li>
            <li><a href="#types">Types of Cookies We Use</a></li>
            <li><a href="#thirdparty">Third-Party Cookies</a></li>
            <li><a href="#control">How to Control Cookies</a></li>
            <li><a href="#updates">Updates to This Policy</a></li>
            <li><a href="#contact">Contact Us</a></li>
            <li><a href="#details">Cookie Details</a></li>
          </ol>
        </aside>

        <article className={styles.article}>
          <section id="intro">
            <h2>1. Introduction</h2>
            <p>1.1. This Cookie Policy explains how BridgeLang UK Ltd. (“BridgeLang”, “we”, “our”, or “us”) uses cookies and similar technologies on our website and any future mobile applications.</p>
            <p>1.2. By using our website, you agree to the use of cookies in accordance with this policy.</p>
            <p>1.3. We use non-essential cookies only with your prior consent collected via our Cookie Banner. You can accept, reject, or manage your preferences at any time through the Cookie Settings panel.</p>
            <p>1.4. Strictly necessary cookies that are essential to provide the service you request do not require consent. All other cookies are set only after you provide consent via the Cookie Banner.</p>
            <p>1.5. This Cookie Policy complies with the UK GDPR, the Data Protection Act 2018, and the Privacy and Electronic Communications Regulations (PECR).</p>
            <p>1.6. For information on how we process personal data (including your rights under data protection laws), please refer to our Privacy Policy.</p>
          </section>

          <section id="what">
            <h2>2. What Are Cookies?</h2>
            <p>2.1. Cookies are small text files stored on your device when you visit a website.</p>
            <p>2.2. They allow the website to recognize your device, remember preferences, and enhance your browsing experience.</p>
            <p>2.3. Similar technologies, such as pixels, tags, or local storage, may also be used and are covered under this policy.</p>
            <p>2.4. Cookies may be “session” cookies (expire when you close your browser) or “persistent” cookies (remain until their set expiry or deletion).</p>
          </section>

          <section id="types">
            <h2>3. Types of Cookies We Use</h2>

            <h3>3.1. Strictly Necessary Cookies</h3>
            <p>3.1.1. Required for the website to function properly.</p>
            <p>3.1.2. These cannot be disabled via our consent tools. You can set your browser to block or alert you about these cookies, but some parts of the site will not work.</p>

            <h3>3.2. Performance &amp; Analytics Cookies</h3>
            <p>3.2.1. Collect information about how visitors use our site.</p>
            <p>3.2.2. Help us improve website functionality and user experience.</p>

            <h3>3.3. Functional Cookies</h3>
            <p>3.3.1. Remember your preferences and settings (e.g., language or login details).</p>
            <p>3.3.2. Provide enhanced, more personalized features.</p>

            <h3>3.4. Advertising &amp; Targeting Cookies</h3>
            <p>3.4.1. Used to deliver relevant advertisements both on our website and across third-party platforms.</p>
            <p>3.4.2. These may also measure the effectiveness of advertising campaigns.</p>
          </section>

          <section id="thirdparty">
            <h2>4. Third-Party Cookies</h2>
            <p>4.1. Some cookies may be set by third-party services that appear on our site (e.g., analytics providers, payment processors, or embedded content such as videos).</p>
            <p>4.2. We do not control these third-party cookies, and users should review their respective policies for further details.</p>
          </section>

          <section id="control">
            <h2>5. How to Control Cookies</h2>
            <p>5.1. You can manage or disable cookies through your browser settings at any time.</p>
            <p>5.2. Please note that disabling certain cookies may affect the functionality of our website.</p>
            <p>5.3. Guidance on managing cookies for popular browsers is available at:</p>
            <ul>
              <li>5.3.1. <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a></li>
              <li>5.3.2. <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Firefox</a></li>
              <li>5.3.3. <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
              <li>5.3.4. <a href="https://support.microsoft.com/en-us/help/4027947/microsoft-edge-delete-cookies" target="_blank" rel="noopener noreferrer">Edge</a></li>
            </ul>
            <p>5.4. You can review or change your consent choices at any time via our Cookie Settings panel on the website.</p>
            <p>5.5. Where you reject non-essential cookies, the site will continue to function but some features may be limited.</p>
            <p>5.6. Your consent choices will be recorded and we may periodically re-prompt for consent.</p>
          </section>

          <section id="updates">
            <h2>6. Updates to This Policy</h2>
            <p>6.1. We may update this Cookie Policy from time to time to reflect changes in law, technology, or business practices.</p>
            <p>6.2. Any changes will be posted on this page with an updated “Last Updated” date.</p>
          </section>

          <section id="contact">
            <h2>7. Contact Us</h2>
            <p>If you have any questions or concerns regarding this Cookie Policy, please contact us:</p>
            <address>
              BridgeLang UK Ltd.<br />
              The Apex, Derriford Business Park, Brest Road, Plymouth, PL6 5FL, United Kingdom<br />
              Email: <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>
            </address>
          </section>

          <section id="details">
            <h2>8. Cookie Details</h2>
            <p>8.1. A current list of cookies (including provider, purpose, and retention period) is available via our Cookie Settings panel and is updated from time to time.</p>
          </section>
        </article>
      </main>
    </>
  );
}
