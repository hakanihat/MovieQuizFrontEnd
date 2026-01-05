// src/api/user.js
import apiClient from "./apiService";

export const getProfile = async () => {
  const response = await apiClient.get("/users/profile");
  return response.data;
};
