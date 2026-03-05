// AppButton.js - Premium Pill-Shaped Button Component
export default function AppButton({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) {
    const baseClasses = "rounded-full font-bold transition-all active:scale-95 flex items-center justify-center gap-2";

    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200/50",
        secondary: "bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 shadow-md shadow-amber-200/50",
        ghost: "border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm",
        success: "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200/50",
        danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200/50",
    };

    const sizes = {
        sm: "px-6 py-2 text-sm",
        md: "px-8 py-3 text-base",
        lg: "px-10 py-4 text-lg",
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
