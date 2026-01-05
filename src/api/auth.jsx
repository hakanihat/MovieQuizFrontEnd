// src/api/auth.js
import apiClient from "./apiService";

export const register = async (userData) => {
  const response = await apiClient.post("/users/register", userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await apiClient.post("/auth/login", credentials);
  // Save token locally
  localStorage.setItem("access_token", response.data.access_token);
  return response.data;
};
