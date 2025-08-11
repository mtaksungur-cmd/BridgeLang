import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    // styles klasörünü include et
    includePaths: [ path.join(process.cwd(), 'styles') ],

    // node_modules içindeki SCSS deprecations vs. sessize al
    quietDeps: true,
  },
};

export default nextConfig;