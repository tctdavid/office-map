import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { useEventHandlers } from "@/hooks/useEventHandlers";
import { supabase } from "@/integrations/supabase/client";
import { restoreMissingEmployeeAssignments } from "@/utils/seatSwapHandlers";

import HeaderBar from "@/components/layout/HeaderBar";
import CanvasArea from "@/components/canvas/CanvasArea";
import RightPanel from "@/components/rightPanel/RightPanel";
import ModalManager from "@/components/modals/ModalManager";
import AdminMigrationPanel from "@/components/AdminMigrationPanel";

const Index = () => {
  const appState = useAppState();
  const { toast } = useToast();

  // 解構狀態
  const {
    auth: { user, currentEmployee, isAdmin, login, logout },
    seats: { seatCoordinates, selectedSeat, isDraggingSeat, seatDragPosition, showSeatPreview, 
      containerMousePosition, isSeatEditMode, selectedSeatTemplate, setSeatCoordinates, 
      setSelectedSeat, setIsDraggingSeat, setSeatDragPosition, setShowSeatPreview, 
      setContainerMousePosition, setIsSeatEditMode, setSelectedSeatTemplate, fetchSeats, 
      deleteSeat: deleteSeatFromHook, updateSeatPosition, handleBasicSeatClick, cancelSeatDrag, 
      toggleSeatEditMode: toggleSeatEditModeFromHook, handleContainerClickForSeat: handleContainerClickForSeatFromHook },
    containers: { containers, selectedContainer, editingContainer, isContainerEditMode, 
      isAddingContainer, newContainerStart, newContainerEnd, showNameDialog, newContainerName, 
      pendingContainer, isDragging, dragHandle, backupContainers, setContainers, setSelectedContainer, 
      setEditingContainer, setIsContainerEditMode, setIsAddingContainer, setNewContainerStart, 
      setNewContainerEnd, setShowNameDialog, setNewContainerName, setPendingContainer, setIsDragging, 
      setBackupContainers, fetchContainers, checkContainerOverlap, handleContainerClick, 
      toggleContainerEditMode, startAddingContainer, handleContainerNameChange, handleMouseDown, 
      handleCanvasMouseDownForContainer, handleCanvasMouseMoveForContainer, 
      handleCanvasMouseUpForContainer, saveContainerChanges, saveNewContainer, 
      cancelNewContainer, cancelContainerChanges, deleteContainer, getRubberBandStyle },
    employees: { employees, selectedSeatEmployee, isManagingEmployees, disabledEmployees, 
      showDisabledEmployeesModal, selectedEmptySeat, setSelectedSeatEmployee, setIsManagingEmployees, 
      setShowDisabledEmployeesModal, setSelectedEmptySeat, fetchEmployees, 
      handleDisableEmployee: handleDisableEmployeeFromHook, 
      handleEnableEmployee: handleEnableEmployeeFromHook, resetEmployeeManagement },
    registration: { isRegistrationModalOpen, registrationModalKey, isSelectingSeatForRegistration, 
      selectedSeatForRegistration, setIsRegistrationModalOpen, setIsSelectingSeatForRegistration, 
      setSelectedSeatForRegistration, startRegistration, startProfileEdit, selectSeatForRegistration, 
      cancelRegistration, completeRegistration, resetRegistration },
    pcManagement: { isAddPcModalOpen, isSelectingSeatForPc, selectedSeatForPc, pcs, 
      setIsAddPcModalOpen, setIsSelectingSeatForPc, setSelectedSeatForPc, setPcs, fetchPcs, 
      startAddPc, selectSeatForPc, cancelAddPc, completeAddPc, resetPcManagement },
    equipment: { equipments, isEquipmentModalOpen, isSelectingSeatForEquipment, 
      selectedSeatForEquipment, selectedEquipment, isViewingEquipment, setIsEquipmentModalOpen, 
      setIsSelectingSeatForEquipment, setSelectedSeatForEquipment, setSelectedEquipment, 
      setIsViewingEquipment, fetchEquipments, startAddEquipment, selectSeatForEquipment, 
      viewEquipment, startEditEquipment, saveEquipmentToSeat, cancelEquipmentOperation, 
      closeEquipmentView, completeAddEquipment, resetEquipmentManagement },
    isLoginModalOpen, setIsLoginModalOpen, isTimeClockModalOpen, setIsTimeClockModalOpen,
    isAdminMigrationPanelOpen, setIsAdminMigrationPanelOpen, isPasswordResetModalOpen, 
    setIsPasswordResetModalOpen, isEditMode, setIsEditMode, backupSeatCoordinates, 
    setBackupSeatCoordinates, isSwappingEmployees, setIsSwappingEmployees, selectedSeatsForSwap, 
    setSelectedSeatsForSwap, showSwapConfirmModal, setShowSwapConfirmModal, canvasSize, 
    setCanvasSize, currentTime, handleCompleteLogout, refreshAllData, resetAllEditStates,
  } = appState;

  // 事件處理器
  const eventHandlers = useEventHandlers({
    login, logout, setSelectedSeatEmployee, fetchEmployees, isAdmin, setSeatCoordinates,
    completeRegistration, selectedSeatForRegistration, setSelectedSeat, completeAddPc,
    fetchSeats, fetchPcs, completeAddEquipment, fetchEquipments, saveEquipmentToSeat
  });

  const toggleEditMode = eventHandlers.createToggleEditMode(
    isEditMode, containers, seatCoordinates, backupContainers, backupSeatCoordinates,
    setIsEditMode, setBackupContainers, setBackupSeatCoordinates, setContainers, 
    setSeatCoordinates, (state) => {
      setIsEditMode(state.isEditMode!);
      setIsContainerEditMode(state.isContainerEditMode!);
      setSelectedContainer(state.selectedContainer);
      setEditingContainer(state.editingContainer);
      setIsAddingContainer(state.isAddingContainer!);
      setIsSeatEditMode(state.isSeatEditMode!);
      setSelectedSeat(state.selectedSeat);
      setIsDraggingSeat(state.isDraggingSeat!);
      setSeatDragPosition({ x: 0, y: 0 });
      setShowSeatPreview(false);
      setBackupContainers([]);
      setBackupSeatCoordinates([]);
    }
  );

  // 初始化
  useEffect(() => {
    const fetchCanvasSize = async () => {
      const { data } = await supabase.from('floor_containers').select('width, height').limit(1);
      if (data?.[0]) setCanvasSize({ width: data[0].width || 1060, height: data[0].height || 850 });
    };
    fetchCanvasSize();
    fetchContainers();
    fetchSeats();
    fetchPcs();
    fetchEquipments();
  }, []);

  // 座位點擊處理
  const handleSeatClick = (e: React.MouseEvent, seat: any) => {
    e.stopPropagation();
    if (isSwappingEmployees) {
      if (selectedSeatsForSwap.find(s => s.id === seat.id)) {
        toast({ title: "座位已選中", description: "請選擇不同的座位", variant: "destructive" });
        return;
      }
      const newSelection = [...selectedSeatsForSwap, seat];
      setSelectedSeatsForSwap(newSelection);
      if (newSelection.length === 1) toast({ title: "已選中第一個座位", description: "請選擇第二個座位進行交換" });
      else if (newSelection.length === 2) setShowSwapConfirmModal(true);
      return;
    }
    if (isManagingEmployees) {
      if (seat.employee?.is_active !== false) handleDisableEmployee(seat.employee.id, seat.id);
      else { setSelectedEmptySeat(seat); setShowDisabledEmployeesModal(true); }
      return;
    }
    if (isSelectingSeatForRegistration) { handleSeatClickForRegistration(seat); return; }
    if (isSelectingSeatForPc) { selectSeatForPc(seat); return; }
    if (isSelectingSeatForEquipment) { selectSeatForEquipment(seat); return; }
    if (isEditMode && selectedContainer && seat.container_id !== selectedContainer.id) {
      toast({ title: "座位不在選中容器中", variant: "destructive" });
      return;
    }
    if (seat.employee) setSelectedSeatEmployee(seat.employee);
    else setSelectedSeatEmployee(null);
    handleBasicSeatClick(seat, isEditMode);
  };

  const handleSeatClickForRegistration = async (seat: any) => {
    if (!seat.is_empty) { toast({ title: "座位已被佔用", variant: "destructive" }); return; }
    const { data, error } = await supabase.from('seat_coordinates').select('is_empty, employee_id').eq('id', seat.id).single();
    if (error || !data.is_empty || data.employee_id) {
      toast({ title: "座位已被佔用", variant: "destructive" });
      return;
    }
    selectSeatForRegistration(seat);
  };

  const handleDisableEmployee = async (employeeId: string, seatId: string) => {
    await handleDisableEmployeeFromHook(employeeId, seatId, isAdmin, fetchSeats);
  };

  const handleEnableEmployee = async (employeeId: string, seatId: string) => {
    await handleEnableEmployeeFromHook(employeeId, seatId, isAdmin, fetchSeats);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <HeaderBar 
        currentTime={currentTime} currentEmployee={currentEmployee} user={user} isAdmin={isAdmin}
        isEditMode={isEditMode} isSelectingSeatForPc={isSelectingSeatForPc}
        isSelectingSeatForEquipment={isSelectingSeatForEquipment} isViewingEquipment={isViewingEquipment}
        isEquipmentModalOpen={isEquipmentModalOpen} isAdminMigrationPanelOpen={isAdminMigrationPanelOpen}
        isManagingEmployees={isManagingEmployees} isSwappingEmployees={isSwappingEmployees}
        toggleEditMode={toggleEditMode} handleAddPcClick={startAddPc} startAddEquipment={startAddEquipment}
        setIsAdminMigrationPanelOpen={setIsAdminMigrationPanelOpen} setIsManagingEmployees={setIsManagingEmployees}
        setShowDisabledEmployeesModal={setShowDisabledEmployeesModal} setSelectedEmptySeat={setSelectedEmptySeat}
        setIsSwappingEmployees={setIsSwappingEmployees} setSelectedSeatsForSwap={setSelectedSeatsForSwap}
        setShowSwapConfirmModal={setShowSwapConfirmModal} setIsPasswordResetModalOpen={setIsPasswordResetModalOpen}
        handleRegistrationClick={() => { startRegistration(); toast({ title: "請選擇座位" }); }}
        handleProfileEditClick={startProfileEdit} setIsLoginModalOpen={setIsLoginModalOpen}
        handleLogout={eventHandlers.handleLogout} setIsTimeClockModalOpen={setIsTimeClockModalOpen}
      />

      {isAdminMigrationPanelOpen && <AdminMigrationPanel onClose={() => setIsAdminMigrationPanelOpen(false)} />}

      <div className="flex w-[1400px] h-[calc(100vh-80px)] gap-2 p-2">
        <CanvasArea 
          canvasSize={canvasSize} containers={containers} selectedContainer={selectedContainer}
          editingContainer={editingContainer} isContainerEditMode={isContainerEditMode}
          isDragging={isDragging} dragHandle={dragHandle} seatCoordinates={seatCoordinates}
          selectedSeat={selectedSeat} selectedSeatsForSwap={selectedSeatsForSwap} isEditMode={isEditMode}
          isDraggingSeat={isDraggingSeat} seatDragPosition={seatDragPosition}
          isAddingContainer={isAddingContainer} newContainerStart={newContainerStart}
          newContainerEnd={newContainerEnd} showSeatPreview={showSeatPreview}
          selectedSeatTemplate={selectedSeatTemplate} containerMousePosition={containerMousePosition}
          handleCanvasMouseDown={async (e) => {
            if (isDraggingSeat && selectedSeat && selectedContainer) {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
              if (mouseX >= selectedContainer.x && mouseX <= selectedContainer.x + selectedContainer.width &&
                  mouseY >= selectedContainer.y && mouseY <= selectedContainer.y + selectedContainer.height) {
                await updateSeatPosition(selectedSeat.id, seatDragPosition.x, seatDragPosition.y);
              }
              setIsDraggingSeat(false); setSeatDragPosition({ x: 0, y: 0 }); return;
            }
            handleCanvasMouseDownForContainer(e, canvasSize);
          }}
          handleCanvasMouseMove={(e) => handleCanvasMouseMoveForContainer(e, canvasSize)}
          handleCanvasMouseUp={handleCanvasMouseUpForContainer}
          handleContainerClick={handleContainerClick} handleMouseDown={handleMouseDown}
          handleContainerClickForSeat={(e, container) => handleContainerClickForSeatFromHook(e, container, selectedContainer, isEditMode)}
          handleSeatClick={handleSeatClick} getRubberBandStyle={getRubberBandStyle}
        />

        <RightPanel 
          selectedSeatEmployee={selectedSeatEmployee} isSelectingSeatForRegistration={isSelectingSeatForRegistration}
          isEditMode={isEditMode} currentEmployee={currentEmployee} selectedSeat={selectedSeat}
          editingContainer={editingContainer} isSeatEditMode={isSeatEditMode} selectedContainer={selectedContainer}
          selectedSeatTemplate={selectedSeatTemplate} setIsSelectingSeatForRegistration={setIsSelectingSeatForRegistration}
          startAddingContainer={startAddingContainer} toggleContainerEditMode={toggleContainerEditMode}
          isContainerEditMode={isContainerEditMode} deleteContainer={deleteContainer}
          toggleSeatEditMode={() => toggleSeatEditModeFromHook(selectedContainer)}
          deleteSeat={deleteSeatFromHook} handleContainerNameChange={handleContainerNameChange}
          saveContainerChanges={saveContainerChanges} cancelContainerChanges={cancelContainerChanges}
          setSelectedSeatTemplate={setSelectedSeatTemplate}
        />
      </div>

      <ModalManager 
        isLoginModalOpen={isLoginModalOpen} setIsLoginModalOpen={setIsLoginModalOpen}
        handleLoginSuccess={eventHandlers.handleLoginSuccess} isRegistrationModalOpen={isRegistrationModalOpen}
        registrationModalKey={registrationModalKey} selectedSeatForRegistration={selectedSeatForRegistration}
        cancelRegistration={cancelRegistration} handleRegistrationSuccess={eventHandlers.handleRegistrationSuccess}
        isAddPcModalOpen={isAddPcModalOpen} selectedSeatForPc={selectedSeatForPc}
        seatCoordinates={seatCoordinates} cancelAddPc={cancelAddPc}
        handleAddPcSuccess={eventHandlers.handleAddPcSuccess} isEquipmentModalOpen={isEquipmentModalOpen}
        selectedSeatForEquipment={selectedSeatForEquipment} isViewingEquipment={isViewingEquipment}
        selectedEquipment={selectedEquipment} cancelEquipmentOperation={cancelEquipmentOperation}
        closeEquipmentView={closeEquipmentView} handleEquipmentSave={eventHandlers.handleEquipmentSave}
        handleEquipmentClick={viewEquipment} handleEquipmentEdit={() => startEditEquipment(seatCoordinates)}
        equipments={equipments} isTimeClockModalOpen={isTimeClockModalOpen}
        setIsTimeClockModalOpen={setIsTimeClockModalOpen} currentEmployee={currentEmployee}
        isPasswordResetModalOpen={isPasswordResetModalOpen} setIsPasswordResetModalOpen={setIsPasswordResetModalOpen}
        showDisabledEmployeesModal={showDisabledEmployeesModal} setShowDisabledEmployeesModal={setShowDisabledEmployeesModal}
        disabledEmployees={disabledEmployees} selectedEmptySeat={selectedEmptySeat}
        handleEnableEmployee={handleEnableEmployee} showSwapConfirmModal={showSwapConfirmModal}
        setShowSwapConfirmModal={setShowSwapConfirmModal} selectedSeatsForSwap={selectedSeatsForSwap}
        handleSwapEmployees={(swapPc) => eventHandlers.handleSwapEmployees(selectedSeatsForSwap, swapPc, fetchSeats, setSelectedSeatsForSwap, setShowSwapConfirmModal, setIsSwappingEmployees)}
        handleSwapPcsOnly={() => eventHandlers.handleSwapPcsOnly(selectedSeatsForSwap, fetchSeats, setSelectedSeatsForSwap, setShowSwapConfirmModal, setIsSwappingEmployees)}
        setSelectedSeatsForSwap={setSelectedSeatsForSwap} showNameDialog={showNameDialog}
        newContainerName={newContainerName} setNewContainerName={setNewContainerName}
        saveNewContainer={saveNewContainer} cancelNewContainer={cancelNewContainer}
      />
    </div>
  );
};

export default Index;
