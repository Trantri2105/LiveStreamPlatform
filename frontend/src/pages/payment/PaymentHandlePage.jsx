import {useNavigate, useSearchParams} from "react-router-dom";
import {useEffect, useState} from "react";
import donateApi from "../../api/donateApi.js";
import {formatCurrency} from "../../utils/format.js";
import {CheckCircle, XCircle} from "lucide-react";
import Button from "../../components/common/Button.jsx";

const PaymentHandlePage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [txInfo, setTxInfo] = useState(null);

    const error = searchParams.get('error');
    const txId = searchParams.get('tx_id');

    useEffect(() => {
        const checkStatus = async () => {
            if (error === 'true' || !txId) {
                setStatus('error');
                return;
            }

            try {
                const info = await donateApi.getById(txId);
                setTxInfo(info);
                setStatus('success');
            } catch (err) {
                console.error(err);
                setStatus('error');
            }
        };
        checkStatus();
    }, [error, txId]);

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center shadow-2xl">
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-300">Đang xử lý giao dịch...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                            <CheckCircle size={32}/>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Thanh toán thành công!</h2>
                        <p className="text-gray-400 mb-6">Cảm ơn bạn đã ủng hộ.</p>

                        <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left text-sm space-y-2 border border-gray-700">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Số tiền:</span>
                                <span className="font-bold text-green-400">{formatCurrency(txInfo?.amount || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Lời nhắn:</span>
                                <span className="text-white truncate max-w-[200px]">{txInfo?.donate_message}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Mã giao dịch:</span>
                                <span className="text-gray-500 font-mono text-xs">{txId}...</span>
                            </div>
                        </div>

                        <Button className="w-full" onClick={() => navigate(`/stream/${txInfo?.stream_id}`)}>
                            Quay lại Stream
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <XCircle size={32}/>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Giao dịch thất bại</h2>
                        <p className="text-gray-400 mb-6">Có lỗi xảy ra hoặc bạn đã hủy thanh toán.</p>
                        <Button variant="secondary" className="w-full" onClick={() => navigate('/')}>
                            Về trang chủ
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentHandlePage;


/*
INSERT INTO donate_transactions (
    id,
    channel_id,
    stream_id,
    amount,
    donor_channel_id,
    donate_message,
    status,
    created_at,
    updated_at
)
SELECT
    -- 1. Tạo ID ngẫu nhiên (UUID cast về Text)
    gen_random_uuid()::text,

    -- 2. Channel ID cố định của bạn
     '019b36ae-1ac4-7286-8b60-d8f0b122328d',

    -- 3. Stream ID giả
    'stream-' || floor(random() * 100)::text,

    -- 4. Amount ngẫu nhiên (từ 10000 đến 510000)
    (floor(random() * 50) * 10000 + 10000)::int,

    -- 5. Donor ID giả
    '019b36ae-1ac4-7286-8b60-d8f0b122328d',

    -- 6. Message ngẫu nhiên
    'Test donation message ' || md5(random()::text),

    -- 7. Status: Random (90% tỉ lệ ra SUCCESS, 10% ra FAILED hoặc PENDING)
    CASE
        WHEN random() < 0.9 THEN 'success'
        ELSE 'failed'
    END,

    -- 8. Thời gian: Chạy ngược từ 3 tháng trước đến hiện tại, mỗi bước 5 giờ
    time_series,
    time_series
FROM generate_series(
    NOW() - INTERVAL '3 months',  -- Bắt đầu từ 3 tháng trước
    NOW(),                        -- Đến hiện tại
    INTERVAL '5 hours'            -- Cách nhau 5 tiếng
) as time_series;
 */