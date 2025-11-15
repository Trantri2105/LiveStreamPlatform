import axiosInstance from './api/axios.config';
import {API_ENDPOINTS} from "../config/api.config";

class StreamService{
    async createStream(streamData) {
        try {
            const response = await axiosInstance.post(
                API_ENDPOINTS.STREAMS.CREATE,
                streamData
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async getStreamById(streamId) {
        try {
            const response = await axiosInstance.get(
                API_ENDPOINTS.STREAMS.GET_BY_ID(streamId)
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async getStreamsByChannel(channelId){
        try{
            const response = await axiosInstance.get(
                API_ENDPOINTS.STREAMS.GET_BY_CHANNEL(channelId)
            );
            return response.data || [];
        } catch (error){
            throw error.response?.data || error;
        }
    }

    async searchStreams(params = {}) {
        try {
            const {
                search_text = '',
                status = null,
                limit = 10,
                offset = 0,
            } = params;

            const requestData = {
                search_text,
                limit,
                offset,
            };
            if (status) {
                requestData.status = status;
            }

            const response = await axiosInstance.post(
                API_ENDPOINTS.STREAMS.SEARCH,
                requestData
            );
            return response.data || [];
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async getAllStreams() {
        return this.searchStreams({ search_text: ''});
    }

    // Get live streams only
    async getLiveStreams() {
        return this.searchStreams({ search_text: '', status: 'live'});
    }
}

export default new StreamService();