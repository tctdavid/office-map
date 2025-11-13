interface SeatTemplateSelectorProps {
  isSeatEditMode: boolean;
  selectedSeatTemplate: string;
  onTemplateChange: (template: string) => void;
}

export default function SeatTemplateSelector({
  isSeatEditMode,
  selectedSeatTemplate,
  onTemplateChange,
}: SeatTemplateSelectorProps) {
  if (!isSeatEditMode) return null;

  const templates = [
    { id: '120x70', label: '120×70' },
    { id: '70x90', label: '70×90' },
    { id: '40x40', label: '40×40' },
  ];

  return (
    <div className="mt-3 space-y-2">
      <h4 className="text-xs font-medium text-cyan-300">座位模板</h4>
      <div className="space-y-1">
        {templates.map((template) => (
          <div key={template.id}>
            <input 
              type="radio" 
              id={`template-${template.id}`}
              name="seatTemplate" 
              value={template.id}
              checked={selectedSeatTemplate === template.id}
              onChange={(e) => onTemplateChange(e.target.value)}
              className="mr-2"
            />
            <label 
              htmlFor={`template-${template.id}`}
              className="text-xs text-gray-300 cursor-pointer"
            >
              {template.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
