import { axiosInstance } from "./axiosInstance.jsx";

export const register = (username, email, password) => {
  return axiosInstance.post("/users/register", { username, email, password });
};

export const login = (email, password) => {
  return axiosInstance.post("/users/login", { email, password });
};

export const logout = () => {
  return axiosInstance.post("/users/logout", {});
};

export const getMe = () => {
  return axiosInstance.get("/users/me");
};