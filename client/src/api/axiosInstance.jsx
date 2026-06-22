import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;
if (!baseURL) throw new Error("VITE_API_URL is not set in .env");
export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (error.response?.status === 401 && !request._retry) {
      request._retry = true;
      try {
        const response = await axios.post(
          `${baseURL}/users/refresh-token`,
          {},
          { withCredentials: true },
        );
        const newAccessToken = response.data?.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem("accessToken", newAccessToken);
          request.headers.set("Authorization", `Bearer ${newAccessToken}`);
          return axiosInstance(request);
        }
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
