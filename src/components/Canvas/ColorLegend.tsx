/**
 * 顏色圖例組件 - 顯示座位狀態對應的顏色說明
 */

const ColorLegend = () => {
  return (
    <div className="bg-slate-800/30 rounded-lg p-3 border border-gray-700 mb-4">
      <div className="flex items-center justify-around text-gray-300 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span className="text-sm">空位</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm">有員工</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm">有電腦</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-sm">有設備</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm">已選中</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">
        請點選座位查看詳細信息 可按拖選進行位置調整
      </p>
    </div>
  );
};

export default ColorLegend;
