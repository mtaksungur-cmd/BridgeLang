import React from 'react';
import styles from '../scss/PricingTable.module.scss';
import { InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

export default function PricingTable() {
    const showInfo = () => {
        toast('Use messages to confirm availability or ask lesson-related questions before booking.', {
            icon: 'ℹ️',
            duration: 5000,
            position: 'top-center',
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
                fontSize: '14px',
            },
        });
    };

    return (
        <section className={styles.section}>
            <div className="container">

                <div className={styles.header}>
                    <h2>Pricing &amp; Plans</h2>
                    <p>
                        Explore tutors freely. You can start with a 15-minute intro lesson
                        and continue only if it feels right.
                    </p>
                </div>

                <div className={styles.tableContainer}>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.featureCol}>Feature</th>
                                    <th>Free</th>
                                    <th>Starter</th>
                                    <th>Pro</th>
                                    <th className={styles.vipCol}>VIP</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="fw-bold">Price</td>
                                    <td>
                                        <span className={styles.price}>
                                            £0 <small>(no expiry)</small>
                                        </span>
                                        <div className={styles.planDesc}>Explore tutors and start at your own pace.</div>
                                    </td>
                                    <td>
                                        <span className={styles.price}>
                                            £4.99 <small>(1 month · no auto-renewal)</small>
                                        </span>
                                        <div className={styles.planDesc}>A simple step into regular learning.</div>
                                    </td>
                                    <td>
                                        <span className={styles.price}>
                                            £9.99 <small>(1 month · no auto-renewal)</small>
                                        </span>
                                        <div className={styles.planDesc}>Designed for consistent progress.</div>
                                    </td>
                                    <td className={`${styles.vipCol} ${styles.vipCell}`}>
                                        <span className={styles.price}>
                                            £14.99 <small>(1 month · no auto-renewal)</small>
                                        </span>
                                        <div className={styles.planDesc}>Maximum flexibility for committed learners.</div>
                                    </td>
                                </tr>

                                <tr>
                                    <td className="fw-bold">Profile views</td>
                                    <td>Unlimited</td>
                                    <td>Unlimited</td>
                                    <td>Unlimited</td>
                                    <td className={`${styles.vipCol} ${styles.vipCell}`}>Unlimited</td>
                                </tr>

                                <tr>
                                    <td className="fw-bold">
                                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                            Pre-lesson messages
                                            <button
                                                type="button"
                                                onClick={showInfo}
                                                className={styles.tooltipIcon}
                                                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                aria-label="More Info"
                                            >
                                                <InformationCircleIcon width={16} className="text-blue-500" />
                                            </button>
                                        </div>
                                    </td>
                                    <td>Up to 5</td>
                                    <td>Up to 10</td>
                                    <td>Up to 20</td>
                                    <td className={`${styles.vipCol} ${styles.vipCell}`}>Unlimited</td>
                                </tr>

                                <tr>
                                    <td className="fw-bold">Messages after lesson</td>
                                    <td>Unlimited</td>
                                    <td>Unlimited</td>
                                    <td>Unlimited</td>
                                    <td className={`${styles.vipCol} ${styles.vipCell}`}>Unlimited</td>
                                </tr>

                                <tr>
                                    <td className="fw-bold">
                                        Community reward
                                        <br />
                                        <span className="text-muted fw-normal small fst-italic">
                                            A one-time thank-you applied to your 2nd lesson after sharing feedback about the tutor
                                        </span>
                                    </td>
                                    <td>25% discount</td>
                                    <td>30% discount</td>
                                    <td>35% discount</td>
                                    <td className={`${styles.vipCol} ${styles.vipLast}`}>40% discount</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.includes}>
                        <h4>All plans include</h4>
                        <div className={styles.featuresGrid}>
                            <div className={styles.featureItem}>
                                <CheckCircleIcon /> Unlimited tutor profile views
                            </div>
                            <div className={styles.featureItem}>
                                <CheckCircleIcon /> Unlimited messages after your first lesson with each tutor
                            </div>
                            <div className={styles.featureItem}>
                                <CheckCircleIcon /> One 15-minute intro lesson per tutor (£4.99)
                                <div className={styles.fairUse}>Available to all learners · Fair-use policy applies</div>
                            </div>
                        </div>
                    </div>
                </div>

                <p className={styles.footerNote}>
                    No auto-renewal. Free plan has no expiry. Paid plans are one-time purchases valid for 1 month.
                </p>

            </div>
        </section>
    );
}
