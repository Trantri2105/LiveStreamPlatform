import chatAxiosClient from "./chatAxiosClient.js";

const chatApi={
    getHistory(streamId){
        return chatAxiosClient.get(`chat-service/api/chat/thread/${streamId}/messages`);
    },

}

export default chatApi;