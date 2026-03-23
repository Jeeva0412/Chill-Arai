import { useState, useEffect, useCallback } from 'react';

interface AppLockOptions {
  onUnlockRequired: () => void;
}

export function useAppLock({ onUnlockRequired }: AppLockOptions) {
  const [isLocked, setIsLocked] = useState(false);

  const lock = useCallback(() => {
    setIsLocked(true);
    onUnlockRequired();
  }, [onUnlockRequired]);

  const unlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // App went to background — will lock on return
        sessionStorage.setItem('chill_arai_went_background', 'true');
      } else if (document.visibilityState === 'visible') {
        const wentBackground = sessionStorage.getItem('chill_arai_went_background');
        if (wentBackground) {
          sessionStorage.removeItem('chill_arai_went_background');
          lock();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [lock]);

  return { isLocked, lock, unlock };
}

/** Try WebAuthn biometric authentication */
export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    // Use a simple user presence check (UV not strictly required)
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'preferred',
        rpId: window.location.hostname,
        allowCredentials: [], // Allow any registered credential
      },
    });
    return !!credential;
  } catch (e) {
    console.warn('WebAuthn failed or cancelled:', e);
    return false;
  }
}
