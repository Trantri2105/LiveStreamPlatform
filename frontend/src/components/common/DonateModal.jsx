import { useState } from "react";
import { X, Gift } from "lucide-react";
import donateApi from "../../api/donateApi.js";
import Button from "./Button.jsx";
import Input from "./Input.jsx";
import { formatCurrency } from "../../utils/format.js";

const DonateModal = ({ isOpen, onClose, channelId, streamId }) => {
    const [amount, setAmount] = useState(10000);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleDonate = async () => {
        if (amount < 10000) return alert("Số tiền tối thiểu là 10.000 VNĐ");

        setLoading(true);
        try {
            // Gọi API tạo giao dịch
            const res = await donateApi.create({
                channel_id: channelId,
                stream_id: streamId,
                amount: parseInt(amount),
                donate_message: message
            });

            // Nếu thành công, redirect qua cổng thanh toán VNPay
            if (res.payment_url) {
                window.location.href = res.payment_url;
            }
        } catch (error) {
            alert("Lỗi tạo giao dịch: " + error.message);
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-800 shadow-2xl p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Gift className="text-violet-500" /> Ủng hộ Streamer
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Chọn số tiền */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Chọn số tiền (VNĐ)</label>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {[10000, 20000, 50000, 100000, 200000, 500000].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setAmount(val)}
                                    className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                                        amount === val
                                            ? 'bg-violet-600 border-violet-500 text-white'
                                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {val.toLocaleString()}
                                </button>
                            ))}
                        </div>
                        <Input
                            type="number"
                            placeholder="Nhập số tiền khác..."
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                    </div>

                    {/* Lời nhắn */}
                    <Input
                        label="Lời nhắn"
                        textarea
                        placeholder="Gửi lời yêu thương đến streamer..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />

                    {/* Nút thanh toán */}
                    <Button
                        variant="success"
                        className="w-full py-3 text-lg font-bold shadow-lg shadow-green-900/20"
                        onClick={handleDonate}
                        isLoading={loading}
                    >
                        Thanh toán {formatCurrency(amount)}
                    </Button>

                    <p className="text-center text-xs text-gray-500">
                        Thanh toán an toàn qua cổng VNPay
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DonateModal;