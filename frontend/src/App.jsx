import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import AppRoutes from "./routes/AppRoutes";
import { initializeAuth, clearCredentials } from "./features/auth/authSlice";
import socketService from "./features/chat/socketService";

function App() {
  const dispatch = useDispatch();

  const { accessToken, initialized, isAuthenticated } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!isAuthenticated || !accessToken) {
      socketService.disconnectSocket();
      return;
    }

    socketService.connectSocket(accessToken);

    return () => {
      socketService.disconnectSocket();
    };
  }, [initialized, isAuthenticated, accessToken]);

  useEffect(() => {
    const handleSessionRevoked = () => {
      dispatch(clearCredentials());
    };

    window.addEventListener("auth:session-revoked", handleSessionRevoked);

    return () => {
      window.removeEventListener("auth:session-revoked", handleSessionRevoked);
    };
  }, [dispatch]);
  return <AppRoutes />;
}

export default App;
