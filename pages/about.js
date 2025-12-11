import Head from "next/head";
import styles from "../scss/About.module.scss";

export default function About() {
  return (
    <>
      <Head>
        <title>About Us | BridgeLang Ltd.</title>
        <meta
          name="description"
          content="About BridgeLang Ltd. – Who we are, our mission, vision, values, and company details."
        />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className={`container py-4 ${styles.page}`} style={{ '--nav-height': '64px' }}>
        {/* Header */}
        <header className={styles.header}>
          <h1>About Us – BridgeLang Ltd.</h1>
        </header>

        <article className={styles.article}>
          <section>
            <h2>Who We Are</h2>
            <p>
              BridgeLang Ltd. is a UK-based language learning platform designed to help learners build the real-life English they need to succeed in British workplaces, public services, and everyday communication.
              We connect learners with verified UK-experienced tutors and provide a trusted, structured, and supportive environment where progress feels clear, practical, and achievable.
            </p>
          </section>

          <section>
            <h2>Our Mission</h2>
            <p>
              Our mission is to empower learners and educators by bridging cultures through language.
              We are committed to providing a trusted, flexible, and inclusive platform where learners
              can thrive, gain confidence, and truly feel a sense of belonging in the UK.
            </p>
          </section>

          <section>
            <h2>Our Vision</h2>
            <p>
              Our vision is to become the UK’s most trusted and innovative language learning platform,
              connecting diverse communities with highly skilled teachers. In the long term, we aspire
              to expand globally, offering not only English but also other in-demand languages, making
              professional language education accessible to everyone. We see a future where BridgeLang
              serves as a bridge — uniting cultures, fostering understanding, and supporting learners
              to thrive in both personal and professional life.
            </p>
          </section>

          <section>
            <h2>Our Core Values</h2>
            <ul>
              <li><strong>Integrity &amp; Transparency</strong> – We build trust through honesty and fairness.</li>
              <li><strong>Excellence</strong> – We maintain the highest standards in teaching and technology.</li>
              <li><strong>Community</strong> – We bring people together across cultures and backgrounds.</li>
              <li><strong>Innovation</strong> – We embrace creativity and adapt to learners’ evolving needs.</li>
              <li><strong>Accessibility</strong> – We strive to make language education available to everyone.</li>
            </ul>
          </section>

          <section>
            <h2>Company Details</h2>
            <address>
              <p>BridgeLang Ltd.<br/>
                Registered in England &amp; Wales<br/>
                Company Number: 16555217<br/>
                The Apex, Derriford Business Park,<br/>
                Brest Road, Plymouth, PL6 5FL, United Kingdom<br/>
                📧 <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>
              </p>
            </address>
          </section>
        </article>
      </main>
    </>
  );
}
