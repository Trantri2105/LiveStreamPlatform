import { useEffect, useRef, useState } from 'react';
import OvenPlayer from 'ovenplayer';
import Hls from 'hls.js';

const OvenPlayerWrapper = ({ streamUrl, poster }) => {
    const playerContainerRef = useRef(null);
    const playerInstanceRef = useRef(null);

    // State quản lý trạng thái
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState("Đang kết nối tới máy chủ...");

    // Cấu hình Retry
    const MAX_ATTEMPTS = 30; // Thử tối đa 30 lần (khoảng 60s)
    const RETRY_DELAY_MS = 2000; // Mỗi lần cách nhau 2s

    useEffect(() => {
        let retryTimeout = null;
        let attemptCount = 0;
        let mounted = true;

        // Reset state khi url đổi
        setIsLoading(true);
        setError(null);
        setStatusMessage("Đang kiểm tra tín hiệu...");

        // Hàm dọn dẹp player cũ
        const cleanupPlayer = () => {
            if (playerInstanceRef.current) {
                try {
                    playerInstanceRef.current.remove();
                } catch (e) { console.warn(e); }
                playerInstanceRef.current = null;
            }
        };

        // 1. Hàm khởi tạo Player (Chỉ gọi khi Stream đã sẵn sàng)
        const createPlayer = () => {
            if (!mounted || !playerContainerRef.current) return;

            // Setup Hls core
            if (!window.Hls) { window.Hls = Hls; }

            cleanupPlayer();

            console.log("Stream found! Initializing Player...");
            setStatusMessage("Tín hiệu tốt. Đang tải player...");

            const options = {
                autoStart: true,
                mute: true,
                image: poster,
                sources: [
                    {
                        type: 'hls',
                        file: streamUrl
                    }
                ],
                controls: true,
                expandFullScreenUI: true,
                hlsConfig: {
                    maxBufferLength: 30,
                    maxMaxBufferLength: 60,
                },
            };

            try {
                const player = OvenPlayer.create(playerContainerRef.current, options);
                playerInstanceRef.current = player;

                player.on('ready', () => {
                    if (mounted) {
                        setIsLoading(false);
                        setStatusMessage("");
                    }
                });

                player.on('error', (err) => {
                    console.error('OvenPlayer runtime error:', err);
                    // Nếu đang chạy mà lỗi thì không retry logic này, để player tự xử lý
                });

            } catch (err) {
                console.error('Failed to create player:', err);
                if (mounted) setError("Lỗi khởi tạo trình phát video.");
            }
        };
        const checkStreamReady = async () => {
            if (!streamUrl) return;

            try {
                console.log(`Checking stream... Attempt ${attemptCount + 1}/${MAX_ATTEMPTS}`);

                const response = await fetch(streamUrl, { method: 'HEAD' });

                if (response.ok) {
                    createPlayer();
                } else {
                    throw new Error(`Status ${response.status}`);
                }
                // eslint-disable-next-line no-unused-vars
            } catch (err) {
                if (attemptCount < MAX_ATTEMPTS && mounted) {
                    attemptCount++;
                    setStatusMessage(`Đang đợi tín hiệu livestream... (${attemptCount}/${MAX_ATTEMPTS})`);
                    retryTimeout = setTimeout(checkStreamReady, RETRY_DELAY_MS);
                } else if (mounted) {
                    setIsLoading(false);
                    setError("Livestream chưa bắt đầu hoặc đã kết thúc.");
                    console.error("Stream check failed after max attempts");
                }
            }
        };

        // Bắt đầu quy trình
        cleanupPlayer();
        checkStreamReady();

        // Cleanup khi unmount
        return () => {
            mounted = false;
            if (retryTimeout) clearTimeout(retryTimeout);
            cleanupPlayer();
        };
    }, [streamUrl, poster]);

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group shadow-lg border border-gray-800">
            {/* Player Container */}
            <div id="ovenplayer-container" ref={playerContainerRef} className="w-full h-full"></div>

            {/* Loading / Error Overlay */}
            {(isLoading || error) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-20 text-white">
                    {error ? (
                        <div className="text-center px-4">
                            <div className="text-4xl mb-2">⚠️</div>
                            <h3 className="font-bold text-lg text-red-400">Không thể tải stream</h3>
                            <p className="text-gray-400 text-sm mt-1">{error}</p>
                            {streamUrl && <p className="text-xs text-gray-600 mt-4 font-mono select-all">Server IP: {new URL(streamUrl).hostname}</p>}
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-sm font-medium animate-pulse">{statusMessage}</p>
                            <p className="text-xs text-gray-500 mt-2">Vui lòng bật OBS và bắt đầu stream</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OvenPlayerWrapper;