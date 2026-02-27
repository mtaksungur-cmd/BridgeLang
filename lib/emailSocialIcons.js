/**
 * Social media icons for emails.
 * Uses CDN-hosted PNG URLs (icons8) for reliable display across email clients.
 * Data URIs are often blocked by Gmail, Outlook, etc.
 */

const INSTAGRAM_ICON = 'https://img.icons8.com/fluency/48/instagram-new.png';
const YOUTUBE_ICON = 'https://img.icons8.com/fluency/48/youtube-play.png';
const FACEBOOK_ICON = 'https://img.icons8.com/fluency/48/facebook-new.png';
const LINKEDIN_ICON = 'https://img.icons8.com/fluency/48/linkedin.png';

const BRIDGELANG_SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/bridgelang_uk?igsh=a3U0czIyODJ1cDNy',
  youtube: 'https://youtube.com/@bridgelang_uk?si=tA-V6RyZftqOvtRc',
  facebook: 'https://www.facebook.com/share/17858srkmF/',
  linkedin: 'https://www.linkedin.com/company/bridgelang-uk/',
};

/**
 * Returns the Stay Connected social icons HTML table fragment for emails.
 * Uses CDN-hosted PNG icons for reliable display across all email clients.
 */
export function getEmailSocialIconsHtml(tableStyle = 'margin: 10px auto;') {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="${tableStyle}">
    <tr>
        <td style="padding: 0 8px 0 0;">
          <a href="${BRIDGELANG_SOCIAL_LINKS.instagram}" target="_blank" style="text-decoration:none;">
            <img src="${INSTAGRAM_ICON}" alt="Instagram" width="36" height="36" style="display:block; border:0; border-radius:8px;" />
          </a>
        </td>
        <td style="padding: 0 8px 0 0;">
          <a href="${BRIDGELANG_SOCIAL_LINKS.youtube}" target="_blank" style="text-decoration:none;">
            <img src="${YOUTUBE_ICON}" alt="YouTube" width="36" height="36" style="display:block; border:0; border-radius:8px;" />
          </a>
        </td>
        <td style="padding: 0 8px 0 0;">
          <a href="${BRIDGELANG_SOCIAL_LINKS.facebook}" target="_blank" style="text-decoration:none;">
            <img src="${FACEBOOK_ICON}" alt="Facebook" width="36" height="36" style="display:block; border:0; border-radius:8px;" />
          </a>
        </td>
        <td style="padding: 0 8px 0 0;">
          <a href="${BRIDGELANG_SOCIAL_LINKS.linkedin}" target="_blank" style="text-decoration:none;">
            <img src="${LINKEDIN_ICON}" alt="LinkedIn" width="36" height="36" style="display:block; border:0; border-radius:8px;" />
          </a>
        </td>
    </tr>
    </table>`;
}
