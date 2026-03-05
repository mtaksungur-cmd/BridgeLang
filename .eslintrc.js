module.exports = {
    extends: 'next/core-web-vitals',
    rules: {
        'react/no-unescaped-entities': 'off',
        '@next/next/no-img-element': 'warn',
        'react/jsx-no-undef': 'warn',
        'jsx-a11y/alt-text': 'warn',
        'react-hooks/exhaustive-deps': 'warn',
        '@next/next/no-html-link-for-pages': 'warn',
        '@next/next/next-script-for-ga': 'warn'
    }
};
