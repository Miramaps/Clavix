/**
 * Logo service for fetching company logos
 * Uses multiple providers with fallback
 */

/**
 * Get company logo URL from various sources
 */
export async function getCompanyLogo(
  website?: string,
  companyName?: string
): Promise<string | null> {
  if (!website) return null;
  
  try {
    // Extract domain from website
    const domain = extractDomain(website);
    if (!domain) return null;
    
    // Try multiple logo services in order
    
    // 1. Clearbit (free for low volume)
    const clearbitUrl = `https://logo.clearbit.com/${domain}`;
    if (await checkImageExists(clearbitUrl)) {
      return clearbitUrl;
    }
    
    // 2. Google Favicon (fallback)
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    return faviconUrl;
    
  } catch (error) {
    console.error('Error fetching logo:', error);
    return null;
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

/**
 * Check if image URL exists
 */
async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate logo placeholder with company initials
 */
export function getLogoPlaceholder(companyName: string): string {
  const initials = companyName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  // Generate a deterministic color based on company name
  const hash = companyName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const hue = Math.abs(hash) % 360;
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
      <rect width="128" height="128" fill="hsl(${hue}, 70%, 60%)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="48" fill="white" font-weight="bold">
        ${initials}
      </text>
    </svg>
  `)}`;
}
