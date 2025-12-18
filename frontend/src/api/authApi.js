import axiosClient from './axiosClient';

const authApi = {
    login(data) {
        return axiosClient.post('/auth/login', data);
    },

    register(data) {
        return axiosClient.post('/auth/register', data);
    },

    verify(){
        return axiosClient.get('/auth/verify');
    },

    refresh(){
        return axiosClient.post('/auth/refresh');
    },

    getMe() {
        return axiosClient.get('/users/me');
    },

    logout() {
        return axiosClient.post('/auth/logout');
    }

};

export default authApi;