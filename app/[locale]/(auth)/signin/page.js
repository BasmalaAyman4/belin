"use client";
import { useReducer, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import authimg from "@/assets/loginbanner.png";
import styles from "@/styles/auth/auth.module.css";
import Image from "next/image";
import SubmitButton from "@/components/ui/SubmitButton";
import { useDictionary } from "@/hooks/useDirection";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

// Lazy load OTP input only when needed
const OtpInput = dynamic(() => import("react-otp-input"), {
  loading: () => <div className={styles.loading}>Loading...</div>,
  ssr: false
});

// Constants
const AUTH_STEPS = {
  PASSWORD_LOGIN: 'password_login',
  OTP_PHONE: 'otp_phone',
  OTP_VERIFY: 'otp_verify',
  COMPLETE_PROFILE: 'complete_profile'
};

const OTP_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 8;
const MIN_PHONE_LENGTH = 11;

// Initial state
const initialState = {
  step: AUTH_STEPS.PASSWORD_LOGIN,
  formData: { mobile: "", password: "" },
  completeData: { firstName: "", lastName: "", address: "", password: "" },
  otp: "",
  userWithOtp: null,
  showPassword: false
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'UPDATE_FORM':
      return {
        ...state,
        formData: { ...state.formData, ...action.payload }
      };
    case 'UPDATE_COMPLETE':
      return {
        ...state,
        completeData: { ...state.completeData, ...action.payload }
      };
    case 'SET_OTP':
      return { ...state, otp: action.payload };
    case 'SET_USER_OTP':
      return { ...state, userWithOtp: action.payload };
    case 'TOGGLE_PASSWORD':
      return { ...state, showPassword: !state.showPassword };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export default function LoginForm() {
  const { dictionary, loading: dictLoading, t, locale } = useDictionary();
  const router = useRouter();
  const [state, dispatch] = useReducer(authReducer, initialState);

  const langCode = useMemo(() => locale === 'en' ? '2' : '1', [locale]);

  const { login, loginOtp, verifyOTP, setPersonalInfo, loading, error, clearError } = useAuth();

  // Memoized validation functions
  const isValidMobile = useCallback((mobile) => {
    return mobile && mobile.length >= MIN_PHONE_LENGTH;
  }, []);

  const isValidPassword = useCallback((password) => {
    return password && password.length >= MIN_PASSWORD_LENGTH;
  }, []);

  const canSubmitPasswordLogin = useMemo(() => {
    return isValidMobile(state.formData.mobile) &&
      isValidPassword(state.formData.password) &&
      !loading;
  }, [state.formData.mobile, state.formData.password, loading, isValidMobile, isValidPassword]);

  const canSubmitOtpRequest = useMemo(() => {
    return isValidMobile(state.formData.mobile) && !loading;
  }, [state.formData.mobile, loading, isValidMobile]);

  const canSubmitOtpVerify = useMemo(() => {
    return state.otp.length === OTP_LENGTH && !loading;
  }, [state.otp, loading]);

  const canSubmitProfile = useMemo(() => {
    const { firstName, lastName, address, password } = state.completeData;
    return firstName.trim() &&
      lastName.trim() &&
      address.trim() &&
      isValidPassword(password) &&
      !loading;
  }, [state.completeData, loading, isValidPassword]);

  // Handlers
  const togglePasswordVisibility = useCallback(() => {
    dispatch({ type: 'TOGGLE_PASSWORD' });
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    dispatch({ type: 'UPDATE_FORM', payload: { [name]: value } });
    clearError();
  }, [clearError]);

  const handleCompleteChange = useCallback((e) => {
    const { name, value } = e.target;
    dispatch({ type: 'UPDATE_COMPLETE', payload: { [name]: value } });
    clearError();
  }, [clearError]);

  const handlePasswordLogin = useCallback(async (e) => {
    e.preventDefault();
    if (!canSubmitPasswordLogin) return;

    const { mobile, password } = state.formData;
    await login(mobile, password, langCode);
  }, [canSubmitPasswordLogin, state.formData, login, langCode]);

  const handleOtpRequest = useCallback(async (e) => {
    e.preventDefault();
    if (!canSubmitOtpRequest) return;

    const result = await loginOtp(state.formData.mobile, langCode);
    if (result.success) {
      dispatch({ type: 'SET_USER_OTP', payload: result.user });
      dispatch({ type: 'SET_STEP', payload: AUTH_STEPS.OTP_VERIFY });
    }
  }, [canSubmitOtpRequest, state.formData.mobile, loginOtp, langCode]);

  const handleOtpVerify = useCallback(async (e) => {
    e.preventDefault();
    if (!canSubmitOtpVerify) return;

    const result = await verifyOTP(state.userWithOtp.userOTP, state.otp, langCode);

    if (result.success) {
      if (state.userWithOtp.verify) {
        await signIn("credentials", {
          redirect: false,
          id: state.userWithOtp.id,
          mobile: state.userWithOtp.mobile,
          token: state.userWithOtp.token,
          firstName: state.userWithOtp.firstName,
          lastName: state.userWithOtp.lastName,
        });
        router.push("/");
      } else {
        dispatch({ type: 'SET_STEP', payload: AUTH_STEPS.COMPLETE_PROFILE });
      }
    }
  }, [canSubmitOtpVerify, state.otp, state.userWithOtp, verifyOTP, langCode, router]);

  const handleCompleteProfile = useCallback(async (e) => {
    e.preventDefault();
    if (!canSubmitProfile) return;

    const result = await setPersonalInfo(state.userWithOtp.id, state.completeData, langCode);
    if (result.success) {
      await signIn("credentials", {
        redirect: false,
        id: state.userWithOtp.id,
        mobile: state.userWithOtp.mobile,
        token: state.userWithOtp.token,
        firstName: state.completeData.firstName,
        lastName: state.completeData.lastName,
      });
      router.push("/");
    }
  }, [canSubmitProfile, state.userWithOtp, state.completeData, setPersonalInfo, langCode, router]);

  const switchToOtpLogin = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: AUTH_STEPS.OTP_PHONE });
    clearError();
  }, [clearError]);

  const switchToPasswordLogin = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: AUTH_STEPS.PASSWORD_LOGIN });
    clearError();
  }, [clearError]);

  return (
    <section className={styles.signup__sec}>
      <div className={styles.signin__body}>
        <div>
          <Image
            alt="Authentication"
            src={authimg}
            className={styles.auth__img}
            priority
          />
        </div>

        <div className={styles.auth__body}>
          <h2 className={styles.signup__title}>
            {t('auth.welcomeBack')}
          </h2>

          {error && (
            <div className={styles.error__message} role="alert">
              {error}
            </div>
          )}

          {state.step === AUTH_STEPS.PASSWORD_LOGIN && (
            <PasswordLoginStep
              formData={state.formData}
              showPassword={state.showPassword}
              loading={loading}
              canSubmit={canSubmitPasswordLogin}
              onInputChange={handleInputChange}
              onTogglePassword={togglePasswordVisibility}
              onSubmit={handlePasswordLogin}
              onSwitchToOtp={switchToOtpLogin}
              t={t}
              styles={styles}
            />
          )}

          {state.step === AUTH_STEPS.OTP_PHONE && (
            <OtpPhoneStep
              mobile={state.formData.mobile}
              loading={loading}
              canSubmit={canSubmitOtpRequest}
              onInputChange={handleInputChange}
              onSubmit={handleOtpRequest}
              onSwitchToPassword={switchToPasswordLogin}
              t={t}
              styles={styles}
            />
          )}

          {state.step === AUTH_STEPS.OTP_VERIFY && (
            <OtpVerifyStep
              otp={state.otp}
              loading={loading}
              canSubmit={canSubmitOtpVerify}
              onOtpChange={(otp) => dispatch({ type: 'SET_OTP', payload: otp })}
              onSubmit={handleOtpVerify}
              t={t}
              styles={styles}
            />
          )}

          {state.step === AUTH_STEPS.COMPLETE_PROFILE && (
            <CompleteProfileStep
              completeData={state.completeData}
              showPassword={state.showPassword}
              loading={loading}
              canSubmit={canSubmitProfile}
              onInputChange={handleCompleteChange}
              onTogglePassword={togglePasswordVisibility}
              onSubmit={handleCompleteProfile}
              t={t}
              styles={styles}
            />
          )}
        </div>
      </div>
    </section>
  );
}

