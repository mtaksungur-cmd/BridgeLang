import SeoHead from '../components/SeoHead';
import PricingTable from '../components/PricingTable';
import styles from '../scss/PlatformReview.module.scss'; // Reuse common layout styles

export default function PricingPage() {
  return (
    <>
      <SeoHead 
        title="Pricing & Plans - BridgeLang"
        description="Choose the right membership plan for your English learning journey."
      />
      <div className={styles.page} style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e2532' }}>Pricing & Plans</h1>
            <p style={{ fontSize: '1.125rem', color: '#4a5568', marginTop: '1rem' }}>
              Clear pricing, no hidden fees. Start with an intro lesson and choose a plan that fits your goals.
            </p>
          </div>
          <PricingTable />
        </div>
      </div>
    </>
  );
}
