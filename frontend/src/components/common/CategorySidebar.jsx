import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import categoryApi from "../../api/categoryApi.js";
import { ChevronRight, ChevronLeft, ChevronDown } from "lucide-react";

const CategorySidebar = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const LIMIT = 20; // Load 20 categories at a time

    useEffect(() => {
        fetchCategories(0, true);
    }, []);

    const fetchCategories = async (currentOffset, isInitial = false) => {
        if (isInitial) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        
        try {
            // Use the exact API provided with proper pagination
            const data = await categoryApi.getList({ 
                searchText: "", 
                limit: LIMIT, 
                offset: currentOffset 
            });
            
            if (isInitial) {
                setCategories(data || []);
            } else {
                setCategories(prev => [...prev, ...(data || [])]);
            }
            
            // Check if there are more categories
            setHasMore((data || []).length === LIMIT);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            if (isInitial) {
                setCategories([]);
            }
        } finally {
            if (isInitial) {
                setLoading(false);
            } else {
                setLoadingMore(false);
            }
        }
    };

    const handleLoadMore = () => {
        const newOffset = offset + LIMIT;
        setOffset(newOffset);
        fetchCategories(newOffset, false);
    };

    return (
        <div
            className={`fixed left-0 top-0 h-screen bg-gray-900/95 backdrop-blur-sm border-r border-gray-800 transition-all duration-300 z-50 flex flex-col ${
                isExpanded ? "w-64" : "w-20"
            }`}
        >
            {/* Spacer for header */}
            <div className="h-16 flex-shrink-0"></div>
            {/* Header with Toggle Button */}
            <div className={`p-4 border-b border-gray-800 flex items-center flex-shrink-0 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
                {isExpanded && (
                    <h3 className="text-white font-bold text-sm">Danh mục đề xuất</h3>
                )}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-violet-600 text-gray-300 hover:text-white transition-all shadow-lg"
                    aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
                >
                    {isExpanded ? (
                        <ChevronLeft size={20} />
                    ) : (
                        <ChevronRight size={20} />
                    )}
                </button>
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-4 space-y-3">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className={`bg-gray-800 rounded-lg animate-pulse ${
                                    isExpanded ? "h-16" : "h-12 w-12 mx-auto rounded-full"
                                }`}
                            />
                        ))}
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-4 text-gray-500 text-center text-sm">
                        {isExpanded ? "No categories available" : "No data"}
                    </div>
                ) : (
                    <div className={`p-3 space-y-2 ${!isExpanded && "flex flex-col items-center"}`}>
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                to={`/search?q=${encodeURIComponent(cat.title)}`}
                                className={`group block transition-all ${
                                    isExpanded
                                        ? "p-3 rounded-lg hover:bg-gray-800 border border-transparent hover:border-violet-500"
                                        : "mb-3"
                                }`}
                                title={cat.title}
                            >
                                {isExpanded ? (
                                    // Expanded View - Show full info
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 border-2 border-gray-700 group-hover:border-violet-500 transition-all">
                                            <img
                                                src={
                                                    cat.image_url ||
                                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        cat.title
                                                    )}&background=random&size=100`
                                                }
                                                alt={cat.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src =
                                                        "https://via.placeholder.com/100?text=No+Image";
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-gray-300 font-semibold text-sm truncate group-hover:text-violet-400 transition-colors">
                                                {cat.title}
                                            </h4>
                                        </div>
                                    </div>
                                ) : (
                                    // Collapsed View - Circle only
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700 group-hover:border-violet-500 group-hover:scale-110 transition-all">
                                        <img
                                            src={
                                                cat.image_url ||
                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                    cat.title
                                                )}&background=random&size=100`
                                            }
                                            alt={cat.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src =
                                                    "https://via.placeholder.com/100?text=No+Image";
                                            }}
                                        />
                                    </div>
                                )}
                             </Link>
                        ))}
                        
                        {/* Load More Button */}
                        {hasMore && (
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className={`
                                    w-full py-3 mt-2 rounded-lg border-2 border-dashed border-gray-700 
                                    hover:border-violet-500 hover:bg-violet-500/10 
                                    text-gray-400 hover:text-violet-400 
                                    transition-all flex items-center justify-center gap-2
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${!isExpanded && 'mx-auto w-12 h-12 p-0'}
                                `}
                            >
                                {loadingMore ? (
                                    <div className="animate-spin h-5 w-5 border-2 border-violet-500 border-t-transparent rounded-full"></div>
                                ) : (
                                    <>
                                        <ChevronDown size={20} />
                                        {isExpanded && <span className="text-sm font-medium">Xem thêm</span>}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategorySidebar;
