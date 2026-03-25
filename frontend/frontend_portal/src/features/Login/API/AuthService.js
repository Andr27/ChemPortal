import axios from "axios";
import api from '../../../API/api';

class AuthService {
    static async login(username, password) {
        try {
            const response = await api.post('token/', {
                username,
                password
            });

            if (response.data.access) {
                localStorage.setItem('accessToken', response.data.access);
                localStorage.setItem('refreshToken', response.data.refresh);

                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;

                const userData = await this.fetchAndSaveUserRole();

                localStorage.setItem('auth', 'true');

                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('user-updated'));
                }

                return {
                    ...response.data,
                    userData: userData?.userData || null
                };
            }

            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    static async fetchAndSaveUserRole() {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No token found');
            }

            const response = await api.get('auth/me/');

            let role = 'user';

            if (response.data.role) {
                role = response.data.role;
            } else if (response.data.roles && Array.isArray(response.data.roles)) {
                if (response.data.roles.includes('admin')) {
                    role = 'admin';
                } else if (response.data.roles.includes('moderator')) {
                    role = 'moderator';
                }else if (response.data.roles.includes('creator')) {
                    role = 'creator';
                } else {
                    role = response.data.roles[0] || 'user';
                }
            } else if (response.data.is_moderator) {
                role = 'moderator';
            } else if (response.data.is_admin) {
                role = 'admin';
            } else if (response.data.is_creator) {
                role = 'creator';
            } else if (response.data.user && response.data.user.role) {
                role = response.data.user.role;
            }

            localStorage.setItem('role', role);
            console.log('Role saved to localStorage:', role);

            localStorage.setItem('user', JSON.stringify(response.data));

            return {
                success: true,
                role,
                userData: response.data
            };
        } catch (error) {
            console.error('Failed to fetch user role:', error);

            if (this.getToken()) {
                localStorage.setItem('role', 'user');
            }

            return {
                success: false,
                error: error.message
            };
        }
    }

    static async confirmEmail(token) {
        try {
            const response = await api.post('auth/confirm-email/', {
                token: token
            });
            return response;
        } catch (error) {
            throw error;
        }
    }

    static async refreshPassword(token, new_password) {
        try {
            const response = await api.post('auth/password-reset/confirm/', {
                token: token,
                new_password: new_password
            });

            return response;
        } catch (error) {
            throw error;
        }
    }

    static async FPassword(email) {
        try {
            const response = await api.post('auth/password-reset/', {
                email: email,
            });

            return response;
        } catch (error) {
            throw error;
        }
    }

    static async register(email, password, first_name, last_name) {
        try {
            const response = await api.post('auth/register/', {
                email,
                password,
                first_name,
                last_name,
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Обновление профиля (имя, фамилия, почта, аватар).
     * @param {object|FormData} userData — JSON или FormData (файл в поле `avatar`)
     */
    static async changeUserInformation(userData) {
        const response = await api.put('auth/me/', userData);
        return response;
    }

    static logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('auth');
        localStorage.removeItem('role');
        localStorage.removeItem('user');

        delete axios.defaults.headers.common['Authorization'];
    }

    static async refreshToken() {
        const refreshToken = localStorage.getItem('refreshToken');

        const response = await api.post('token/refresh/', {
            refresh: refreshToken
        });

        if (response.data.access) {
            localStorage.setItem('accessToken', response.data.access);
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        }

        return response.data;
    }

    static getToken() {
        return localStorage.getItem('accessToken');
    }

    static isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    }

    static getUserRole() {
        return localStorage.getItem('role') || 'user';
    }

    static isModerator() {
        const role = this.getUserRole();
        return role === 'moderator' || role === 'admin';
    }
}

export default AuthService;