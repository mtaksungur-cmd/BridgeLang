import Head from 'next/head';
import styles from '../../scss/AccessibilityNote.module.scss';

export default function AccessibilityNote() {
  return (
    <>
      <Head>
        <title>Accessibility Note | BridgeLang</title>
        <meta
          name="description"
          content="BridgeLang's current position on accessibility, known limitations, how to give feedback, and plans for future improvements."
        />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className={`container py-4 ${styles.page}`} style={{ '--nav-height': '64px' }}>
        {/* Başlık */}
        <header className={styles.header}>
          <h1>Accessibility Note<br /><small>(BridgeLang UK Ltd.)</small></h1>
          <p className={styles.lastUpdated}><em>Last Updated: 10 September 2025</em></p>
        </header>

        {/* İçindekiler (sol kutu) */}
        <aside className={styles.toc} aria-label="Contents">
          <h3>Contents</h3>
          <ol>
            <li><a href="#s1">Introduction</a>
              <ol>
                <li><a href="#s1-1">1.1 Purpose</a></li>
                <li><a href="#s1-2">1.2 Scope</a></li>
              </ol>
            </li>
            <li><a href="#s2">Our Commitment</a></li>
            <li><a href="#s3">Current Limitations</a></li>
            <li><a href="#s4">Feedback and Support</a></li>
            <li><a href="#s5">Future Improvements</a></li>
          </ol>
        </aside>

        {/* Makale */}
        <article className={styles.article}>
          <section id="s1">
            <h2>1. Introduction</h2>

            <h3 id="s1-1">1.1 Purpose</h3>
            <p>
              This Accessibility Note explains BridgeLang’s current position on accessibility and our plans for future improvements.
            </p>

            <h3 id="s1-2">1.2 Scope</h3>
            <p>
              This Note applies to the BridgeLang Platform and all related services offered in the United Kingdom and,
              where relevant, to any future services we may introduce.
            </p>
          </section>

          <section id="s2">
            <h2>2. Our Commitment</h2>
            <p>
              BridgeLang is committed to making our services as inclusive and accessible as possible. While our Platform
              does not yet meet full web accessibility standards, we recognise the importance of accessibility and are
              continuously working towards improving the experience for all users.
            </p>
          </section>

          <section id="s3">
            <h2>3. Current Limitations</h2>
            <p>
              At this stage, some parts of the Platform may not be fully compatible with assistive technologies (such as
              screen readers) or accessible navigation tools. We acknowledge these limitations and plan to address them
              as our Platform develops.
            </p>
          </section>

          <section id="s4">
            <h2>4. Feedback and Support</h2>
            <p>
              If you encounter any accessibility barriers while using BridgeLang, please contact us at:{' '}
              <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>. We welcome feedback and will make
              reasonable efforts to provide alternative ways to access our services where possible.
            </p>
          </section>

          <section id="s5">
            <h2>5. Future Improvements</h2>
            <p>
              BridgeLang intends to incorporate accessibility enhancements in future updates of the Platform. As the
              Platform develops, our goal is to align with recognised standards (such as WCAG) to ensure equitable access.
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
