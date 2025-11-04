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
}

export default new ChannelService();