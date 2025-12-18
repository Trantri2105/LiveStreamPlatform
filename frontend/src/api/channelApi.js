import axiosClient from "./axiosClient.js";

const channelApi = {
    create(data){
        return axiosClient.post('/channels',data);
    },

    getById(channelId){
        return axiosClient.get(`/public/channels/${channelId}`)
            .catch(error => {
                if(error.status === 404){
                    return null;
                }
                throw error;
            });
    },

    update(data){
        return axiosClient.patch('/channels/self', data);
    },

    setAvatar(file){
        const formData = new FormData();
        formData.append('image', file);
        return axiosClient.put('/channels/self/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    setBackground(file){
        const formData = new FormData();
        formData.append('image', file);
        return axiosClient.put('/channels/self/background', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    search({ searchText = "", limit = 20, offset = 0}){
        return axiosClient.post('/public/channels/search', {
            search_text: searchText,
            limit,
            offset,
        });
    },

    subscribe(channelId){
        return axiosClient.post('/channels/subscription',{
            channel_id: channelId,
            notification_enabled: true,
        })
            .catch(error =>{
                if(error.response && error.response.status >=400){
                    throw new Error('Failed to subscribe to channel.');
                }
            });
    },

    updateSubscription(channelId, notificationEnabled) {
        return axiosClient.patch(`/channels/subscription/${channelId}`, {
            notification_enabled: notificationEnabled,
        }).catch(error => {
            if (error.response && error.response.status >= 400) {
                throw new Error('Failed to update subscription.');
            }
            throw error;
        });
    },

    unsubscribe(channelId) {
        return axiosClient.delete(`/channels/subscription/${channelId}`)
            .catch(error => {
                if (error.response && error.response.status >= 400) {
                    throw new Error('Failed to unsubscribe from channel.');
                }
                throw error;
            });
    },

    checkSubscription(channelId) {
        return axiosClient.get(`/channels/subscription/${channelId}`)
            .catch(error =>{
                if(error.response && error.response.status ===404){
                    return null;
                }
                if(error.response && error.response.status>=400){
                    return null;
                }
                throw error;
            });
    },
    getFollowing() {
        return axiosClient.get('/channels/following')
            .catch(error => {
                if (error.response && error.response.status >= 400) {
                    return [];
                }
                throw error;
            });
    },

    getFollowers() {
        return axiosClient.get('/channels/follower')
            .catch(error => {
                if (error.response && error.response.status >= 400) {
                    return [];
                }
                throw error;
            });
    }
}

export default channelApi;