import { useEffect, useState, useCallback } from "react";
import { Preferences } from "@capacitor/preferences";
import { supabase } from "@/integrations/supabase/client";

// Keys for secure storage
const SECURE_TOKEN_KEY = "kadig-secure-token";
const SECURE_REFRESH_TOKEN_KEY = "kadig-secure-refresh-token";
const BIOMETRIC_ENABLED_KEY = "kadig-biometric-enabled";
const STAY_LOGGED_IN_KEY = "kadig-stay-logged-in";

// Check if running in Capacitor native environment
const isNative = () => {
  try {
    return typeof (window as any).Capacitor !== 'undefined';
  } catch {
    return false;
  }
};

// Dynamic import for biometric auth (only available in native)
let BiometricAuth: any = null;

const loadBiometricAuth = async () => {
  if (isNative() && !BiometricAuth) {
    try {
      const module = await import("@aparajita/capacitor-biometric-auth");
      BiometricAuth = module.BiometricAuth;
    } catch (error) {
      console.log("Biometric auth not available:", error);
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
        Preferences.get({ key: BIOMETRIC_ENABLED_KEY }),
        Preferences.get({ key: STAY_LOGGED_IN_KEY }),
        Preferences.get({ key: SECURE_TOKEN_KEY }),
      ]);

      const biometricAvailable = await checkBiometricAvailability();

      setState(prev => ({
        ...prev,
        isLoading: false,
        biometricEnabled: biometricEnabledResult.value === "true",
        stayLoggedIn: stayLoggedInResult.value === "true",
        hasStoredSession: !!tokenResult.value,
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
        Preferences.set({ key: SECURE_TOKEN_KEY, value: accessToken }),
        Preferences.set({ key: SECURE_REFRESH_TOKEN_KEY, value: refreshToken }),
        Preferences.set({ key: STAY_LOGGED_IN_KEY, value: "true" }),
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
        Preferences.get({ key: SECURE_TOKEN_KEY }),
        Preferences.get({ key: SECURE_REFRESH_TOKEN_KEY }),
      ]);

      if (tokenResult.value && refreshResult.value) {
        return {
          accessToken: tokenResult.value,
          refreshToken: refreshResult.value,
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
        Preferences.remove({ key: SECURE_TOKEN_KEY }),
        Preferences.remove({ key: SECURE_REFRESH_TOKEN_KEY }),
        Preferences.set({ key: STAY_LOGGED_IN_KEY, value: "false" }),
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
      await Preferences.set({ key: BIOMETRIC_ENABLED_KEY, value: enabled ? "true" : "false" });
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
    const biometricResult = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
    const biometricEnabled = biometricResult.value === "true";

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
