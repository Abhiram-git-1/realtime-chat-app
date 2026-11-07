import { apiClient } from "../../api/apiClient";

const login = async ({ email, password }) => {
  return apiClient.post("/auth/login", {
    email,
    password,
  });
};

const register = async ({
  name,
  username,
  email,
  password,
}) => {
  return apiClient.post("/auth/register", {
    name,
    username,
    email,
    password,
  });
};

const getCurrentUser = async () => {
  return apiClient.get("/auth/me");
};

const refreshToken = async () => {
  return apiClient.post("/auth/refresh-token");
};

const logout = async () => {
  return apiClient.post("/auth/logout");
};

const logoutAll = async () => {
  return apiClient.post("/auth/logout-all");
};

const verifyEmail = async (data) => {
  return apiClient.post("/auth/verify-email", data);
};

const resendVerificationOTP = async (data) => {
  return apiClient.post(
    "/auth/resend-verification-otp",
    data,
  );
};

const forgotPassword = async (data) => {
  return apiClient.post("/auth/forgot-password", data);
};

const verifyResetOTP = async (data) => {
  return apiClient.post("/auth/verify-reset-otp", data);
};

const resendResetOTP = async (data) => {
  return apiClient.post(
    "/auth/resend-reset-otp",
    data,
  );
};

const resetPassword = async (data) => {
  return apiClient.post("/auth/reset-password", data);
};

const changePassword = async (data) => {
  return apiClient.post("/auth/change-password", data);
};

const getSessions = async () => {
  return apiClient.get("/auth/sessions");
};

const revokeSession = async (sessionId) => {
  return apiClient.delete(`/auth/sessions/${sessionId}`);
};

const getProfile = async () => {
  return apiClient.get("/profile");
};

const updateProfile = async (profile) => {
  return apiClient.patch("/profile", profile);
};

const authService = {
  login,
  register,
  getCurrentUser,
  refreshToken,
  logout,
  logoutAll,
  verifyEmail,
  resendVerificationOTP,
  forgotPassword,
  verifyResetOTP,
  resendResetOTP,
  resetPassword,
  changePassword,
  getSessions,
  revokeSession,
  getProfile,
  updateProfile,
};

export default authService;
