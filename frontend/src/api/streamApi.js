import axiosClient from "./axiosClient.js";

const streamApi = {
    create(data) {
        return axiosClient.post('/streams', data);
    },

    getById(streamId) {
        return axiosClient.get(`/public/streams/${streamId}`);
    },

    getByChannel(channelId){
        return axiosClient.get(`/public/streams/channels/${channelId}`)
            .catch(error =>{
                console.error("Error fetching streams by channel:", error);
                return [];
            });
    },

    search({ searchText = "", status = "live", limit =20, offset =0 } = {}) {
        const data = { search_text: searchText, status, limit, offset};
        return axiosClient.post('/public/streams/search', data)
            .catch(error => {
                console.error("Stream search error:", error);
                return [];
            });
    },

    setThumbnail(streamId, file){
        const formData = new FormData();
        formData.append('image', file);
        return axiosClient.put(`/streams/thumbnail/${streamId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

export default streamApi;