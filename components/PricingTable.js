import React from 'react';
import styles from '../scss/PricingTable.module.scss';
import { InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

export default function PricingTable() {
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
                                        £0 <small>(one-time access)</small>
                                    </span>
                                    <div className={styles.planDesc}>Explore tutors and start at your own pace.</div>
                                </td>
                                <td>
                                    <span className={styles.price}>
                                        £4.99 <small>(1-month access)</small>
                                    </span>
                                    <div className={styles.planDesc}>A simple step into regular learning.</div>
                                </td>
                                <td>
                                    <span className={styles.price}>
                                        £9.99 <small>(1-month access)</small>
                                    </span>
                                    <div className={styles.planDesc}>Designed for consistent progress.</div>
                                </td>
                                <td className={`${styles.vipCol} ${styles.vipCell}`}>
                                    <span className={styles.price}>
                                        £14.99 <small>(1-month access)</small>
                                    </span>
                                    <div className={styles.planDesc}>Maximum flexibility for committed learners.</div>
                                </td>
                            </tr>

                            <tr>
                                <td className="fw-bold">
                                    Messages before booking
                                    <span
                                        className={styles.tooltipIcon}
                                        title="Use messages to confirm availability or ask lesson-related questions before booking."
                                    >
                                        <InformationCircleIcon width={18} />
                                    </span>
                                </td>
                                <td>Up to 5</td>
                                <td>Up to 10</td>
                                <td>Up to 20</td>
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

                    <div className={styles.includes}>
                        <h4>All plans include</h4>
                        <div className={styles.featuresGrid}>
                            <div className={styles.featureItem}>
                                <CheckCircleIcon /> Unlimited tutor profile views
                            </div>
                            <div className={styles.featureItem}>
                                <CheckCircleIcon /> Unlimited messages after a lesson
                            </div>
                            <div className={styles.featureItem}>
                                <CheckCircleIcon /> One 15-minute intro lesson per tutor (£4.99)
                                <div className={styles.fairUse}>Available to all learners · Fair-use policy applies</div>
                            </div>
                        </div>
                    </div>
                </div>

                <p className={styles.footerNote}>
                    No long-term commitment. Choose a tutor and continue only if it&apos;s the right match.
                </p>

            </div>
        </section>
    );
}
