import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import donateApi from "../../api/donateApi.js";
import channelApi from "../../api/channelApi.js";
import { formatCurrency } from "../../utils/format.js";
import { Wallet, ChevronLeft, ArrowDownLeft, ArrowUpRight, Calendar, ChevronRight, BarChart3, AlertCircle } from "lucide-react";
import Button from "../../components/common/Button.jsx";

const RevenuePage = () => {
    const [tab, setTab] = useState('revenue');
    const [transactions, setTransactions] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [error, setError] = useState("");

    // Filter States
    const today = new Date().toISOString().split('T')[0];
    const lastMonth = new Date(new Date().setDate(new Date().getDate() - 29)).toISOString().split('T')[0];

    const [fromDate, setFromDate] = useState(lastMonth);
    const [toDate, setToDate] = useState(today);

    // Pagination States
    const [offset, setOffset] = useState(0);
    const limit = 5;
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    // Tính toán logic thời gian
    const { chartPeriod, isValidRange, dateDiff } = useMemo(() => {
        const start = new Date(fromDate);
        const end = new Date(toDate);

        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);

        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isValid = diffDays >= 0 && diffDays <= 730;

        let period = 'day';
        if (diffDays > 30) period = 'month';

        return {
            chartPeriod: period,
            isValidRange: isValid,
            dateDiff: diffDays
        };
    }, [fromDate, toDate]);

    // Fetch Total Revenue
    useEffect(() => {
        const fetchTotal = async () => {
            try {
                const res = await donateApi.getReceiveTotal();
                setTotalRevenue(res?.amount || 0);
            } catch (e) { console.error("Error fetching total revenue:", e); }
        };
        fetchTotal();
    }, []);

    // Reset pagination
    useEffect(() => {
        setOffset(0);
        setPage(1);
        setHasMore(true);
        setTransactions([]);
    }, [tab, fromDate, toDate]);

    // Hàm lấp đầy dữ liệu + Format NGẮN GỌN (yy)
    const fillMissingChartData = (stats, startStr, endStr, period) => {
        const filledData = [];
        const current = new Date(startStr);
        const end = new Date(endStr);

        const statsMap = new Map();
        stats.forEach(item => {
            const dateObj = new Date(item.time_period);
            const key = period === 'day'
                ? dateObj.toISOString().split('T')[0]
                : `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            statsMap.set(key, item.total_amount);
        });

        while (current <= end) {
            const year = current.getFullYear();
            const shortYear = String(year).slice(-2);
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const day = String(current.getDate()).padStart(2, '0');

            let keyLookup = '';
            let labelDisplay = '';

            if (period === 'day') {
                keyLookup = `${year}-${month}-${day}`;
                labelDisplay = `${day}/${month}/${shortYear}`;
                current.setDate(current.getDate() + 1);
            } else {
                keyLookup = `${year}-${month}`;
                labelDisplay = `${month}/${shortYear}`;
                current.setMonth(current.getMonth() + 1);
                current.setDate(1);
            }

            filledData.push({
                date: labelDisplay,
                amount: statsMap.get(keyLookup) || 0,
            });
        }
        return filledData;
    };

    // Fetch Data
    useEffect(() => {
        if (!isValidRange) {
            setError("Khoảng thời gian không hợp lệ (Max 2 năm, Từ ngày <= Đến ngày).");
            setChartData([]);
            setTransactions([]);
            setLoading(false);
            return;
        }
        setError("");

        const fetchData = async () => {
            setLoading(true);
            try {
                const params = { fromTime: fromDate, toTime: toDate, limit, offset };
                const statsParams = { fromTime: fromDate, toTime: toDate, groupBy: chartPeriod };

                let rawData = [];
                let stats = [];

                if (tab === 'revenue') {
                    rawData = await donateApi.getReceived(params);
                    stats = await donateApi.getReceivedStatistics(statsParams);
                } else {
                    rawData = await donateApi.getSent(params);
                    stats = await donateApi.getSentStatistics(statsParams);
                }

                const successTransactions = rawData.filter(tx => tx.status === 'success');

                const processedChartData = fillMissingChartData(stats, fromDate, toDate, chartPeriod);
                setChartData(processedChartData);

                const enrichedData = await Promise.all(successTransactions.map(async (tx) => {
                    try {
                        const targetId = tab === 'revenue' ? tx.donor_channel_id : tx.channel_id;
                        if (targetId) {
                            const channelInfo = await channelApi.getById(targetId);
                            return { ...tx, targetName: channelInfo ? channelInfo.title : "Unknown Channel" };
                        }
                        // eslint-disable-next-line no-unused-vars
                    } catch (err) { /* empty */ }
                    return { ...tx, targetName: "Unknown User" };
                }));

                setTransactions(enrichedData);
                if (rawData.length < limit) setHasMore(false);
                else setHasMore(true);

            } catch (e) {
                console.error(e);
                setTransactions([]);
                setChartData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tab, offset, fromDate, toDate, chartPeriod, isValidRange]);

    const handlePrevPage = () => { if (page > 1) { setOffset(prev => Math.max(prev - limit, 0)); setPage(prev => prev - 1); } };
    const handleNextPage = () => { if (hasMore) { setOffset(prev => prev + limit); setPage(prev => prev + 1); } };

    const maxChartAmount = Math.max(...chartData.map(d => d.amount), 1);

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/profile" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                        <ChevronLeft />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Quản lý Tài chính</h1>
                        <p className="text-gray-400 text-sm">Theo dõi thu nhập và lịch sử ủng hộ</p>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Wallet size={24} /></div>
                            <span className="text-xs font-bold bg-gray-800 px-2 py-1 rounded text-gray-400 uppercase">Tổng cộng</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-1">Tổng doanh thu kênh</p>
                        <h2 className="text-3xl font-bold text-white">{formatCurrency(totalRevenue)}</h2>
                    </div>
                </div>

                {/* Tabs & Filters */}
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-800 mb-6 gap-4">
                    <div className="flex gap-4">
                        <button onClick={() => setTab('revenue')} className={`pb-3 px-2 flex items-center gap-2 font-medium text-sm transition-colors relative ${tab === 'revenue' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}>
                            <ArrowDownLeft size={18} /> Doanh thu (Nhận)
                            {tab === 'revenue' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 rounded-t-full"></span>}
                        </button>
                        <button onClick={() => setTab('history')} className={`pb-3 px-2 flex items-center gap-2 font-medium text-sm transition-colors relative ${tab === 'history' ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}>
                            <ArrowUpRight size={18} /> Lịch sử Donate (Gửi)
                            {tab === 'history' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-400 rounded-t-full"></span>}
                        </button>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 px-3 py-1 rounded-md animate-pulse">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                        <div className="flex items-center gap-3 pb-2">
                            <div className={`flex items-center gap-2 bg-gray-900 border ${error ? 'border-red-500/50' : 'border-gray-700'} rounded-lg px-3 py-1.5`}>
                                <Calendar size={16} className="text-gray-400"/>
                                <span className="text-xs text-gray-400">Từ:</span>
                                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-transparent text-white text-sm focus:outline-none w-32"/>
                            </div>
                            <div className={`flex items-center gap-2 bg-gray-900 border ${error ? 'border-red-500/50' : 'border-gray-700'} rounded-lg px-3 py-1.5`}>
                                <span className="text-xs text-gray-400">Đến:</span>
                                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-transparent text-white text-sm focus:outline-none w-32"/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                {!error && chartData.length > 0 && (
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                                <BarChart3 className="text-violet-500"/>
                                Biểu đồ {tab === 'revenue' ? 'thu nhập' : 'chi tiêu'}
                                <span className="text-xs font-normal text-gray-500 ml-2">
                                    (Thống kê theo {chartPeriod === 'day' ? 'ngày' : 'tháng'} - {dateDiff} ngày)
                                </span>
                            </h3>
                        </div>

                        {/* Chart Render */}
                        <div className="w-full h-80 flex items-end gap-0.5 pb-2 relative">
                            {chartData.map((item, index) => {
                                const heightPercent = (item.amount / maxChartAmount) * 100;
                                const hasData = item.amount > 0;

                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                        {/* Tooltip chỉ hiện khi có dữ liệu hoặc hover vào vùng trống vẫn hiện date nếu muốn (ở đây để khi có tiền mới hiện tooltip thì chuẩn hơn) */}
                                        {hasData && (
                                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700 whitespace-nowrap z-20 pointer-events-none shadow-lg font-bold">
                                                {item.date}: {formatCurrency(item.amount)}
                                            </div>
                                        )}

                                        {/* Bar */}
                                        <div
                                            className={`w-full rounded-t-sm transition-all duration-500 hover:opacity-80 cursor-pointer ${tab === 'revenue' ? 'bg-green-500' : 'bg-red-500'}`}
                                            style={{
                                                height: `${heightPercent}%`,
                                                minHeight: hasData ? '4px' : '0px',
                                                opacity: hasData ? 1 : 0
                                            }}
                                        ></div>

                                        {/* X-Axis Label - Ẩn nếu không có tiền */}
                                        <div className="h-4 w-full mt-2 flex justify-center">
                                            <span
                                                className="text-[10px] text-gray-400 text-center tracking-tighter whitespace-nowrap block w-full overflow-hidden"
                                                style={{fontSize: '10px'}}
                                            >
                                                {/* Logic chính: Nếu > 0 mới hiện ngày */}
                                                {hasData ? item.date : ''}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Transactions Table */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Đang tải dữ liệu...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-6 py-4">ID Giao dịch</th>
                                    <th className="px-6 py-4">{tab === 'revenue' ? 'Người gửi' : 'Người nhận'}</th>
                                    <th className="px-6 py-4">Số tiền</th>
                                    <th className="px-6 py-4">Lời nhắn</th>
                                    <th className="px-6 py-4">Thời gian</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {transactions.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Không có giao dịch thành công nào.</td></tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-gray-500 text-xs" title={tx.id}>{tx.id.slice(0, 8)}...</td>
                                            <td className="px-6 py-4 font-medium text-white">
                                                {tx.targetName}
                                            </td>
                                            <td className={`px-6 py-4 font-bold ${tab === 'revenue' ? 'text-green-400' : 'text-red-400'}`}>
                                                {tab === 'revenue' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-300 truncate max-w-xs">{tx.donate_message || "-"}</td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">{new Date(tx.created_at).toLocaleString('vi-VN')}</td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between bg-gray-900 mt-auto">
                        <span className="text-sm text-gray-500">Trang {page}</span>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" className="!px-3 !py-1.5" disabled={page === 1 || loading} onClick={handlePrevPage}><ChevronLeft size={16} /> Trước</Button>
                            <Button variant="secondary" className="!px-3 !py-1.5" disabled={!hasMore || loading} onClick={handleNextPage}>Sau <ChevronRight size={16} /></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenuePage;