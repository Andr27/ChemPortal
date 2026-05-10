// api.js
import axios from "axios";

const api = axios.create({
    baseURL: "http://147.45.219.171/api/v1/",
});

let isRefreshing = false;
let failedQueue = [];

const processedQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error){
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.request.use(
    (config) => {
        if (config.url.includes('token/')) {
            return config;
        }

        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (originalRequest.url.includes('token/')) {
            return Promise.reject(error);
        }

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        if (originalRequest.url === 'token/refresh/') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                throw new Error(`Refresh token: отсутствует`);
            }

            const response = await axios.post('http://147.45.219.171/api/v1/token/refresh/', {
                refresh: refreshToken,
            });

            const { access, refresh } = response.data;

            localStorage.setItem('accessToken', access);
            localStorage.setItem('refreshToken', refresh);


            originalRequest.headers.Authorization = `Bearer ${access}`;

            processedQueue(null, access);
            return api(originalRequest);
        } catch (refreshError) {
            processedQueue(refreshError, null);

            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('auth');
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
