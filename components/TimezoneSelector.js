// components/TimezoneSelector.js
import { useState, useEffect } from 'react';

const COMMON_TIMEZONES = [
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Istanbul', label: 'Istanbul (TRT)' },
    { value: 'America/New_York', label: 'New York (EST/EDT)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
];

export default function TimezoneSelector({ value, onChange, label = 'Timezone' }) {
    const [detected, setDetected] = useState('');

    useEffect(() => {
        // Detect user's timezone
        try {
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setDetected(userTimezone);
        } catch (err) {
            setDetected('Europe/London');
        }
    }, []);

    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#1e293b'
            }}>
                {label}
            </label>

            <select
                value={value || detected}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    fontSize: '1rem',
                    background: 'white',
                    cursor: 'pointer'
                }}
            >
                {!value && detected && (
                    <option value={detected}>
                        {COMMON_TIMEZONES.find(tz => tz.value === detected)?.label || `${detected} (Auto-detected)`}
                    </option>
                )}

                {COMMON_TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>
                        {tz.label}
                    </option>
                ))}
            </select>

            {detected && !value && (
                <small style={{ display: 'block', marginTop: '0.25rem', color: '#64748b' }}>
                    Auto-detected: {detected}
                </small>
            )}
        </div>
    );
}
