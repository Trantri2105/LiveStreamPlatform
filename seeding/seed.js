const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const API_URL = process.env.API_URL;

const imageMapping = {
    'League of Legends': 'LOL.jpg',
    'Minecraft': 'Minecraft.jpg',
    'Dota 2': 'Dota 2.jpg',
    'PUBG: Battlegrounds': 'PUBG.jpg',
    'Fortnite': 'Fortnite.jpg',
    'Apex Legends': 'Apex Legends.jpg',
    'Call of Duty: Warzone': 'Warzone.jpg',
};

const uploadImage = async (categoryId, categoryName, fileName) => {
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
    await new Promise(resolve => setTimeout(resolve, 10000));

    try {
        console.log("Đang lấy danh sách Categories từ API...");
        const response = await axios.get(`${API_URL}/categories?limit=50`);
        const categories = Array.isArray(response.data) ? response.data : (response.data.data || []);

        if (categories.length === 0) {
            console.log("Không tìm thấy Category nào trong DB. Hãy chắc chắn SQL init đã chạy.");
            return;
        }

        console.log(`Tìm thấy ${categories.length} categories. Bắt đầu map ảnh...`);

        // 2. Duyệt qua từng category lấy được từ DB
        for (const cat of categories) {
            const catName = cat.title || cat.name;
            if (imageMapping[catName]) {
                const imageName = imageMapping[catName];
                await uploadImage(cat.id, catName, imageName);
            }
        }

        console.log("Hoàn tất quá trình seeding ảnh.");

    } catch (error) {
        console.error("Lỗi Fatal khi chạy script:", error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error("=> Không thể kết nối tới Backend. Kiểm tra lại tên service và port trong docker-compose.");
        }
    }
};

runSeeding();