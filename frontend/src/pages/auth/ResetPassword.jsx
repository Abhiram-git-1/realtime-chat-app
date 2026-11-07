import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import authService from "../../features/auth/authService";
import { clearCredentials } from "../../features/auth/authSlice";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email) {
      setError("Email is missing.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await authService.resetPassword({
        email,
        newPassword: password,
      });

      dispatch(clearCredentials());
      navigate("/login", {
        replace: true,
        state: {
          message:
            response?.message ||
            "Password reset successfully. Please sign in again.",
        },
      });
    } catch (error) {
      setError(error.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-2xl font-bold">
          Reset Password
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          Create a new password for:
        </p>

        <p className="mt-1 font-medium text-white">
          {email}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="text-sm text-slate-300">
              New Password
            </label>

            <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 pr-20 text-white outline-none focus:border-[#C65D3B]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 translate-y-1 text-sm text-slate-400 hover:text-white"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300">
              Confirm Password
            </label>

            <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 pr-20 text-white outline-none focus:border-[#C65D3B]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="absolute right-3 top-1/2 translate-y-1 text-sm text-slate-400 hover:text-white"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#C65D3B] px-4 py-3 font-semibold hover:bg-[#E58B70] disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-4 w-full text-sm text-slate-500 hover:text-slate-300"
        >
          Back to Login
        </button>
      </section>
    </main>
  );
}

export default ResetPassword;
