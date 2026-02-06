'use client';
import { useState } from 'react';
import styles from '../../scss/ChatInterface.module.scss';

export default function ChatInterface() {
    const [message, setMessage] = useState('');
    const maxLength = 500;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim()) {
            // Handle send logic here
            console.log('Sending:', message);
            setMessage('');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.chatCard}>
                <div className={styles.header}>
                    <div className={styles.iconCircle}>
                        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className={styles.title}>Chat with Teacher</h2>
                        <p className={styles.subtitle}>Most tutors reply within 24 hours.</p>
                    </div>
                </div>

                <div className={styles.instructionBox}>
                    <p>
                        Use this space to <strong>introduce</strong> yourself or ask about lesson availability.
                    </p>
                </div>

                <div className={styles.exampleBox}>
                    <p className={styles.exampleLabel}>Example:</p>
                    <p className={styles.exampleText}>
                        "Hi, I'm looking to book a lesson this week. Are you available on weekdays?"
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputWrapper}>
                        <textarea
                            className={styles.textarea}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message..."
                            maxLength={maxLength}
                            rows={4}
                        />
                        <div className={styles.charCount}>
                            {message.length} / {maxLength}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.sendBtn}
                        disabled={!message.trim()}
                    >
                        Send
                    </button>
                </form>

                <div className={styles.warningBox}>
                    <svg className={styles.warningIcon} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>
                        Please avoid sharing personal contact details or external links.
                    </span>
                </div>
            </div>
        </div>
    );
}
