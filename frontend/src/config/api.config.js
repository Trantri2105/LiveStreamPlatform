export const API_BASE_URL = 'http://128.199.90.123:8081';

export const API_ENDPOINTS = {
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        VERIFY: '/auth/verify',
        REFRESH: '/auth/refresh',
    },
    USERS: {
        GET_ME: '/users/me',
        UPDATE_ME: '/users/me',
        CHANGE_PASSWORD: '/users/me/password',
        GET_ALL: '/users',
        GET_BY_ID: (userId) => `/users/${userId}`,
    },
    CHANNELS: {
        CREATE: '/channels',
        UPDATE: '/channels/self',
        GET_BY_ID: (channelId) => `/public/channels/${channelId}`,
    },
    STREAMS: {
        CREATE: '/streams',
        GET_BY_ID: (streamId) => `/public/streams/${streamId}`,
        SEARCH: '/public/streams/search',
    }
};

export const TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

export const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
};

export const STREAM_STATUS = {
    INIT: 'init',
    LIVE: 'live',
    END: 'end',
}