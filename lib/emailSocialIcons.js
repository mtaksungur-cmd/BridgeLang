/**
 * Official brand social icons for email (Simple Icons paths, brand colors).
 * Embedded as base64 data URIs so no external assets or hosting are required.
 */

function toDataUri(svg) {
  return 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');
}

// Official icon paths (Simple Icons), 24x24 viewBox, brand fill colors
const INSTAGRAM_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#E4405F"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.14 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.14-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.058 1.645-.07 4.849-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.358-.2 6.78-2.618 6.98-6.98.059-1.281.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.2-4.358-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>';

const YOUTUBE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>';

const FACEBOOK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.914v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';

const LINKEDIN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';

const INSTAGRAM_DATA_URI = toDataUri(INSTAGRAM_SVG);
const YOUTUBE_DATA_URI = toDataUri(YOUTUBE_SVG);
const FACEBOOK_DATA_URI = toDataUri(FACEBOOK_SVG);
const LINKEDIN_DATA_URI = toDataUri(LINKEDIN_SVG);

const BRIDGELANG_SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/bridgelang_uk?igsh=a3U0czIyODJ1cDNy',
  youtube: 'https://youtube.com/@bridgelang_uk?si=tA-V6RyZftqOvtRc',
  facebook: 'https://www.facebook.com/share/17858srkmF/',
  linkedin: 'https://www.linkedin.com/company/bridgelang-uk/',
};

/**
 * Returns the Stay Connected social icons HTML table fragment for emails.
 * Uses official brand SVGs as inline base64 images (no external files needed).
 */
export function getEmailSocialIconsHtml(tableStyle = 'margin: 10px auto;') {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="${tableStyle}">
    <tr>
        <td style="padding: 0 8px 0 0;">
          <a href="${BRIDGELANG_SOCIAL_LINKS.instagram}" target="_blank" style="text-decoration:none;">
            <img src="${INSTAGRAM_DATA_URI}" alt="Instagram" width="36" height="36" style="display:block; border:0;" />
          </a>
        </td>
        <td style="padding: 0 8px 0 0;">
          <a href="${BRIDGELANG_SOCIAL_LINKS.youtube}" target="_blank" style="text-decoration:none;">
            <img src="${YOUTUBE_DATA_URI}" alt="YouTube" width="36" height="36" style="display:block; border:0;" />
          </a>
        </td>
        <td style="padding: 0 8px 0 0;">
          <a href="${BRIDGELANG_SOCIAL_LINKS.facebook}" target="_blank" style="text-decoration:none;">
            <img src="${FACEBOOK_DATA_URI}" alt="Facebook" width="36" height="36" style="display:block; border:0;" />
          </a>
        </td>
        <td style="padding: 0 8px 0 0;">
          <a href="${BRIDGELANG_SOCIAL_LINKS.linkedin}" target="_blank" style="text-decoration:none;">
            <img src="${LINKEDIN_DATA_URI}" alt="LinkedIn" width="36" height="36" style="display:block; border:0;" />
          </a>
        </td>
    </tr>
    </table>`;
}
