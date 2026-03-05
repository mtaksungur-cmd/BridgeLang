// OTP Input Component with 6 separate boxes
import { useRef, useState, useEffect } from 'react';

export default function OTPInput({ value, onChange, onComplete }) {
    const inputRefs = useRef([]);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);

    useEffect(() => {
        // Sync with parent value
        if (value) {
            const digits = value.split('').slice(0, 6);
            setOtp([...digits, ...Array(6 - digits.length).fill('')]);
        }
    }, [value]);

    const handleChange = (index, digit) => {
        // Only allow numbers
        if (digit && !/^\d$/.test(digit)) return;

        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        // Update parent
        const otpString = newOtp.join('');
        onChange(otpString);

        // Auto-focus next input
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Call onComplete when all 6 digits entered
        if (otpString.length === 6 && onComplete) {
            onComplete(otpString);
        }
    };

    const handleKeyDown = (index, e) => {
        // Backspace: clear current or go to previous
        if (e.key === 'Backspace') {
            e.preventDefault();
            if (otp[index]) {
                handleChange(index, '');
            } else if (index > 0) {
                inputRefs.current[index - 1]?.focus();
                handleChange(index - 1, '');
            }
        }
        // Arrow keys navigation
        else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
        const newOtp = pastedData.split('');
        while (newOtp.length < 6) newOtp.push('');
        setOtp(newOtp);
        onChange(pastedData);

        // Focus last filled input or first empty
        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs.current[focusIndex]?.focus();

        if (pastedData.length === 6 && onComplete) {
            onComplete(pastedData);
        }
    };

    return (
        <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    autoFocus={index === 0}
                    style={{
                        width: '52px',
                        height: '64px',
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        textAlign: 'center',
                        border: '2px solid',
                        borderColor: digit ? '#3b82f6' : '#cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        background: 'white',
                        color: '#0f172a',
                        transition: 'all 0.2s',
                        boxShadow: digit ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.select();
                    }}
                    onBlur={(e) => {
                        if (!digit) e.target.style.borderColor = '#cbd5e1';
                    }}
                />
            ))}
        </div>
    );
}
