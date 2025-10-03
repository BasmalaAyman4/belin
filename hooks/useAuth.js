// hooks/useAuth.js
"use client";
import { useState, useCallback, useRef, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { LANG_CODES, ERROR_MESSAGES } from '@/config/api.config';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Prevent duplicate requests
  const isRequestInProgressRef = useRef(false);
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      AuthService.cancelAllRequests();
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setErrorMessage = useCallback((message) => {
    setError(message);
  }, []);

  /**
   * Login with password
   */
  const login = useCallback(async (mobile, password, langCode = LANG_CODES.ARABIC) => {
    // Prevent duplicate requests
    if (isRequestInProgressRef.current) {
      return { success: false, error: ERROR_MESSAGES.REQUEST_IN_PROGRESS };
    }

    isRequestInProgressRef.current = true;
    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const response = await AuthService.loginWithPassword(mobile, password, langCode);

      if (response.success && response.user?.data) {
        const userData = response.user.data;

        // Sign in with NextAuth
        const result = await signIn("credentials", {
          redirect: false,
          id: userData.id,
          mobile: userData.lastMobileDigit || mobile,
          token: userData.token,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          address: userData.address || null
        });

        if (result?.error) {
          setError(ERROR_MESSAGES.LOGIN_FAILED);
          return { success: false, error: ERROR_MESSAGES.LOGIN_FAILED };
        }

        if (result?.ok) {
          // Small delay to ensure session is set
          setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const callbackUrl = urlParams.get('callbackUrl');
            const locale = langCode === LANG_CODES.ENGLISH ? 'en' : 'ar';
            const redirectUrl = callbackUrl || `/${locale}`;
            router.push(redirectUrl);
          }, 100);

          return { success: true };
        }
      }

      setError(response.error);
      return { success: false, error: response.error };

    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'تم إلغاء الطلب' };
      }

      const errorMsg = ERROR_MESSAGES.UNEXPECTED_ERROR;
      setError(errorMsg);
      return { success: false, error: errorMsg };

    } finally {
      setLoading(false);
      isRequestInProgressRef.current = false;
      abortControllerRef.current = null;
    }
  }, [router]);

  /**
   * Request OTP for login
   */
  const loginOtp = useCallback(async (mobile, langCode = LANG_CODES.ARABIC) => {
    if (isRequestInProgressRef.current) {
      return { success: false, error: ERROR_MESSAGES.REQUEST_IN_PROGRESS };
    }

    isRequestInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.loginWithOtp(mobile, langCode);

      if (response.success && response.user?.data) {
        return {
          success: true,
          user: response.user.data,
          message: ERROR_MESSAGES.OTP_SENT
        };
      }

      setError(response.error);
      return { success: false, error: response.error };

    } catch (err) {
      const errorMsg = 'حدث خطأ في إرسال كود التحقق';
      setError(errorMsg);
      return { success: false, error: errorMsg };

    } finally {
      setLoading(false);
      isRequestInProgressRef.current = false;
    }
  }, []);

  /**
   * Verify OTP (client-side due to API limitations)
   * WARNING: This is insecure. Ideally, OTP verification should be done server-side.
   */
  const verifyOTP = useCallback(async (userOtp, enteredOtp, langCode = LANG_CODES.ARABIC) => {
    if (isRequestInProgressRef.current) {
      return { success: false, error: ERROR_MESSAGES.REQUEST_IN_PROGRESS };
    }

    isRequestInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Client-side verification (API limitation)
      const result = AuthService.verifyOtpClientSide(userOtp, enteredOtp);

      if (result.success) {
        return {
          success: true,
          message: result.message
        };
      }

      setError(result.error);
      return { success: false, error: result.error };

    } catch (err) {
      const errorMsg = ERROR_MESSAGES.OTP_VERIFICATION_FAILED;
      setError(errorMsg);
      return { success: false, error: errorMsg };

    } finally {
      setLoading(false);
      isRequestInProgressRef.current = false;
    }
  }, []);

  /**
   * Complete user profile after OTP verification
   */
  const setPersonalInfo = useCallback(async (id, personalData, langCode = LANG_CODES.ARABIC) => {
    if (isRequestInProgressRef.current) {
      return { success: false, error: ERROR_MESSAGES.REQUEST_IN_PROGRESS };
    }

    isRequestInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.setPersonalInfo(id, personalData, langCode);

      if (response.success) {
        return {
          success: true,
          message: ERROR_MESSAGES.PROFILE_SAVED
        };
      }

      setError(response.error);
      return { success: false, error: response.error };

    } catch (err) {
      const errorMsg = ERROR_MESSAGES.SAVE_FAILED;
      setError(errorMsg);
      return { success: false, error: errorMsg };

    } finally {
      setLoading(false);
      isRequestInProgressRef.current = false;
    }
  }, []);

  /**
   * Cancel ongoing request
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    AuthService.cancelAllRequests();
    setLoading(false);
    isRequestInProgressRef.current = false;
  }, []);

  return {
    loading,
    error,
    clearError,
    setError: setErrorMessage,
    login,
    loginOtp,
    verifyOTP,
    setPersonalInfo,
    cancelRequest
  };
};