import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Keys for secure storage
const SECURE_TOKEN_KEY = "kadig-secure-token";
const SECURE_REFRESH_TOKEN_KEY = "kadig-secure-refresh-token";
const BIOMETRIC_ENABLED_KEY = "kadig-biometric-enabled";
const STAY_LOGGED_IN_KEY = "kadig-stay-logged-in";

// Check if running in Capacitor native environment
const isNative = () => {
  try {
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
};

// Safe localStorage fallback for web
const safeStorage = {
  get: async (key: string): Promise<string | null> => {
    if (isNative()) {
      try {
        const { Preferences } = await import("@capacitor/preferences");
        const result = await Preferences.get({ key });
        return result.value;
      } catch (error) {
        console.log("Preferences not available, using localStorage");
      }
    }
    return localStorage.getItem(key);
  },
  set: async (key: string, value: string): Promise<void> => {
    if (isNative()) {
      try {
        const { Preferences } = await import("@capacitor/preferences");
        await Preferences.set({ key, value });
        return;
      } catch (error) {
        console.log("Preferences not available, using localStorage");
      }
    }
    localStorage.setItem(key, value);
  },
  remove: async (key: string): Promise<void> => {
    if (isNative()) {
      try {
        const { Preferences } = await import("@capacitor/preferences");
        await Preferences.remove({ key });
        return;
      } catch (error) {
        console.log("Preferences not available, using localStorage");
      }
    }
    localStorage.removeItem(key);
  },
};

// Dynamic import for biometric auth (only available in native)
let BiometricAuth: any = null;

const loadBiometricAuth = async () => {
  if (!isNative()) return null;
  
  if (!BiometricAuth) {
    try {
      const module = await import("@aparajita/capacitor-biometric-auth");
      BiometricAuth = module.BiometricAuth;
    } catch (error) {
      console.log("Biometric auth not available:", error);
      return null;
    }
  }
  return BiometricAuth;
};

export interface SecureAuthState {
  isLoading: boolean;
  hasStoredSession: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  stayLoggedIn: boolean;
}

export const useSecureAuth = () => {
  const [state, setState] = useState<SecureAuthState>({
    isLoading: true,
    hasStoredSession: false,
    biometricAvailable: false,
    biometricEnabled: false,
    stayLoggedIn: false,
  });

  // Check if biometric is available on device
  const checkBiometricAvailability = useCallback(async () => {
    const auth = await loadBiometricAuth();
    if (!auth) return false;
    
    try {
      const result = await auth.checkBiometry();
      return result.isAvailable;
    } catch {
      return false;
    }
  }, []);

  // Load stored preferences
  const loadPreferences = useCallback(async () => {
    try {
      const [biometricEnabledResult, stayLoggedInResult, tokenResult] = await Promise.all([
        safeStorage.get(BIOMETRIC_ENABLED_KEY),
        safeStorage.get(STAY_LOGGED_IN_KEY),
        safeStorage.get(SECURE_TOKEN_KEY),
      ]);

      const biometricAvailable = await checkBiometricAvailability();

      setState(prev => ({
        ...prev,
        isLoading: false,
        biometricEnabled: biometricEnabledResult === "true",
        stayLoggedIn: stayLoggedInResult === "true",
        hasStoredSession: !!tokenResult,
        biometricAvailable,
      }));
    } catch (error) {
      console.error("Error loading preferences:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [checkBiometricAvailability]);

  // Save session tokens securely
  const saveSession = useCallback(async (accessToken: string, refreshToken: string) => {
    try {
      await Promise.all([
        safeStorage.set(SECURE_TOKEN_KEY, accessToken),
        safeStorage.set(SECURE_REFRESH_TOKEN_KEY, refreshToken),
        safeStorage.set(STAY_LOGGED_IN_KEY, "true"),
      ]);
      setState(prev => ({ ...prev, hasStoredSession: true, stayLoggedIn: true }));
      return true;
    } catch (error) {
      console.error("Error saving session:", error);
      return false;
    }
  }, []);

  // Get stored session tokens
  const getStoredSession = useCallback(async () => {
    try {
      const [tokenResult, refreshResult] = await Promise.all([
        safeStorage.get(SECURE_TOKEN_KEY),
        safeStorage.get(SECURE_REFRESH_TOKEN_KEY),
      ]);

      if (tokenResult && refreshResult) {
        return {
          accessToken: tokenResult,
          refreshToken: refreshResult,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting stored session:", error);
      return null;
    }
  }, []);

  // Clear stored session
  const clearSession = useCallback(async () => {
    try {
      await Promise.all([
        safeStorage.remove(SECURE_TOKEN_KEY),
        safeStorage.remove(SECURE_REFRESH_TOKEN_KEY),
        safeStorage.set(STAY_LOGGED_IN_KEY, "false"),
      ]);
      setState(prev => ({ ...prev, hasStoredSession: false, stayLoggedIn: false }));
      return true;
    } catch (error) {
      console.error("Error clearing session:", error);
      return false;
    }
  }, []);

  // Set biometric preference
  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    try {
      await safeStorage.set(BIOMETRIC_ENABLED_KEY, enabled ? "true" : "false");
      setState(prev => ({ ...prev, biometricEnabled: enabled }));
      
      // Also save to localStorage for SecurityDrawer compatibility
      localStorage.setItem("kadig-biometric-enabled", JSON.stringify(enabled));
      
      return true;
    } catch (error) {
      console.error("Error setting biometric preference:", error);
      return false;
    }
  }, []);

  // Authenticate with biometrics (FaceID/TouchID)
  const authenticateWithBiometric = useCallback(async (): Promise<boolean> => {
    const auth = await loadBiometricAuth();
    if (!auth) {
      // If biometric not available, allow access
      return true;
    }

    try {
      await auth.authenticate({
        reason: "Desbloqueie para acessar o Kadig",
        cancelTitle: "Cancelar",
        allowDeviceCredential: true,
        iosFallbackTitle: "Usar senha",
        androidTitle: "Autenticação biométrica",
        androidSubtitle: "Use sua biometria para acessar",
        androidConfirmationRequired: false,
      });
      return true;
    } catch (error) {
      console.log("Biometric auth failed:", error);
      return false;
    }
  }, []);

  // Restore session from stored tokens
  const restoreSession = useCallback(async (): Promise<boolean> => {
    const stored = await getStoredSession();
    if (!stored) return false;

    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: stored.accessToken,
        refresh_token: stored.refreshToken,
      });

      if (error) {
        console.error("Error restoring session:", error);
        await clearSession();
        return false;
      }

      // Update stored tokens with refreshed ones
      if (data.session) {
        await saveSession(data.session.access_token, data.session.refresh_token);
      }

      return !!data.session;
    } catch (error) {
      console.error("Error restoring session:", error);
      await clearSession();
      return false;
    }
  }, [getStoredSession, saveSession, clearSession]);

  // Auto login flow: check stored session and optionally require biometric
  const attemptAutoLogin = useCallback(async (): Promise<{
    success: boolean;
    requiresBiometric: boolean;
    hasSession: boolean;
  }> => {
    await loadPreferences();

    const stored = await getStoredSession();
    if (!stored) {
      return { success: false, requiresBiometric: false, hasSession: false };
    }

    // Check if biometric is enabled
    const biometricEnabledValue = await safeStorage.get(BIOMETRIC_ENABLED_KEY);
    const biometricEnabled = biometricEnabledValue === "true";

    if (biometricEnabled) {
      return { success: false, requiresBiometric: true, hasSession: true };
    }

    // No biometric required, restore session directly
    const restored = await restoreSession();
    return { success: restored, requiresBiometric: false, hasSession: true };
  }, [loadPreferences, getStoredSession, restoreSession]);

  // Complete biometric flow and restore session
  const completeLoginWithBiometric = useCallback(async (): Promise<boolean> => {
    const authenticated = await authenticateWithBiometric();
    if (!authenticated) return false;

    return await restoreSession();
  }, [authenticateWithBiometric, restoreSession]);

  // Initialize
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    ...state,
    saveSession,
    getStoredSession,
    clearSession,
    setBiometricEnabled,
    authenticateWithBiometric,
    restoreSession,
    attemptAutoLogin,
    completeLoginWithBiometric,
    loadPreferences,
  };
};
