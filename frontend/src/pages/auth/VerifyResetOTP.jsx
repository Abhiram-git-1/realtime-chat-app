import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import authService from "../../features/auth/authService";

function VerifyResetOTP() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email) {
      setError("Email is missing.");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      await authService.verifyResetOTP({
        email,
        otp,
      });

      setMessage("OTP verified successfully.");

      setTimeout(() => {
        navigate(
          `/reset-password?email=${encodeURIComponent(email)}`,
        );
      }, 1000);
    } catch (error) {
      setError(error.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError("Email is missing.");
      return;
    }

    try {
      setResending(true);

      await authService.resendResetOTP({
        email,
      });

      setMessage("A new reset OTP has been sent.");
    } catch (error) {
      setError(error.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-2xl font-bold">
          Verify Reset OTP
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          Enter the 6-digit OTP sent to:
        </p>

        <p className="mt-1 font-medium text-white">
          {email}
        </p>

        <form onSubmit={handleVerify} className="mt-6">
          <label className="text-sm text-slate-300">
            Reset OTP
          </label>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, ""))
            }
            placeholder="Enter 6-digit OTP"
            autoComplete="one-time-code"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-center text-xl tracking-[0.4em] text-white outline-none focus:border-[#C65D3B]"
          />

          {error && (
            <p className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}

          {message && (
            <p className="mt-3 text-sm text-green-400">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-[#C65D3B] px-4 py-3 font-semibold hover:bg-[#E58B70] disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="mt-4 w-full text-sm text-[#E58B70] hover:text-[#F5EEE8] disabled:opacity-50"
        >
          {resending ? "Sending..." : "Resend OTP"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-3 w-full text-sm text-slate-500 hover:text-slate-300"
        >
          Back to Login
        </button>
      </section>
    </main>
  );
}

export default VerifyResetOTP;
