import { useState, useEffect } from "react";
import WorkLogPanel from "@/components/WorkLogPanel";
import WorkLogViewer from "@/components/WorkLogViewer";
import PcDataDisplay from "@/components/PcDataDisplay";
import AdminMigrationPanel from "@/components/AdminMigrationPanel";
import RightPanel from "@/components/RightPanel";
import Header from "@/components/Header";
import { CanvasArea, ColorLegend } from "@/components/Canvas";
import { ModalManager } from "@/components/Modals";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { useEditMode } from "@/hooks/useEditMode";
import { useCanvasEvents } from "@/hooks/useCanvasEvents";
import { useSeatEvents } from "@/hooks/useSeatEvents";
import { useEmployeeSwap } from "@/hooks/useEmployeeSwap";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { useSuccessHandlers } from "@/hooks/useSuccessHandlers";

const Index = () => {
  const appState = useAppState();
  const { toast } = useToast();
  
  // 解構常用的狀態和方法
  const {
    auth: { user, currentEmployee, isAdmin, login, logout },
    seats: {
      seatCoordinates, selectedSeat, isDraggingSeat, seatDragPosition,
      showSeatPreview, containerMousePosition, isSeatEditMode, selectedSeatTemplate,
      setSeatCoordinates, setSelectedSeat, setIsDraggingSeat, setSeatDragPosition,
      setShowSeatPreview, setContainerMousePosition, setIsSeatEditMode, setSelectedSeatTemplate,
      fetchSeats, deleteSeat: deleteSeatFromHook, updateSeatPosition, handleBasicSeatClick,
      toggleSeatEditMode: toggleSeatEditModeFromHook, handleContainerClickForSeat: handleContainerClickForSeatFromHook,
    },
    containers: {
      containers, selectedContainer, editingContainer, isContainerEditMode, isAddingContainer,
      newContainerStart, newContainerEnd, showNameDialog, newContainerName, pendingContainer,
      isDragging, backupContainers,
      setContainers, setSelectedContainer, setEditingContainer, setIsContainerEditMode,
      setIsAddingContainer, setNewContainerStart, setNewContainerEnd, setShowNameDialog,
      setNewContainerName, setPendingContainer, setIsDragging, setBackupContainers,
      fetchContainers, handleContainerClick, toggleContainerEditMode, startAddingContainer,
      handleContainerNameChange, handleMouseDown, handleCanvasMouseDownForContainer,
      handleCanvasMouseMoveForContainer, handleCanvasMouseUpForContainer,
      saveContainerChanges, saveNewContainer, cancelNewContainer, cancelContainerChanges, deleteContainer,
      getRubberBandStyle,
    },
    employees: {
      employees, selectedSeatEmployee, isManagingEmployees, disabledEmployees,
      showDisabledEmployeesModal, selectedEmptySeat,
      setSelectedSeatEmployee, setIsManagingEmployees, setShowDisabledEmployeesModal, setSelectedEmptySeat,
      fetchEmployees, handleDisableEmployee: handleDisableEmployeeFromHook,
      handleEnableEmployee: handleEnableEmployeeFromHook, resetEmployeeManagement,
    },
    registration: {
      isRegistrationModalOpen, registrationModalKey, isSelectingSeatForRegistration, selectedSeatForRegistration,
      setIsRegistrationModalOpen, setIsSelectingSeatForRegistration, setSelectedSeatForRegistration,
      startRegistration, startProfileEdit, selectSeatForRegistration, completeRegistration, resetRegistration,
    },
    pcManagement: {
      isAddPcModalOpen, isSelectingSeatForPc, selectedSeatForPc, pcs,
      setIsAddPcModalOpen, setIsSelectingSeatForPc, setSelectedSeatForPc,
      fetchPcs, startAddPc, selectSeatForPc, completeAddPc, resetPcManagement,
    },
    equipment: {
      equipments, isEquipmentModalOpen, isSelectingSeatForEquipment, selectedSeatForEquipment,
      selectedEquipment, isViewingEquipment,
      setIsEquipmentModalOpen, setIsSelectingSeatForEquipment, setSelectedSeatForEquipment,
      setSelectedEquipment, setIsViewingEquipment,
      fetchEquipments, startAddEquipment, selectSeatForEquipment, viewEquipment, startEditEquipment,
      saveEquipmentToSeat, cancelEquipmentOperation, closeEquipmentView, completeAddEquipment,
    },
    isLoginModalOpen, setIsLoginModalOpen,
    isTimeClockModalOpen, setIsTimeClockModalOpen,
    isAdminMigrationPanelOpen, setIsAdminMigrationPanelOpen,
    isPasswordResetModalOpen, setIsPasswordResetModalOpen,
    isEditMode, setIsEditMode,
    backupSeatCoordinates, setBackupSeatCoordinates,
    isSwappingEmployees, setIsSwappingEmployees,
    selectedSeatsForSwap, setSelectedSeatsForSwap,
    showSwapConfirmModal, setShowSwapConfirmModal,
    canvasSize, setCanvasSize,
    currentTime,
  } = appState;

  // 時間格式化函數
  const formatHeaderTime = (d: Date) => d.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Taipei' });
  const formatHeaderDate = (d: Date) => d.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', timeZone: 'Asia/Taipei' });

  const fetchSeatCoordinates = async () => {
    await fetchSeats();
  };

  // 編輯模式 Hook
  const { toggleEditMode } = useEditMode({
    containers, seatCoordinates, backupContainers, backupSeatCoordinates, isEditMode,
    setIsEditMode, setContainers, setSeatCoordinates, setBackupContainers, setBackupSeatCoordinates,
    setIsContainerEditMode, setSelectedContainer, setEditingContainer, setIsAddingContainer,
    setIsSeatEditMode, setSelectedSeat, setIsDraggingSeat, setSeatDragPosition, setShowSeatPreview,
  });

  // 畫布事件 Hook
  const { handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp } = useCanvasEvents({
    isDraggingSeat, selectedSeat, selectedContainer, seatDragPosition, canvasSize,
    setIsDraggingSeat, setSeatDragPosition, updateSeatPosition,
    handleCanvasMouseDownForContainer, handleCanvasMouseMoveForContainer, handleCanvasMouseUpForContainer,
  });

  // 認證處理 Hook
  const { handleLoginSuccess, handleLogout } = useAuthHandlers({
    login, logout, setSelectedSeatEmployee, setIsEditMode, setIsContainerEditMode,
    setSelectedContainer, setEditingContainer, setIsDragging, setIsAddingContainer,
    setNewContainerStart, setNewContainerEnd, setShowNameDialog, setPendingContainer,
    setIsSeatEditMode, setSelectedSeat, setIsDraggingSeat, setSeatDragPosition, setShowSeatPreview,
    setBackupContainers, setBackupSeatCoordinates, setIsAdminMigrationPanelOpen,
    setIsSwappingEmployees, setSelectedSeatsForSwap, setShowSwapConfirmModal,
    resetRegistration, resetPcManagement, resetEmployeeManagement,
  });

  // 員工停用/啟用處理
  const handleDisableEmployee = async (employeeId: string, seatId: string) => {
    await handleDisableEmployeeFromHook(employeeId, seatId, isAdmin, fetchSeatCoordinates);
  };

  const handleEnableEmployee = async (employeeId: string, seatId: string) => {
    await handleEnableEmployeeFromHook(employeeId, seatId, isAdmin, fetchSeatCoordinates);
  };

  // 座位事件 Hook
  const { handleSeatClick } = useSeatEvents({
    isSwappingEmployees, isManagingEmployees, isSelectingSeatForRegistration,
    isSelectingSeatForPc, isSelectingSeatForEquipment, isEditMode, selectedContainer,
    selectedSeatsForSwap, setSelectedSeatsForSwap, setShowSwapConfirmModal,
    setSelectedSeatEmployee, setSelectedEmptySeat, setShowDisabledEmployeesModal,
    handleBasicSeatClick, handleDisableEmployee, selectSeatForRegistration,
    selectSeatForPc, selectSeatForEquipment,
  });

  // 員工交換 Hook
  const { handleSwapEmployees, handleSwapPcsOnly, restoreMissingEmployees } = useEmployeeSwap({
    selectedSeatsForSwap, setSelectedSeatsForSwap, setShowSwapConfirmModal,
    setIsSwappingEmployees, fetchSeatCoordinates,
  });

  // 成功回調 Hook
  const { handleRegistrationSuccess, handleAddPcSuccess, handleAddEquipmentSuccess, handleEquipmentSave } = useSuccessHandlers({
    selectedSeatForRegistration, isAdmin, setSeatCoordinates, setSelectedSeat, setSelectedSeatEmployee,
    fetchEmployees, fetchSeatCoordinates, fetchPcs, fetchEquipments,
    completeRegistration, completeAddPc, completeAddEquipment, saveEquipmentToSeat,
  });

  // 初始化數據載入
  useEffect(() => {
    const fetchCanvasSize = async () => {
      const { data, error } = await supabase
        .from('floor_containers')
        .select('width, height')
        .limit(1);
      
      if (error) {
        console.error('Error fetching canvas size:', error);
      } else if (data && data.length > 0) {
        setCanvasSize({ width: data[0].width || 1060, height: data[0].height || 850 });
      }
    };

    fetchCanvasSize();
    fetchContainers();
    fetchSeatCoordinates();
    fetchPcs();
    fetchEquipments();
  }, []);

  // 簡單處理函數
  const handleRegistrationClick = () => {
    startRegistration();
    toast({ title: "請選擇座位", description: "請在平面圖中點選一個空的座位進行註冊" });
  };

  const handleAddPcClick = () => {
    startAddPc();
    toast({ title: "請選擇座位", description: "請點擊要新增電腦的座位，或點擊已有電腦的座位進行修改" });
  };

  const handleEquipmentClick = (equipment: any) => viewEquipment(equipment);
  const handleEquipmentEdit = () => startEditEquipment(seatCoordinates);
  const deleteSeat = async () => await deleteSeatFromHook();
  const toggleSeatEditMode = () => toggleSeatEditModeFromHook(selectedContainer);
  const handleContainerClickForSeat = (e: React.MouseEvent, container: any) => {
    handleContainerClickForSeatFromHook(e, container, selectedContainer, isEditMode);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <Header
        currentTime={currentTime}
        formatTime={formatHeaderTime}
        formatDate={formatHeaderDate}
        currentEmployeeName={currentEmployee?.name}
        user={user}
        isAdmin={isAdmin}
        isEditMode={isEditMode}
        isSelectingSeatForPc={isSelectingSeatForPc}
        isSelectingSeatForEquipment={isSelectingSeatForEquipment}
        isViewingEquipment={isViewingEquipment}
        isEquipmentModalOpen={isEquipmentModalOpen}
        isManagingEmployees={isManagingEmployees}
        isSwappingEmployees={isSwappingEmployees}
        onToggleEditMode={toggleEditMode}
        onAddPcClick={handleAddPcClick}
        onStartAddEquipment={startAddEquipment}
        onToggleManagingEmployees={() => {
          setIsManagingEmployees(!isManagingEmployees);
          if (isManagingEmployees) {
            setShowDisabledEmployeesModal(false);
            setSelectedEmptySeat(null);
          }
        }}
        onToggleSwappingEmployees={() => {
          setIsSwappingEmployees(!isSwappingEmployees);
          if (isSwappingEmployees) {
            setSelectedSeatsForSwap([]);
            setShowSwapConfirmModal(false);
          }
        }}
        onRestoreMissingEmployees={restoreMissingEmployees}
        onOpenPasswordReset={() => setIsPasswordResetModalOpen(true)}
        onProfileEdit={startProfileEdit}
        onOpenTimeClock={() => setIsTimeClockModalOpen(true)}
        onLogout={handleLogout}
        onLogin={() => setIsLoginModalOpen(true)}
        onRegister={handleRegistrationClick}
      />

      {/* Admin Migration Panel */}
      {isAdminMigrationPanelOpen && (
        <div className="w-[1400px] px-6 py-2">
          <AdminMigrationPanel isVisible={true} currentEmployee={currentEmployee} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="w-[1400px] flex px-6 py-6 gap-6">
        {/* Left Panel */}
        <div className="w-[1300px] flex-1">
          <ColorLegend />
          <CanvasArea
            canvasSize={canvasSize}
            isEditMode={isEditMode}
            isAddingContainer={isAddingContainer}
            isDraggingSeat={isDraggingSeat}
            isSeatEditMode={isSeatEditMode}
            selectedContainer={selectedContainer}
            containers={containers}
            editingContainer={editingContainer}
            isContainerEditMode={isContainerEditMode}
            seatCoordinates={seatCoordinates}
            selectedSeat={selectedSeat}
            seatDragPosition={seatDragPosition}
            isSwappingEmployees={isSwappingEmployees}
            selectedSeatsForSwap={selectedSeatsForSwap}
            isSelectingSeatForRegistration={isSelectingSeatForRegistration}
            selectedSeatForRegistration={selectedSeatForRegistration}
            selectedSeatTemplate={selectedSeatTemplate}
            showSeatPreview={showSeatPreview}
            containerMousePosition={containerMousePosition}
            newContainerStart={newContainerStart}
            newContainerEnd={newContainerEnd}
            onCanvasMouseDown={handleCanvasMouseDown}
            onCanvasMouseMove={handleCanvasMouseMove}
            onCanvasMouseUp={handleCanvasMouseUp}
            onContainerClick={handleContainerClick}
            onContainerClickForSeat={handleContainerClickForSeat}
            onMouseDown={handleMouseDown}
            onSeatClick={handleSeatClick}
            onEquipmentClick={handleEquipmentClick}
            getRubberBandStyle={getRubberBandStyle}
            setSeatDragPosition={setSeatDragPosition}
            setContainerMousePosition={setContainerMousePosition}
            setShowSeatPreview={setShowSeatPreview}
          />
        </div>

        {/* Right Panel */}
        <div className="w-[250px] flex flex-col gap-2 h-[calc(100vh-120px)]">
          <div className="flex-[1.8] bg-slate-800/30 rounded-lg border border-gray-700 overflow-hidden">
            <RightPanel
              isSelectingSeatForRegistration={isSelectingSeatForRegistration}
              isEditMode={isEditMode}
              selectedSeatEmployee={selectedSeatEmployee}
              onCancelSelection={() => {
                setIsSelectingSeatForRegistration(false);
                toast({ title: "已取消", description: "已取消座位選擇" });
              }}
              isContainerEditMode={isContainerEditMode}
              isSeatEditMode={isSeatEditMode}
              selectedContainer={selectedContainer}
              selectedSeat={selectedSeat}
              onStartAddingContainer={startAddingContainer}
              onToggleContainerEditMode={toggleContainerEditMode}
              onDeleteContainer={deleteContainer}
              onToggleSeatEditMode={toggleSeatEditMode}
              onDeleteSeat={deleteSeat}
              selectedSeatTemplate={selectedSeatTemplate}
              onTemplateChange={setSelectedSeatTemplate}
              currentUserId={currentEmployee?.id || null}
              pcData={undefined}
            />
          </div>

          {/* PC Data Container */}
          <div className="flex-[1.2] bg-slate-800/30 rounded-lg border border-gray-700 px-2 py-4">
            {selectedSeat?.pc ? (
              <>
                <h3 className="text-sm font-medium text-cyan-300 text-center mb-3">電腦設備</h3>
                <PcDataDisplay pcData={selectedSeat.pc} />
              </>
            ) : isEditMode ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-cyan-300 text-center mb-3">編輯容器</h3>
                {editingContainer && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-400">名稱:</label>
                      <input 
                        type="text" 
                        value={editingContainer.name}
                        placeholder="容器名稱"
                        onChange={(e) => handleContainerNameChange(e.target.value)}
                        className="w-full mt-1 px-2 py-1 bg-slate-600 border border-gray-500 rounded text-xs"
                      />
                    </div>
                    <div className="text-xs text-gray-400">
                      <div>位置: ({Math.round(editingContainer.x)}, {Math.round(editingContainer.y)})</div>
                      <div>大小: {Math.round(editingContainer.width)}×{Math.round(editingContainer.height)}</div>
                    </div>
                    <div className="space-y-1">
                      <button onClick={saveContainerChanges} className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors">保存變更</button>
                      <button onClick={cancelContainerChanges} className="w-full px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs font-medium transition-colors">取消變更</button>
                    </div>
                  </div>
                )}
                {isSeatEditMode && (
                  <div className="mt-3 space-y-2">
                    <h4 className="text-xs font-medium text-cyan-300">座位模板</h4>
                    <div className="space-y-1">
                      {['120x70', '70x90', '40x40'].map(template => (
                        <div key={template}>
                          <input 
                            type="radio" 
                            id={`template-${template}`}
                            name="seatTemplate" 
                            value={template}
                            checked={selectedSeatTemplate === template}
                            onChange={(e) => setSelectedSeatTemplate(e.target.value)}
                            className="mr-2"
                          />
                          <label htmlFor={`template-${template}`} className="text-xs text-gray-300">{template.replace('x', '×')}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 mb-3 border border-gray-600 rounded-lg flex items-center justify-center">
                  <div className="w-8 h-6 border border-gray-600 rounded"></div>
                </div>
                <p className="text-xs text-gray-400 text-center">電腦設備</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Manager */}
      <ModalManager
        isLoginModalOpen={isLoginModalOpen}
        setIsLoginModalOpen={setIsLoginModalOpen}
        onLoginSuccess={handleLoginSuccess}
        isRegistrationModalOpen={isRegistrationModalOpen}
        registrationModalKey={registrationModalKey}
        setIsRegistrationModalOpen={setIsRegistrationModalOpen}
        selectedSeatForRegistration={selectedSeatForRegistration}
        setSelectedSeatForRegistration={setSelectedSeatForRegistration}
        setIsSelectingSeatForRegistration={setIsSelectingSeatForRegistration}
        containers={containers}
        onRegistrationSuccess={handleRegistrationSuccess}
        user={user}
        currentEmployee={currentEmployee}
        isAddPcModalOpen={isAddPcModalOpen}
        setIsAddPcModalOpen={setIsAddPcModalOpen}
        selectedSeatForPc={selectedSeatForPc}
        setSelectedSeatForPc={setSelectedSeatForPc}
        setIsSelectingSeatForPc={setIsSelectingSeatForPc}
        onAddPcSuccess={handleAddPcSuccess}
        isEquipmentModalOpen={isEquipmentModalOpen}
        selectedSeatForEquipment={selectedSeatForEquipment}
        onEquipmentCancel={cancelEquipmentOperation}
        onEquipmentSave={handleEquipmentSave}
        isViewingEquipment={isViewingEquipment}
        selectedEquipment={selectedEquipment}
        onCloseEquipmentView={closeEquipmentView}
        onEquipmentEdit={handleEquipmentEdit}
        isAdmin={isAdmin}
        isTimeClockModalOpen={isTimeClockModalOpen}
        setIsTimeClockModalOpen={setIsTimeClockModalOpen}
        isAdminMigrationPanelOpen={isAdminMigrationPanelOpen}
        showNameDialog={showNameDialog}
        newContainerName={newContainerName}
        setNewContainerName={setNewContainerName}
        onSaveNewContainer={saveNewContainer}
        onCancelNewContainer={cancelNewContainer}
        showDisabledEmployeesModal={showDisabledEmployeesModal}
        setShowDisabledEmployeesModal={setShowDisabledEmployeesModal}
        disabledEmployees={disabledEmployees}
        selectedEmptySeat={selectedEmptySeat}
        onEnableEmployee={handleEnableEmployee}
        showSwapConfirmModal={showSwapConfirmModal}
        setShowSwapConfirmModal={setShowSwapConfirmModal}
        selectedSeatsForSwap={selectedSeatsForSwap}
        setSelectedSeatsForSwap={setSelectedSeatsForSwap}
        onSwapEmployees={handleSwapEmployees}
        onSwapPcsOnly={handleSwapPcsOnly}
        isPasswordResetModalOpen={isPasswordResetModalOpen}
        setIsPasswordResetModalOpen={setIsPasswordResetModalOpen}
      />
    </div>
  );
};

export default Index;
