import axiosClient from './axiosClient.js';

const userApi = {
    updateProfile(data){
        return axiosClient.patch('/users/me', data);
    },

    changePassword(data){
        return axiosClient.put('/users/me/password', data);
    }
}

export default userApi;