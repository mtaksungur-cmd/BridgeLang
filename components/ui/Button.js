// Premium Button Component with Variants
// All buttons use pill-shape (rounded-full)

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
        primary: 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-amber-400',
        secondary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        ghost: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-2.5 text-base',
        lg: 'px-8 py-3 text-lg',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

// Specialized button variants
export function ButtonLink({ children, href, className = '', ...props }) {
    return (
        <a
            href={href}
            className={`inline-flex items-center justify-center font-semibold rounded-full px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 transition-all ${className}`}
            {...props}
        >
            {children}
        </a>
    );
}

export function ButtonIcon({ children, variant = 'ghost', className = '', ...props }) {
    const variants = {
        ghost: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
    };

    return (
        <button
            className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-all ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
