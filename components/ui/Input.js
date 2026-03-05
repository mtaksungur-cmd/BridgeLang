// Premium Form Input Components
// All inputs use h-12 and rounded-2xl

export default function Input({
    label,
    error,
    helperText,
    className = '',
    ...props
}) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {label}
                </label>
            )}
            <input
                className={`
          h-12 w-full px-4 
          rounded-2xl 
          bg-slate-50 
          border 
          ${error ? 'border-red-500' : 'border-slate-200'}
          focus:ring-2 
          focus:ring-blue-500/20 
          focus:border-blue-500 
          focus:outline-none 
          transition-all
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
            )}
        </div>
    );
}

export function TextArea({
    label,
    error,
    helperText,
    rows = 4,
    className = '',
    ...props
}) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {label}
                </label>
            )}
            <textarea
                rows={rows}
                className={`
          w-full px-4 py-3
          rounded-2xl 
          bg-slate-50 
          border 
          ${error ? 'border-red-500' : 'border-slate-200'}
          focus:ring-2 
          focus:ring-blue-500/20 
          focus:border-blue-500 
          focus:outline-none 
          transition-all
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
            )}
        </div>
    );
}

export function Select({
    label,
    error,
    helperText,
    children,
    className = '',
    ...props
}) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {label}
                </label>
            )}
            <select
                className={`
          h-12 w-full px-4 
          rounded-2xl 
          bg-slate-50 
          border 
          ${error ? 'border-red-500' : 'border-slate-200'}
          focus:ring-2 
          focus:ring-blue-500/20 
          focus:border-blue-500 
          focus:outline-none 
          transition-all
          ${className}
        `}
                {...props}
            >
                {children}
            </select>
            {error && (
                <p className="mt-1.5 text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
            )}
        </div>
    );
}

export function Checkbox({ label, className = '', ...props }) {
    return (
        <label className="inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                {...props}
            />
            {label && (
                <span className="ml-2.5 text-sm font-medium text-slate-700">
                    {label}
                </span>
            )}
        </label>
    );
}
