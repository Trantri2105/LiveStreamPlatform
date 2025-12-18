import axiosClient from './axiosClient.js';

const adminApi = {
    getUsers({ limit = 10, offset = 0 } = {}) {
        return axiosClient.get('/users', {
            params: {
                limit,
                offset
            }
        });
    },

    getUserById(userId){
        return axiosClient.get(`/users/${userId}`);
    }
}

export default adminApi;