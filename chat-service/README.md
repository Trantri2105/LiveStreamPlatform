### Usage

1. Streamer/Viewer lấy token JWT sau khi đăng nhập
2. Streamer bắt đầu một luồng stream, trong quá trình này đồng thời gửi một API sang chat-service để lấy url websocket.

```bash
POST /api/chat/thread
Authorization: Bearer <streamer-jwt>
Content-Type: application/json

{
  "stream_id": "string", // ID của luồng stream
}
```

và nhận response:

```json
{
  "ws_url": "ws://{chat_server_addr}/ws/chat/{stream_id}" // URL websocket để kết nối chat
}
```

Phía chat service cũng lưu kết quả luồng chat này vào PostgreSQL để phục vụ việc truy xuất sau này.

3. Streamer sau khi nhận được URL websocket, tạo một bản ghi

```json
{
  "id": "stream_001",
  "title": "Let's Talk About Go",
  "hls_url": "https://cdn.abc.com/hls/stream_001.m3u8",
  "srt_server_url": "srt://srt.abc.com/live/stream_001",
  "live_chat_url": "ws://{chat_server_addr}/ws/chat/{stream_id}", // ở đây stream_id = stream_001
  "channel": { "id": "chan_001", "title": "StreamerA Channel" },
  "category": { "id": "cat_tech", "title": "Tech" }
}
```

4. Frontend mở WebSocket đến Chat service

Frontend nhận dữ liệu stream từ API (ví dụ `GET /api/streams/stream_001`) và hiển thị:

- video → dùng `HlsURL`

- chat → dùng `LiveChatURL`

```javascript
const token = getUserJWT(); // ví dụ lấy token JWT của user hiện tại
const chatURL = `ws://{chat_server_addr}/ws/chat/{stream_id}?token=${token}`;
const ws = new WebSocket(chatURL);

ws.onmessage = (event) => {
  console.log("Chat:", JSON.parse(event.data));
};

ws.onopen = () => {
  ws.send(JSON.stringify({ content: "Hello everyone!" }));
};
```

5. Chat service xử lý (JWT + thread)

- Nhận kết nối WS tại `/ws/chat/{stream_id}` → Lấy {stream_id} từ URL.
- Xác minh JWT `(uid, uname, role)` → xác định người dùng thật.
- Tìm `ChatThread` tương ứng với stream_id:

```sql
SELECT * FROM chat_threads WHERE stream_id = 'stream_001' AND active = true;
```

- Nếu tồn tại → tạo `Client`, đăng ký vào `ThreadHub`.

- Gửi lịch sử tin nhắn (nếu có) → broadcast khi người dùng gửi mới.

6. Phân biệt quyền streamer / viewer (Planning)

- JWT có thể có claim `"role": "streamer"` hoặc `"role": "viewer"`.

  - Streamer có thể gọi API `closeThread` để tắt chat.
  - Viewer chỉ được gửi tin nhắn, không thể đóng thread.

- Khi streamer dừng stream, gọi sang Chat service:

```bash
POST /api/chat/thread/{streamId}/close
Authorization: Bearer <streamer-jwt>
```
