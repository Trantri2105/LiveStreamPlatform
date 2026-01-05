const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const API_URL = process.env.API_URL;
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const imageMapping = {
    'League of Legends': 'LOL.jpg',
    'Minecraft': 'Minecraft.jpg',
    'Dota 2': 'Dota 2.jpg',
    'PUBG: Battlegrounds': 'PUBG.jpg',
    'Fortnite': 'Fortnite.jpg',
    'Apex Legends': 'Apex Legends.jpg',
    'Call of Duty: Warzone': 'Warzone.jpg',
};

const loginAndGetToken = async () => {
    console.log(`Đang đăng nhập với email: ${EMAIL}...`);
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = response.data.access_token || response.data.data?.access_token;

        if (!token) {
            console.error("Response data:", response.data);
            throw new Error("Không tìm thấy 'access_token' trong response!");
        }

        console.log("Đăng nhập thành công! Token length:", token.length);
        return token;
    } catch (error) {
        console.error("Đăng nhập thất bại:", error.response?.data || error.message);
        throw error;
    }
};

const fetchCategories = async () => {
    console.log("Đang lấy danh sách Categories...");
    try {
        const response = await axios.post(`${API_URL}/public/categories/search`, {
            limit: 50,
            offset: 0,
            search_text: ""
        });
        const data = response.data.data || response.data;
        const categories = Array.isArray(data) ? data : (data.items || []);
        console.log(`📋 Tìm thấy ${categories.length} categories.`);
        return categories;
    } catch (error) {
        console.error("Lỗi lấy danh sách category:", error.message);
        return [];
    }
}

const uploadImage = async (token, categoryId, categoryName, fileName) => {
    const filePath = path.join(__dirname, 'images', fileName);
    if (!fs.existsSync(filePath)) {
        console.warn(`Không tìm thấy file ảnh: ${fileName} cho category "${categoryName}"`);
        return;
    }

    const form = new FormData();
    form.append('image', fs.createReadStream(filePath));

    try {
        await axios.put(`${API_URL}/categories/${categoryId}/image`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            },
        });
        console.log(`Đã upload ảnh cho: ${categoryName} (ID: ${categoryId})`);
    } catch (error) {
        console.error(`Lỗi upload ${categoryName}:`, error.response?.data || error.message);
    }
};

const runSeeding = async () => {
    console.log("Đang chờ Backend sẵn sàng (10s)...");
    // Chờ backend khởi động xong DB (tăng lên 10s cho chắc chắn)
    await new Promise(resolve => setTimeout(resolve, 30000));
    try {
        const token = await loginAndGetToken();
        const categories = await fetchCategories();
        if (categories.length === 0) {
            console.log("Không có category nào để seed.");
            return;
        }
        for (const cat of categories) {
            const catName = cat.title || cat.name;
            if (imageMapping[catName]) {
                await uploadImage(token, cat.id, catName, imageMapping[catName]);
            }
        }

        console.log("Hoàn tất.");

    } catch (error) {
        console.error("Script gặp lỗi Fatal:", error.message);
    }
};

runSeeding();
