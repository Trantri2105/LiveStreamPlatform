import chatAxiosClient from "./chatAxiosClient.js";

const chatApi={
    getHistory(streamId){
        return chatAxiosClient.get(`/api/chat/thread/${streamId}/messages`);
    },

}

export default chatApi;