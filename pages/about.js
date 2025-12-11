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
              BridgeLang Ltd. is a UK-based language learning platform designed to help learners build the real-life English they need to succeed in British workplaces, public services and everyday communication.
              We connect learners with verified UK-experienced tutors and provide a trusted, structured and supportive environment where progress feels clear, practical and achievable.
            </p>
          </section>

          <section>
            <h2>Our Mission</h2>
            <p>
             Our mission is to make life in the UK easier and more confident for every learner. We do this by offering high-quality, personalised English lessons focused on real situations — from job interviews and GP appointments 
             to workplace communication and community integration. We are committed to delivering a premium learning experience that is flexible, reliable and genuinely life-changing.
            </p>
          </section>

          <section>
            <h2>Our Vision</h2>
            <p>
              Our vision is to become the UK’s leading platform for real-life English — the place learners choose when they want practical, authentic and culture-aware language support.
              We aim to build a modern learning ecosystem where expert tutors, smart technology and personalised pathways come together to help learners thrive in both personal and professional life in the UK.
              In the future, as we grow, we aspire to expand our model globally while remaining rooted in our purpose: bridging languages, cultures, and opportunities.
            </p>
          </section>

          <section>
            <h2>Our Core Values</h2>
            <ul>
              <li><strong>Clarity &amp; Trust</strong> – We prioritise transparency, safety, and professional standards in everything we do.</li>
              <li><strong>Excellence</strong> – We deliver premium teaching quality through verified, highly skilled tutors.</li>
              <li><strong>Practicality</strong> – We focus on real-world English that learners can use immediately in UK life.</li>
              <li><strong>Inclusivity</strong> – We support learners from every background with respect, patience and cultural understanding.</li>
              <li><strong>Progress</strong> – We believe in steady, measurable growth supported by tools, guidance and long-term learning rewards.</li>
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
