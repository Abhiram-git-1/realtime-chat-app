import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../features/auth/authService";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      await authService.forgotPassword({
        email: email.trim().toLowerCase(),
      });

      setMessage("Password reset OTP has been sent to your email.");

      setTimeout(() => {
        navigate(
          `/verify-reset-otp?email=${encodeURIComponent(
            email.trim().toLowerCase(),
          )}`,
        );
      }, 1000);
    } catch (error) {
      setError(error.message || "Failed to send reset OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-2xl font-bold">
          Forgot Password
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          Enter your registered email address. We will send you
          a password reset OTP.
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <label className="text-sm text-slate-300">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-[#C65D3B]"
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
            {loading ? "Sending OTP..." : "Send Reset OTP"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-4 w-full text-sm text-slate-400 hover:text-white"
        >
          Back to Login
        </button>
      </section>
    </main>
  );
}

export default ForgotPassword;