// Extracted step components
function PasswordLoginStep({
  formData, showPassword, loading, canSubmit,
  onInputChange, onTogglePassword, onSubmit, onSwitchToOtp, t, styles
}) {
  return (
    <form onSubmit={onSubmit} className={styles.login__body}>
      <div className={styles.Login__container}>
        <input
          type="tel"
          name="mobile"
          value={formData.mobile}
          onChange={onInputChange}
          placeholder={t('auth.enterPhone') || 'Mobile'}
          className={styles.custom__input}
          required
          disabled={loading}
          autoComplete="tel"
        />
      </div>

      <div className={styles.password__body}>
        <div className={styles.Login__container}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={onInputChange}
            placeholder={t('auth.enterPassword') || "Password"}
            className={styles.custom__input}
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </div>
        <button
          type="button"
          onClick={onTogglePassword}
          className={styles.pass__body}
          disabled={loading}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (t('auth.Hide') || "Hide") : (t('auth.Show') || "Show")}
        </button>
      </div>

      <SubmitButton
        text={t('auth.Getstarted') || 'Login'}
        loading={loading}
        disabled={!canSubmit}
      />

      <div className={styles.try__para} onClick={onSwitchToOtp}>
        <p>{t('auth.tryAnotherWay') || 'Try Another Way?'}</p>
      </div>
    </form>
  );
}

