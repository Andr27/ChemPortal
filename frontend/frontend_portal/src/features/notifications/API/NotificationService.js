import api from '../../../API/api';

class NotificationService {
    static getList({ limit = 20, offset = 0 } = {}) {
        return api.get('notifications/', { params: { limit, offset } });
    }

    static getUnreadCount() {
        return api.get('notifications/unread_count/');
    }

    static markAllRead() {
        return api.post('notifications/mark_all_read/');
    }

    static markRead(id) {
        return api.post(`notifications/${id}/mark_read/`);
    }
}

export default NotificationService;
