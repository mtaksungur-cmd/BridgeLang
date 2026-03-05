// Page Layout Wrapper
// Applies lavender gradient background and responsive padding

export default function PageLayout({ children, className = '' }) {
    return (
        <div className={`min-h-screen bg-gradient-to-b from-[#e8eef7] to-[#d4ddf0] p-4 md:p-8 ${className}`}>
            {children}
        </div>
    );
}

// Page Header Component
export function PageHeader({ title, subtitle, action, className = '' }) {
    return (
        <div className={`max-w-7xl mx-auto mb-10 ${className}`}>
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-base text-slate-600 mt-2 font-medium">
                            {subtitle}
                        </p>
                    )}
                </div>
                {action && (
                    <div className="ml-4">
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
}

// Container for max-width content
export function Container({ children, className = '' }) {
    return (
        <div className={`max-w-7xl mx-auto ${className}`}>
            {children}
        </div>
    );
}
