/**
 * DIFFERENTIAL PRIVACY-FIRST ANALYTICS ENGINE
 * 
 * Strictly operates only AFTER explicit cookie consent is granted.
 * Collects zero PII, zero cross-site cookies, zero keystrokes.
 */

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  personalization: boolean;
  decided: boolean;
  updatedAt: string;
}

export function getStoredCookiePreferences(): CookiePreferences {
  const stored = localStorage.getItem('differential_cookie_consent');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }
  return {
    essential: true,
    analytics: false,
    personalization: false,
    decided: false,
    updatedAt: new Date().toISOString()
  };
}

export function saveCookiePreferences(prefs: Partial<CookiePreferences>) {
  const current = getStoredCookiePreferences();
  const updated: CookiePreferences = {
    ...current,
    ...prefs,
    essential: true, // Always required for security & authentication
    decided: true,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem('differential_cookie_consent', JSON.stringify(updated));
  return updated;
}

export class PrivacyAnalytics {
  private static instance: PrivacyAnalytics;
  private analyticsId: string;

  private constructor() {
    this.analyticsId = import.meta.env.VITE_ANALYTICS_ID || 'DIFF-PRV-98421';
  }

  public static getInstance(): PrivacyAnalytics {
    if (!PrivacyAnalytics.instance) {
      PrivacyAnalytics.instance = new PrivacyAnalytics();
    }
    return PrivacyAnalytics.instance;
  }

  public isConsentGranted(): boolean {
    const prefs = getStoredCookiePreferences();
    return prefs.decided && prefs.analytics === true;
  }

  public trackPageView(path: string, title: string) {
    if (!this.isConsentGranted()) return;

    // Dispatch privacy-respecting event
    if (typeof window !== 'undefined') {
      console.log(`[Privacy Analytics - ${this.analyticsId}] PageView: ${path} ("${title}")`);
    }
  }

  public trackEvent(category: string, action: string, label?: string) {
    if (!this.isConsentGranted()) return;

    if (typeof window !== 'undefined') {
      console.log(`[Privacy Analytics - ${this.analyticsId}] Event: [${category}] ${action} ${label ? `(${label})` : ''}`);
    }
  }
}

export const analytics = PrivacyAnalytics.getInstance();
