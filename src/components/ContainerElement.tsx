import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ContainerElement = () => {
  const [containers, setContainers] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    try {
      const { data, error } = await supabase
        .from('containers')
        .select('*');
      
      if (error) throw error;
      setContainers(data || []);
    } catch (error) {
      console.error('Error loading containers:', error);
    }
  };

  const createContainer = async () => {
    try {
      const newContainer = {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
        name: `Container ${containers.length + 1}`,
        department: 'General',
        color: '#334155',
        floor: '1F'
      };

      const { data, error } = await supabase
        .from('containers')
        .insert([newContainer])
        .select()
        .single();

      if (error) throw error;

      setContainers([...containers, data]);
      toast({
        title: "容器已創建",
        description: `已成功創建新容器 (${newContainer.width}x${newContainer.height}px)`,
      });
    } catch (error) {
      console.error('Error creating container:', error);
      toast({
        title: "錯誤",
        description: "創建容器時發生錯誤",
        variant: "destructive"
      });
    }
  };

  const updateContainer = async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('containers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setContainers(containers.map(container => 
        container.id === id ? { ...container, ...updates } : container
      ));
    } catch (error) {
      console.error('Error updating container:', error);
    }
  };

  return (
    <div className="w-full h-full bg-slate-800/20 border border-gray-600 rounded-lg relative overflow-hidden">
      {/* Container Area - Only render if there are containers */}
      <div className="absolute inset-0 p-4">
        {containers.length > 0 && containers.map((container) => (
          <div
            key={container.id}
            className="absolute border-2 border-blue-500 bg-blue-500/10 rounded cursor-move"
            style={{
              left: container.x,
              top: container.y,
              width: Math.min(container.width, 1000),
              height: Math.min(container.height, 1000),
              backgroundColor: `${container.color}20`,
              borderColor: container.color
            }}
            onMouseDown={(e) => {
              const startX = e.clientX - container.x;
              const startY = e.clientY - container.y;
              
              const handleMouseMove = (e: MouseEvent) => {
                const newX = Math.max(0, Math.min(1000 - container.width, e.clientX - startX));
                const newY = Math.max(0, Math.min(1000 - container.height, e.clientY - startY));
                updateContainer(container.id, { x: newX, y: newY });
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <div className="absolute top-1 left-1 text-xs text-white bg-black/50 px-1 rounded">
              {container.name}
            </div>
            <div className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1 rounded">
              {container.width}x{container.height}
            </div>
          </div>
        ))}
      </div>

      {/* Add Container Button */}
      <button
        onClick={createContainer}
        className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
      >
        新增容器
      </button>

      {/* Coordinates Display */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
        1000x1000px 工作區域
      </div>
    </div>
  );
};

export default ContainerElement;