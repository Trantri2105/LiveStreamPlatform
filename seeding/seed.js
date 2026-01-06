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
    'Valorant': 'Valorant.jpg',
    'Rust': 'Rust.jpg',
    'Science & Technology': 'Science & Technology.jpg',
    'Travel & Outdoors': 'Travel & Outdoors.jpg',
    'Esports': 'Esports.jpg',
    'Retro Gaming': 'Retro Gaming.jpg',
    'Charity Streams': 'Charity Streams.jpg',
    'Mobile Legends: Bang Bang': 'Mobile Legends.jpg',
    'Red Dead Redemption 2': 'RDR2.jpg',
    'Overwatch 2': 'Overwatch 2.jpg',
    'Destiny 2': 'Destiny 2.jpg',
    'The Sims 4': 'The Sims 4.jpg',
    'Roblox': 'Roblox.jpg',
    'Education': 'Education.jpg',
    'Among Us': 'Among Us.jpg',
    'Simulation Games': 'Simulation Games.jpg',
    'EA Sports FC 24': 'EA Sports FC 24.jpg',
    'Elden Ring': 'Elden Ring.jpg',
    'Cyberpunk 2077': 'Cyberpunk 2077.jpg',
    'Phasmophobia': 'Phasmophobia.jpg',
    'ASMR': 'ASMR.jpg',
    'Counter-Strike 2': 'CS2.jpg',
    'Genshin Impact': 'Genshin Impact.jpg',
    'Grand Theft Auto V (GTA V)': 'GTA V.jpg',
    'Rocket League': 'Rocket League.jpg',
    'Baldur’s Gate 3': 'Baldur’s Gate 3.jpg',
    'Honkai: Star Rail': 'Honkai Star Rail.jpg',
    'Just Chatting': 'Just Chatting.jpg',
    'Music': 'Music.jpg',
    'Talk Shows & Podcasts': 'Talk Shows & Podcasts.jpg',
    'Art': 'Art.jpg',
    'Fitness & Health': 'Fitness & Health.jpg',
    'IRL (In Real Life)': 'IRL.jpg',
    'Board Games': 'Board Games.jpg',
    'Indie Games': 'Indie Games.jpg',
    'Other': 'Other.jpg',
    'Free Fire': 'Free Fire.jpg',
    'FIFA 24': 'FIFA 24.jpg',
    'ARK: Survival Evolved': 'ARK Survival Evolved.jpg',
    'Dead by Daylight': 'Dead by Daylight.jpg',
    'Cooking': 'Cooking.jpg',
    'Creative Arts': 'Creative Arts.jpg',
    'Virtual Reality (VR)': 'Virtual Reality.jpg',
    'Speedrunning': 'Speedrunning.jpg',
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
