interface HeaderTitleProps {
  currentEmployeeName?: string | null;
}

const HeaderTitle = ({ currentEmployeeName }: HeaderTitleProps) => {
  return (
    <div className="flex-1 flex items-center">
      <h1 className="text-2xl font-medium">
        辦公室座位與設備管理系統
      </h1>
      {currentEmployeeName && (
        <span className="text-lg text-cyan-300 ml-4">
          {currentEmployeeName}
        </span>
      )}
    </div>
  );
};

export default HeaderTitle;
