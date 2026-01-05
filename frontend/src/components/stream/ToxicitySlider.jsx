// import { useState } from "react";
// import { Smile, SmilePlus, Meh, Frown, Angry } from "lucide-react";
//
// const TOXICITY_LEVELS = [
//     { value: 0.2, label: "Very Lenient", subtext: "Chill & Friendly", icon: Smile, color: "text-green-400", bgColor: "bg-green-500/20", borderColor: "border-green-500" },
//     { value: 0.35, label: "Lenient", subtext: "Relaxed", icon: SmilePlus, color: "text-lime-400", bgColor: "bg-lime-500/20", borderColor: "border-lime-500" },
//     { value: 0.5, label: "Moderate", subtext: "Balanced", icon: Meh, color: "text-yellow-400", bgColor: "bg-yellow-500/20", borderColor: "border-yellow-500" },
//     { value: 0.65, label: "Strict", subtext: "Professional", icon: Frown, color: "text-orange-400", bgColor: "bg-orange-500/20", borderColor: "border-orange-500" },
//     { value: 0.8, label: "Very Strict", subtext: "Family Friendly", icon: Angry, color: "text-red-400", bgColor: "bg-red-500/20", borderColor: "border-red-500" },
// ];
//
// const ToxicitySlider = ({ value = 0.5, onChange }) => {
//     const [hoveredLevel, setHoveredLevel] = useState(null);
//
//     // Find current level index
//     const currentLevelIndex = TOXICITY_LEVELS.findIndex(level => level.value === value);
//     const currentLevel = TOXICITY_LEVELS[currentLevelIndex] || TOXICITY_LEVELS[2];
//
//     const handleLevelClick = (levelValue) => {
//         onChange(levelValue);
//     };
//
//     return (
//         <div className="space-y-4">
//             <label className="block text-sm font-medium text-gray-400">
//                 Mức kiểm duyệt chat
//             </label>
//
//             {/* Current Selection Display */}
//             <div className={`p-4 rounded-xl border-2 ${currentLevel.borderColor} ${currentLevel.bgColor} transition-all`}>
//                 <div className="flex items-center gap-3">
//                     <div className={`p-2 rounded-lg bg-gray-900/50 ${currentLevel.color}`}>
//                         <currentLevel.icon size={24} />
//                     </div>
//                     <div className="flex-1">
//                         <div className={`font-bold ${currentLevel.color}`}>{currentLevel.label}</div>
//                         <div className="text-xs text-gray-400">{currentLevel.subtext}</div>
//                     </div>
//                     <div className={`text-2xl font-bold ${currentLevel.color}`}>
//                         {Math.round(value * 100)}%
//                     </div>
//                 </div>
//             </div>
//
//             {/* Emotion Level Selector */}
//             <div className="grid grid-cols-5 gap-2">
//                 {TOXICITY_LEVELS.map((level) => {
//                     const Icon = level.icon;
//                     const isSelected = value === level.value;
//                     const isHovered = hoveredLevel === level.value;
//
//                     return (
//                         <button
//                             key={level.value}
//                             type="button"
//                             onClick={() => handleLevelClick(level.value)}
//                             onMouseEnter={() => setHoveredLevel(level.value)}
//                             onMouseLeave={() => setHoveredLevel(null)}
//                             className={`
//                                 p-3 rounded-xl border-2 transition-all cursor-pointer
//                                 ${isSelected
//                                     ? `${level.borderColor} ${level.bgColor} scale-105`
//                                     : 'border-gray-700 bg-gray-800 hover:bg-gray-750'
//                                 }
//                                 ${isHovered && !isSelected ? 'scale-105' : ''}
//                             `}
//                         >
//                             <div className="flex flex-col items-center gap-2">
//                                 <Icon
//                                     size={28}
//                                     className={`${isSelected || isHovered ? level.color : 'text-gray-500'} transition-colors`}
//                                 />
//                                 <div className={`text-xs font-medium text-center ${isSelected ? level.color : 'text-gray-500'}`}>
//                                     {level.label}
//                                 </div>
//                             </div>
//                         </button>
//                     );
//                 })}
//             </div>
//
//             {/* Visual Slider */}
//             <div className="relative pt-2">
//                 <div className="relative h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-500 opacity-30"></div>
//                 <div className="absolute top-2 left-0 right-0 h-2">
//                     <input
//                         type="range"
//                         min="0"
//                         max="4"
//                         step="1"
//                         value={currentLevelIndex}
//                         onChange={(e) => handleLevelClick(TOXICITY_LEVELS[parseInt(e.target.value)].value)}
//                         className="w-full h-2 appearance-none bg-transparent cursor-pointer
//                             [&::-webkit-slider-thumb]:appearance-none
//                             [&::-webkit-slider-thumb]:w-5
//                             [&::-webkit-slider-thumb]:h-5
//                             [&::-webkit-slider-thumb]:rounded-full
//                             [&::-webkit-slider-thumb]:bg-white
//                             [&::-webkit-slider-thumb]:border-2
//                             [&::-webkit-slider-thumb]:border-violet-500
//                             [&::-webkit-slider-thumb]:cursor-pointer
//                             [&::-webkit-slider-thumb]:shadow-lg
//                             [&::-moz-range-thumb]:w-5
//                             [&::-moz-range-thumb]:h-5
//                             [&::-moz-range-thumb]:rounded-full
//                             [&::-moz-range-thumb]:bg-white
//                             [&::-moz-range-thumb]:border-2
//                             [&::-moz-range-thumb]:border-violet-500
//                             [&::-moz-range-thumb]:cursor-pointer
//                             [&::-moz-range-thumb]:shadow-lg"
//                     />
//                 </div>
//             </div>
//
//             {/* Help Text */}
//             <div className="text-xs text-gray-500 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
//                 <strong className="text-gray-400">💡 Tip:</strong> Level cao hơn sẽ lọc nhiều tin nhắn hơn.
//                 Tuỳ chỉnh mức độ kiểm duyệt dựa vào nội dung stream và tệp khán giả của bạn.
//             </div>
//         </div>
//     );
// };
//
// export default ToxicitySlider;
