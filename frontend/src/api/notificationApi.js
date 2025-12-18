import axiosClient from './axiosClient';

const notificationApi = {
    // Nhận object params chứa limit và offset (có giá trị mặc định nếu không truyền)
    getNotifications({ limit = 10, offset = 0 } = {}) {
        return axiosClient.get('/notifications', {
            params: {
                limit,
                offset
            }
        }).catch(error => {
            // Nếu lỗi client (4xx), trả về mảng rỗng để không crash UI
            if (error.response && error.response.status >= 400) {
                return [];
            }
            throw error;
        });
    },

    markAsRead(notificationIds) {
        // notificationIds: mảng các chuỗi ID
        return axiosClient.put('/notifications/read', {
            notification_ids: notificationIds
        }).catch(error => {
            if (error.response && error.response.status >= 400) {
                throw new Error('Failed to mark notification as read.');
            }
            throw error;
        });
    }
};

export default notificationApi;