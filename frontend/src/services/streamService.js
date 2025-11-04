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

    async searchStreams(searchText = '') {
        try {
            const response = await axiosInstance.post(
                API_ENDPOINTS.STREAMS.SEARCH,
                { search_text: searchText }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    async getAllStreams() {
        return this.searchStreams('');
    }
}

export default new StreamService();