import axiosClient from './axiosClient.js';

const categoryApi = {
    search(text){
        return axiosClient.post('/public/categories/search',{ search_text: text })
            .catch(error =>{
                console.error("Category search error:", error);
                return [];
            });
    },

    getList({ searchText = "", limit = 10, offset = 0 } = {}) {
        return axiosClient.post('/public/categories/search', {
            search_text: searchText,
            limit,
            offset
        }).catch(error => {
            console.error("Get category list error:", error);
            return [];
        });
    },

    create(data) {
        return axiosClient.post('/categories', data)
            .catch(error => {
                throw error;
            });
    },

    delete(categoryId) {
        return axiosClient.delete(`/categories/${categoryId}`)
            .catch(error => {
                throw error;
            });
    },

    getById(id){
        return axiosClient.get(`/public/categories/${id}`)
            .catch(error => {
                console.error("Get category by ID error:", error);
                return null;
            });
    },

    setImage(CategoryId, file) {
        const formData = new FormData();
        formData.append('image', file);

        return axiosClient.put(`/categories/${CategoryId}/image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).catch(error => {
            throw error;
        });
    }
};

export default categoryApi;