import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:5000/booking",
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add token interceptor if needed later
// apiClient.interceptors.request.use((config) => {
//   const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export default apiClient;


