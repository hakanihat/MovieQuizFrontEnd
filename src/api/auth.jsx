import apiClient from "./apiService";

export const register = async (userData) => {
  const response = await apiClient.post("/users/register", userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await apiClient.post("/auth/login", credentials);
  localStorage.setItem("token", response.data.access_token);
  // Important: Save user info including ROLE
  localStorage.setItem("user", JSON.stringify(response.data.user));
  return response.data;
};

export const forgotPassword = async (email) => {
  return await apiClient.post("/auth/forgot-password", { email });
};

export const resetPassword = async (token, newPassword) => {
  return await apiClient.post("/auth/reset-password", { token, newPassword });
};