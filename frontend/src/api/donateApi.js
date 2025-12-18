import axiosClient from "./axiosClient.js";

const donateApi = {
    create(data){
        return axiosClient.post('/donations', data);
    },

    getById(txId){
        return axiosClient.get(`/donations/${txId}`);
    },

    getSent({ fromTime, toTime, limit = 10, offset = 0 }) {
        return axiosClient.post('/donations/donate', { fromTime, toTime, limit, offset })
            .catch(() => []);
    },

    getReceived({ fromTime, toTime, limit = 10, offset = 0 }) {
        return axiosClient.post('/donations/receive', { fromTime, toTime, limit, offset })
            .catch(() => []);
    },

    getReceiveTotal() {
        return axiosClient.get('/wallets/self')
            .catch(() => ({ amount: 0 }));
    },

    getSentStatistics({ fromTime, toTime, groupBy}){
        return axiosClient.post('/donations/statistics',{
            from_time: fromTime,
            to_time: toTime,
            group_by:groupBy
        }).catch(() => []);
    },

    getReceivedStatistics({ fromTime, toTime, groupBy }) {
        return axiosClient.post('/donations/received-statistics', {
            from_time: fromTime,
            to_time: toTime,
            group_by: groupBy
        }).catch(() => []);
    }
}

export default donateApi;