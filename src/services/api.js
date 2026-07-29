import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_APP_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config; 
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling global errors (Auth expired, Rate limiting)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response } = error;

        if (response) {

            // Handle Rate Limiting (429)
            if (response.status === 429) {
                const rateLimitMessage = response.data?.message || 'Too may requests. Please try again later.';

                window.dispatchEvent(
                    new CustomEvent('api-rate-limited', {
                        detail: { message: rateLimitMessage }
                    })
                );
            }

            // Handle Authentication Failure (401)
            if (response.status === 401) {
                // Only clear token and dispatch if it's not a login request failing

                const isAuthRoute = response.config.url.includes('/auth/login') || response.config.url.includes('/auth/register');

                if (!isAuthRoute) {
                    localStorage.removeItem('token');
                    window.dispatchEvent(new CustomEvent('auth-expired'));
                }
            }
        }
        else if (error.request) {
            window.dispatchEvent(
                new CustomEvent('api-network-error', {
                    detail: { message: 'Network connection error. Please check your internet.' },
                })
            );
        }

        return Promise.reject(error);

    }
);

export default api;