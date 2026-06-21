// api.js
import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api/v1/",
});

let isRefreshing = false;
let failedQueue = [];

// ---------------------------------------------------------------------------
// AbortController реестр — позволяет отменить все незавершённые запросы
// при быстрой навигации. Каждый axios-запрос автоматически получает signal.
// ---------------------------------------------------------------------------
const _pendingControllers = new Set();

/** Создать и зарегистрировать AbortController (для ручного управления). */
export function createAbortController() {
    const ctrl = new AbortController();
    _pendingControllers.add(ctrl);
    return ctrl;
}

/** Отменить все незавершённые запросы (вызывать при unmount / навигации). */
export function abortAllPendingRequests() {
    _pendingControllers.forEach(c => c.abort());
    _pendingControllers.clear();
}

function _unregister(ctrl) {
    _pendingControllers.delete(ctrl);
}

// ---------------------------------------------------------------------------
// Очистка auth-данных при истечении сессии
// ---------------------------------------------------------------------------
const handleAuthExpired = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('auth');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-expired'));
    }
};

// ---------------------------------------------------------------------------
// Request interceptor: токен + AbortController
// ---------------------------------------------------------------------------
api.interceptors.request.use(
    (config) => {
        if (config.url.includes('token/')) {
            return config;
        }

        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Автоматический AbortController: если внешний signal не передан —
        // создаём и привязываем. Запрос отменится при abortAllPendingRequests().
        if (!config.signal) {
            const ctrl = createAbortController();
            config.signal = ctrl.signal;
            config._metaAbortCtrl = ctrl;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ---------------------------------------------------------------------------
// Response interceptor: refresh-токен + cleanup
// ---------------------------------------------------------------------------
api.interceptors.response.use(
    (response) => {
        // Убираем контроллер из реестра после успешного ответа
        _unregister(response.config._metaAbortCtrl);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        _unregister(originalRequest._metaAbortCtrl);

        // Отменённый запрос — тихо пропускаем, не показываем ошибку
        if (axios.isCancel(error)) {
            return Promise.reject(error);
        }

        if (originalRequest.url.includes('token/')) {
            return Promise.reject(error);
        }

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        if (originalRequest.url === 'token/refresh/') {
            handleAuthExpired();
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
            const refreshToken = localStorage.getItem("refreshToken");

            if (!refreshToken) {
                throw new Error(`Refresh token: отсутствует`);
            }

            const response = await axios.post('http://localhost:8000/api/v1/token/refresh/', {
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
            handleAuthExpired();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

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

export default api;
