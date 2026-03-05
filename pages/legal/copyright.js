import Head from 'next/head';
import styles from '../../scss/CopyrightPolicy.module.scss';

export default function CopyrightIpPolicy() {
  return (
    <>
      <Head>
        <title>Copyright & Intellectual Property Policy | BridgeLang</title>
        <meta
          name="description"
          content="BridgeLang intellectual property policy covering platform content, teacher lesson materials, user-generated content, social media submissions, notice-and-takedown, counter-notice, and repeat infringer procedures."
        />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className={`container py-4 ${styles.page}`} style={{ '--nav-height': '64px' }}>
        {/* Başlık */}
        <header className={styles.header}>
          <h1>Copyright &amp; Intellectual Property Policy</h1>
          <p className={styles.lastUpdated}><em>Last Updated: 10 September 2025</em></p>
        </header>

        {/* İçindekiler (sol kutu) */}
        <aside className={styles.toc} aria-label="Contents">
          <h3>Contents</h3>
          <ol>
            <li><a href="#s1">Purpose and Scope</a></li>
            <li><a href="#s2">Ownership of the Platform IP</a></li>
            <li><a href="#s3">Lesson Materials and Teacher-Created Content</a></li>
            <li><a href="#s4">Other User-Generated Content (UGC)</a></li>
            <li><a href="#s5">Social Media &amp; Promotional Submissions</a></li>
            <li><a href="#s6">Permitted Uses by Students</a></li>
            <li><a href="#s7">Prohibited Conduct</a></li>
            <li><a href="#s8">Copyright Notice-and-Takedown Procedure</a></li>
            <li><a href="#s9">Counter-Notice Procedure</a></li>
            <li><a href="#s10">Repeat Infringers</a></li>
            <li><a href="#s11">Third-Party Materials</a></li>
            <li><a href="#s12">Moral Rights and Credits</a></li>
            <li><a href="#s13">Licence Termination</a></li>
            <li><a href="#s14">Changes to this Policy</a></li>
            <li><a href="#s15">Contact</a></li>
          </ol>
        </aside>

        {/* Makale (sağ taraf) */}
        <article className={styles.article}>
          <section id="s1">
            <h2>1. Purpose and Scope</h2>
            <p>
              This Policy forms part of the BridgeLang Terms of Use and applies to all access to and use of
              content on or via the BridgeLang platform (the “Platform”). In the event of any conflict,
              the Terms of Use prevail.
            </p>
          </section>

          <section id="s2">
            <h2>2. Ownership of the Platform IP</h2>
            <p>
              All trademarks, logos, service marks, software, design, and proprietary content on the
              Platform are owned by BridgeLang UK Ltd or its licensors. Users are granted a limited,
              non‑exclusive licence to use such materials strictly for educational purposes on the Platform.
              Copying, reproduction, modification, or distribution without prior consent is prohibited.
            </p>
          </section>

          <section id="s3">
            <h2>3. Lesson Materials and Teacher-Created Content</h2>
            <p>
              Teachers retain ownership of their lesson materials. By uploading or providing materials
              through the Platform, Teachers grant BridgeLang a licence to host, process, and deliver
              such materials for the purpose of providing lessons. Students and Teachers must not share
              or distribute Teacher materials outside the Platform without permission from the rights holder.
            </p>
          </section>

          <section id="s4">
            <h2>4. Other User-Generated Content (UGC)</h2>
            <p>
              Users must ensure they own or have the necessary rights to any content submitted to the
              Platform. BridgeLang may host and display UGC as necessary to operate and improve services.
              Submissions must not include confidential information or infringing materials.
            </p>
          </section>

          <section id="s5">
            <h2>5. Social Media &amp; Promotional Submissions</h2>
            <p>
              Where users or teachers voluntarily provide testimonials, short videos, images, or other
              media for promotional purposes, they grant BridgeLang a licence to use, reproduce, adapt,
              publish, and display such content for marketing and Platform improvement, with credit where
              practicable.
            </p>
          </section>

          <section id="s6">
            <h2>6. Permitted Uses by Students</h2>
            <p>
              Students receive a personal, non‑transferable licence to access Teacher materials solely
              for learning via the Platform. Downloading or redistributing content is prohibited unless
              expressly permitted by the rights holder.
            </p>
          </section>

          <section id="s7">
            <h2>7. Prohibited Conduct</h2>
            <p>
              Users must not circumvent payments or licensing, upload unlawful or infringing content, or
              record lessons without consent. Platform content may not be used to develop or train AI
              models without a separate express licence from BridgeLang.
            </p>
          </section>

          <section id="s8">
            <h2>8. Copyright Notice-and-Takedown Procedure</h2>
            <p>
              If you believe that content on the Platform infringes your copyright, please contact us at{' '}
              <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a> with sufficient detail
              to identify the material and your rights. Knowingly false or misleading notices may result in penalties.
            </p>
          </section>

          <section id="s9">
            <h2>9. Counter-Notice Procedure</h2>
            <p>
              If your material was removed by mistake or misidentification, you may submit a counter‑notice
              including your identification details, contact information, the material at issue, and a
              good‑faith statement explaining why the removal was in error.
            </p>
          </section>

          <section id="s10">
            <h2>10. Repeat Infringers</h2>
            <p>
              BridgeLang may suspend or terminate accounts of users who are found to be repeat infringers
              of intellectual property rights.
            </p>
          </section>

          <section id="s11">
            <h2>11. Third-Party Materials</h2>
            <p>
              Users must comply with third‑party licences for any external content. BridgeLang is not
              responsible for third‑party materials or links hosted or embedded through the Platform.
            </p>
          </section>

          <section id="s12">
            <h2>12. Moral Rights and Credits</h2>
            <p>
              BridgeLang will credit contributors where practicable and may make reasonable edits for clarity,
              formatting, or brevity without altering the underlying meaning.
            </p>
          </section>

          <section id="s13">
            <h2>13. Licence Termination</h2>
            <p>
              BridgeLang may suspend, restrict, or remove content that violates this Policy or the Terms of Use
              and may terminate licences where necessary to protect rights.
            </p>
          </section>

          <section id="s14">
            <h2>14. Changes to this Policy</h2>
            <p>
              BridgeLang may update this Policy from time to time. The latest version will be posted on the
              Platform and becomes effective upon posting.
            </p>
          </section>

          <section id="s15">
            <h2>15. Contact</h2>
            <p>
              Questions or notices should be sent to:{' '}
              <a href="mailto:contact@bridgelang.co.uk">contact@bridgelang.co.uk</a>.
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
