interface TimeDisplayProps {
  currentTime: Date;
  formatTime: (d: Date) => string;
  formatDate: (d: Date) => string;
}

const TimeDisplay = ({ currentTime, formatTime, formatDate }: TimeDisplayProps) => {
  return (
    <div className="w-30 bg-cyan-900/40 rounded-lg px-4 py-2 text-center">
      <div className="text-lg font-mono">{formatTime(currentTime)}</div>
      <div className="text-xs text-cyan-300">{formatDate(currentTime)}</div>
    </div>
  );
};

export default TimeDisplay;
