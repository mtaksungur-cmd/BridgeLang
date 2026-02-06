// Premium Glassmorphic Card Component
// Usage: Wrap any content section in this card for consistent styling

export default function Card({ children, className = '', noPadding = false }) {
    return (
        <div
            className={`
        bg-white/90 
        backdrop-blur-sm 
        rounded-[32px] 
        shadow-[0_20px_50px_rgba(0,0,0,0.05)] 
        border 
        border-white/50 
        ${noPadding ? '' : 'p-8'}
        ${className}
      `}
        >
            {children}
        </div>
    );
}

// Variants for specific use cases
export function CardHeader({ children, className = '' }) {
    return (
        <div className={`mb-6 ${className}`}>
            {children}
        </div>
    );
}

export function CardBody({ children, className = '' }) {
    return (
        <div className={className}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className = '' }) {
    return (
        <div className={`mt-6 pt-6 border-t border-slate-200 ${className}`}>
            {children}
        </div>
    );
}
