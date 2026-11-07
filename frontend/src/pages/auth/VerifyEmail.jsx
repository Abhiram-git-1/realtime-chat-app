import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import authService from "../../features/auth/authService";
import { clearAuthError } from "../../features/auth/authSlice";

function VerifyEmail() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const emailFromUrl = searchParams.get("email") || "";

  const { loading, error } = useSelector(
    (state) => state.auth,
  );

  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState("");

  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const handleVerify = async (event) => {
    event.preventDefault();

    setMessage("");
    setLocalError("");

    if (!email.trim()) {
      setLocalError("Email is required.");
      return;
    }

    if (!otp.trim()) {
      setLocalError("Verification OTP is required.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await authService.verifyEmail({
        email: email.trim(),
        otp: otp.trim(),
      });

      setMessage(
        response?.message ||
          "Email verified successfully.",
      );

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (requestError) {
      setLocalError(
        requestError?.data?.message ||
          requestError.message ||
          "Email verification failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setMessage("");
    setLocalError("");

    if (!email.trim()) {
      setLocalError("Enter your email first.");
      return;
    }

    setResending(true);

    try {
      const response =
        await authService.resendVerificationOTP({
          email: email.trim(),
        });

      setMessage(
        response?.message ||
          "A new verification OTP has been sent.",
      );
    } catch (requestError) {
      setLocalError(
        requestError?.data?.message ||
          requestError.message ||
          "Unable to resend OTP.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold">
            Verify your email
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Enter the OTP sent to your email address.
          </p>
        </div>

        {(localError || error) && (
          <div className="mb-5 rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {localError || error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        <form
          onSubmit={handleVerify}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="verification-email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Email
            </label>

            <input
              id="verification-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-[#C65D3B] focus:ring-2 focus:ring-[#C65D3B]/20"
              required
            />
          </div>

          <div>
            <label
              htmlFor="verification-otp"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Verification OTP
            </label>

            <input
              id="verification-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(event) =>
                setOtp(
                  event.target.value.replace(/\D/g, ""),
                )
              }
              placeholder="Enter 6-digit OTP"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-center text-lg tracking-[0.4em] outline-none placeholder:text-slate-600 focus:border-[#C65D3B] focus:ring-2 focus:ring-[#C65D3B]/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full rounded-lg bg-[#C65D3B] px-4 py-3 text-sm font-semibold transition hover:bg-[#E58B70] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Verifying..."
              : "Verify email"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="mt-4 w-full rounded-lg border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resending
            ? "Sending..."
            : "Resend verification OTP"}
        </button>

        <div className="mt-6 text-center text-sm">
          <Link
            to="/login"
            className="text-[#E58B70] hover:text-[#F5EEE8]"
          >
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}

export default VerifyEmail;
