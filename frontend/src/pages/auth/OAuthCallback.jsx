import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import authService from "../../features/auth/authService";
import { setCredentials } from "../../features/auth/authSlice";

function OAuthCallback() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const completeGoogleLogin = async () => {
      try {
        const { accessToken } = await authService.refreshToken();

        if (!accessToken) {
          throw new Error("Google sign-in did not create a session.");
        }

        localStorage.setItem("accessToken", accessToken);

        const data = await authService.getCurrentUser();

        dispatch(
          setCredentials({
            accessToken,
            user: data.user,
          }),
        );

        navigate("/chat", { replace: true });
      } catch {
        localStorage.removeItem("accessToken");
        navigate("/login", { replace: true });
      }
    };

    completeGoogleLogin();
  }, [dispatch, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-[#C65D3B]" />

        <p className="mt-4 text-sm text-slate-400">
          Completing Google sign-in...
        </p>
      </div>
    </main>
  );
}

export default OAuthCallback;
