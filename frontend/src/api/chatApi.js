import chatAxiosClient from "./chatAxiosClient.js";

const chatApi={
    getHistory(streamId){
        return chatAxiosClient.get(`chat/thread/${streamId}/messages`);
    },

}

export default chatApi;