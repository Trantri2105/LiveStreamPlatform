import chatAxiosClient from "./chatAxiosClient.js";

const chatApi={
    getHistory(streamId){
        return chatAxiosClient.get(`/thread/${streamId}/messages`);
    },

}

export default chatApi;