function OtpPhoneStep({
  mobile, loading, canSubmit,
  onInputChange, onSubmit, onSwitchToPassword, t, styles
}) {
  return (
    <form onSubmit={onSubmit} className={styles.login__body}>
      <div className={styles.Login__container}>
        <input
          type="tel"
          name="mobile"
          value={mobile}
          onChange={onInputChange}
          placeholder={t('auth.enterPhone') || 'Mobile'}
          className={styles.custom__input}
          required
          disabled={loading}
          autoComplete="tel"
        />
      </div>
      <SubmitButton
        text={t("auth.SendOTP") || "Send OTP"}
        loading={loading}
        disabled={!canSubmit}
      />

      <div className={styles.try__para} onClick={onSwitchToPassword}>
        <p>{t('auth.backToLogin') || 'Back to Password Login'}</p>
      </div>
    </form>
  );
}

function OtpVerifyStep({
  otp, loading, canSubmit,
  onOtpChange, onSubmit, t, styles
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className={`${styles.otp__body} mb-5`}>
        <OtpInput
          value={otp}
          onChange={onOtpChange}
          numInputs={OTP_LENGTH}
          renderSeparator={""}
          renderInput={(props) => <input {...props} disabled={loading} />}
        />
      </div>
      <SubmitButton
        text={t("auth.Verify Account") || "Verify"}
        loading={loading}
        disabled={!canSubmit}
      />
    </form>
  );
}

function CompleteProfileStep({
  completeData, showPassword, loading, canSubmit,
  onInputChange, onTogglePassword, onSubmit, t, styles
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className={styles.Login__container}>
        <input
          type="text"
          name="firstName"
          value={completeData.firstName}
          onChange={onInputChange}
          placeholder={t('auth.firstName') || "First Name"}
          className={styles.custom__input}
          required
          disabled={loading}
          autoComplete="given-name"
        />
      </div>

      <div className={styles.Login__container}>
        <input
          type="text"
          name="lastName"
          value={completeData.lastName}
          onChange={onInputChange}
          placeholder={t('auth.lastName') || "Last Name"}
          className={styles.custom__input}
          required
          disabled={loading}
          autoComplete="family-name"
        />
      </div>

      <div className={styles.Login__container}>
        <input
          type="text"
          name="address"
          value={completeData.address}
          onChange={onInputChange}
          placeholder={t('auth.address') || "Address"}
          className={styles.custom__input}
          required
          disabled={loading}
          autoComplete="street-address"
        />
      </div>

      <div className={styles.password__body}>
        <div className={styles.Login__container}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={completeData.password}
            onChange={onInputChange}
            placeholder={t('auth.enterPassword') || "Password"}
            className={styles.custom__input}
            required
            disabled={loading}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
          />
        </div>
        <button
          type="button"
          onClick={onTogglePassword}
          className={styles.pass__body}
          disabled={loading}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (t('auth.Hide') || "Hide") : (t('auth.Show') || "Show")}
        </button>
      </div>

      <SubmitButton
        text={t('auth.submit') || "Submit"}
        loading={loading}
        disabled={!canSubmit}
      />
    </form>
  );
}