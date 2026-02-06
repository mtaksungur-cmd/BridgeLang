// AppCard.js - Robust Glassmorphic Card Component
export default function AppCard({ children, className = '', noPadding = false }) {
    const baseClasses = "bg-white/90 backdrop-blur-sm rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50";
    const paddingClass = noPadding ? "" : "p-8";

    return (
        <div className={`${baseClasses} ${paddingClass} ${className}`}>
            {children}
        </div>
    );
}

export function AppCardHeader({ children, className = '' }) {
    return <div className={`mb-6 ${className}`}>{children}</div>;
}

export function AppCardBody({ children, className = '' }) {
    return <div className={className}>{children}</div>;
}

export function AppCardFooter({ children, className = '' }) {
    return <div className={`mt-6 pt-6 border-t border-slate-200 ${className}`}>{children}</div>;
}
