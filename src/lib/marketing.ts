import { MarketingErrorCode, MarketingErrorContext } from '../types';

/**
 * Central Event Handler for Third-Party Tracking/Ad Errors
 */
export async function handleMarketingError(
  errorCode: MarketingErrorCode,
  options: MarketingErrorContext
) {
  const { componentName, context = {}, onEmailCaptureFallback, onBypassSocialCheck, onCheckoutFallback } = options;
  
  console.error(`[Marketing Error] Code: ${errorCode} in component ${componentName}`, context);
  
  const operationalFallbackRules: Record<string, () => void> = {
    'AD_BLOCKER_DETECTED': () => {
      // If ad fails to load, prompt them politely or switch to email capture instead
      if (onEmailCaptureFallback) {
        onEmailCaptureFallback();
      } else {
        console.warn("No email capture fallback provided for AD_BLOCKER_DETECTED");
      }
    },
    'API_RATE_LIMIT_EXCEEDED': () => {
      // Bypass api check temporarily so the user can still browse beats
      if (onBypassSocialCheck) {
        onBypassSocialCheck();
      } else {
        console.warn("No social bypass provided for API_RATE_LIMIT_EXCEEDED");
      }
    },
    'OAUTH_POPUP_BLOCKED': () => {
      alert("Please disable your popup blocker to link your account and unlock this beat.");
    }
  };

  if (operationalFallbackRules[errorCode]) {
    operationalFallbackRules[errorCode]();
  } else {
    // Universal catch-all fallback
    if (onCheckoutFallback) {
      onCheckoutFallback();
    }
  }

  // Report back to backend logs for developer review
  try {
    await fetch('/api/logs/marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        errorCode, 
        componentName, 
        timestamp: new Date().toISOString(), 
        ...context 
      })
    });
  } catch (err) {
    console.error("Failed to send marketing logs to backend:", err);
  }
}
