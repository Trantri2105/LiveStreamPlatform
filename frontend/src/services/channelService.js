import axiosInstance from "./api/axios.config";
import {API_ENDPOINTS} from "../config/api.config";

class ChannelService{
    async createChannel(channelData){
        try{
            const response = await axiosInstance.post(
                API_ENDPOINTS.CHANNELS.CREATE,
                channelData
            );
            return response.data;
        } catch (error){
            throw error.response?.data || error
        }
    }

    async updateChannel(channelData){
        try{
            const response = await axiosInstance.patch(
                API_ENDPOINTS.CHANNELS.UPDATE,
                channelData
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async getChannelById(channelId) {
        try {
            const response = await axiosInstance.get(
                API_ENDPOINTS.CHANNELS.GET_BY_ID(channelId)
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async searchChannels(params = {}) {
        try {
            const {
                search_text = '',
                limit = 10,
                offset = 0,
            } = params;

            const response = await axiosInstance.post(
                API_ENDPOINTS.CHANNELS.SEARCH,
                {
                        search_text,
                        limit,
                        offset,
                    }
            );
            return response.data || [];
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async getAllChannels() {
        return this.searchChannels({ search_text: ''});
    }

    async setChannelAvatar(imageFile){
        try{
            const formData = new FormData();
            formData.append('image', imageFile);
            const response = await axiosInstance.put(
                API_ENDPOINTS.CHANNELS.SET_AVATAR,
                formData,
                {
                    headers:{
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data;
        } catch (error){
            throw error.response?.data || error
        }
    }

}

export default new ChannelService();