@@ -82,86 +82,93 @@ export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [studioInfo, setStudioInfo] = useState<StudioInfo>({
    name: 'Ánh Sáng Studio',
    address: '',
    phone: '',
    directorName: '',
    logoText: 'AS',
    contractTerms: ''
  });
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryItem[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeItem[]>([]);
  const [serviceGroups, setServiceGroups] = useState<ServiceGroupItem[]>([]);
  const [scheduleTypes, setScheduleTypes] = useState<string[]>([
    'Tư vấn',
    'Chụp Pre-wedding',
    'Chụp Phóng sự',
    'Trang điểm',
    'Thử váy',
    'Trả ảnh',
    'Quay phim'
  ]);
  const [departments, setDepartments] = useState<string[]>(['Sales', 'Photo', 'Makeup', 'Retouch']);

  const serviceTypesList = useMemo(() => serviceTypes.map(t => t.name), [serviceTypes]);
  const serviceGroupsList = useMemo(() => serviceGroups.map(g => g.groupName), [serviceGroups]);
  const mobileTabs: TabId[] = ['contracts', 'tasks', 'products', 'quick_expense'];

  const isAdminOrDirector = useMemo(() => {
    return !!currentUser && (currentUser.username === 'admin' || currentUser.role === 'Giám đốc');
  }, [currentUser]);

  const canAccess = (module: string) => {
    if (!currentUser) return false;
    if (isAdminOrDirector) return true;
    const perms = currentUser.permissions?.[module];
    if (!perms) return false;
    return Object.values(perms).some((p: any) => p.view);
  };

  // Dashboard: only Admin & Giám đốc
  const canViewDashboard = () => isAdminOrDirector;

  // Finance module (full view): only Admin & Giám đốc. Staff only uses Quick Expense.
  const canViewFinance = () => isAdminOrDirector;

  // Track mobile/desktop
  useEffect(() => {
    const compute = () => {
      const mobile = window.innerWidth < 1024; // < lg
      setIsMobile(mobile);
      if (!mobile) {
        setDrawerOpen(false);
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  useEffect(() => {
    if (isMobile && !mobileTabs.includes(activeTab)) {
      setActiveTab('quick_expense');
    }
  }, [isMobile, activeTab, mobileTabs]);

  const refreshTasks = async () => {
    const fetchedTasks = await fetchTasks();
    if (fetchedTasks.length > 0) setTasks(fetchedTasks);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchBootstrapData();
      if (data) {
        setContracts(data.contracts);
        setCustomers(data.customers);
        setServices(data.services);
        setStaff(data.staff);
        setTransactions(data.transactions);
        setSchedules(data.schedules);
        setTasks(data.tasks || []);
        if (data.studioInfo) setStudioInfo(data.studioInfo);
        if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
        if (data.serviceTypes) setServiceTypes(data.serviceTypes);
        if (data.serviceGroups) setServiceGroups(data.serviceGroups);
        if (data.scheduleLabels) setScheduleTypes(data.scheduleLabels);
      } else {
        // Fallback to mock data
        setContracts(mockContracts);
@@ -296,147 +303,147 @@ export default function App() {
    if (activeTab === 'finance') return 'Quản lý Tài chính';
    if (activeTab === 'payroll') return 'Bảng lương nhân sự';
    if (activeTab === 'staff') return 'Danh sách nhân viên';
    if (activeTab === 'products') return 'Danh mục Dịch vụ';
    if (activeTab === 'settings') return 'Cấu hình hệ thống';
    return '';
  })();

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/30">
            {studioInfo.logoImage ? (
              <img src={studioInfo.logoImage} className="w-8 h-8 object-contain" alt="Logo" />
            ) : (
              studioInfo.logoText
            )}
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight uppercase">Ánh Sáng</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Studio Manager</p>
          </div>
        </div>

          <div className="space-y-1">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-4">
              Menu chính
            </div>

            <SidebarItem
              icon={LayoutDashboard}
              label="Tổng quan"
              id="dashboard"
              activeTab={activeTab}
              setActiveTab={setTab}
              visible={!isMobile && canViewDashboard()}
            />

            <SidebarItem
              icon={Receipt}
              label="Ghi Phiếu Chi"
              id="quick_expense"
              activeTab={activeTab}
              setActiveTab={setTab}
              visible={true}
            />

            <SidebarItem
              icon={FileText}
              label="Hợp đồng"
              id="contracts"
              activeTab={activeTab}
              setActiveTab={setTab}
              visible={canAccess('contracts')}
            />

            <SidebarItem
              icon={CheckSquare}
              label="Công việc"
              id="tasks"
              activeTab={activeTab}
              setActiveTab={setTab}
              visible={true}
              badge={pendingTasksCount > 0 ? pendingTasksCount : undefined}
            />

            <SidebarItem
              icon={Calendar}
              label="Lịch trình"
              id="schedule"
              activeTab={activeTab}
              setActiveTab={setTab}
              visible={!isMobile && canAccess('schedules')}
            />

            <SidebarItem
              icon={DollarSign}
              label="Thu & Chi"
              id="finance"
              activeTab={activeTab}
              setActiveTab={setTab}
              visible={!isMobile && canViewFinance()}
            />

            <SidebarItem
              icon={DollarSign}
              label="Bảng lương"
              id="payroll"
              activeTab={activeTab}
              setActiveTab={setTab}
              visible={!isMobile && canAccess('staff')}
            />

            <SidebarItem
              icon={Users}
              label="Nhân sự"
              id="staff"
              activeTab={activeTab}
              setActiveTab={setTab}
              visible={!isMobile && canAccess('staff')}
            />

            <SidebarItem
              icon={Package}
              label="Dịch vụ"
              id="products"
              activeTab={activeTab}
              setActiveTab={setTab}
              visible={canAccess('products')}
            />

            <SidebarItem
              icon={Settings}
              label="Cấu hình"
              id="settings"
              activeTab={activeTab}
              setActiveTab={setTab}
              visible={!isMobile && canAccess('settings')}
            />
          </div>
        </div>

      <div className="mt-auto p-6 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800/50 rounded-2xl">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
            {currentUser?.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{currentUser?.name}</div>
            <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider truncate">
              {currentUser?.role}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors w-full p-2"
        >
          <LogOut size={16} /> Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
@@ -484,146 +491,146 @@ export default function App() {
      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
          isSidebarOpen ? 'lg:ml-72' : ''
        }`}
      >
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 min-w-0">
            {/* Mobile: open drawer */}
            <button onClick={() => setDrawerOpen(true)} className="lg:hidden p-2 text-slate-600">
              <Menu size={24} />
            </button>

            {/* Desktop: toggle sidebar */}
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="hidden lg:block p-2 text-slate-600">
              <Menu size={22} />
            </button>

            <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight truncate">
              {pageTitle}
            </h2>
          </div>
        </header>

        <div className={`p-4 md:p-8 flex-1 overflow-x-hidden relative ${isMobile ? 'pb-24' : ''}`}>
          {!isMobile && activeTab === 'dashboard' && canViewDashboard() && (
            <Dashboard
              contracts={contracts}
              transactions={transactions}
              staff={staff}
              services={services}
              serviceTypesList={serviceTypesList}
            />
          )}

          {activeTab === 'contracts' && canAccess('contracts') && (
            <ContractManager
              contracts={contracts}
              setContracts={setContracts}
              customers={customers}
              setCustomers={setCustomers}
              transactions={transactions}
              setTransactions={setTransactions}
              services={services}
              staff={staff}
              scheduleTypes={scheduleTypes}
              setScheduleTypes={setScheduleTypes}
              studioInfo={studioInfo}
              currentUser={currentUser}
              serviceTypesList={serviceTypesList}
              refreshTasks={refreshTasks}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskManager tasks={tasks} setTasks={setTasks} staff={staff} contracts={contracts} customers={customers} />
          )}

          {activeTab === 'quick_expense' && (
            <ExpenseManager
              transactions={transactions}
              setTransactions={setTransactions}
              contracts={contracts}
              customers={customers}
              staff={staff}
              dbCategories={expenseCategories}
              setDbCategories={setExpenseCategories}
              currentUser={currentUser!}
              isQuickView={true}
            />
          )}

          {!isMobile && activeTab === 'finance' && canViewFinance() && (
            <ExpenseManager
              transactions={transactions}
              setTransactions={setTransactions}
              contracts={contracts}
              customers={customers}
              staff={staff}
              dbCategories={expenseCategories}
              setDbCategories={setExpenseCategories}
              currentUser={currentUser!}
              isQuickView={false}
            />
          )}

          {!isMobile && activeTab === 'payroll' && canAccess('staff') && (
            <PayrollManager
              staff={staff}
              currentUser={currentUser!}
              tasks={tasks}
              contracts={contracts}
              transactions={transactions}
              setTransactions={setTransactions}
              services={services}
              customers={customers}
              studioInfo={studioInfo}
            />
          )}

          {!isMobile && activeTab === 'schedule' && canAccess('schedules') && (
            <ScheduleManager contracts={contracts} staff={staff} scheduleTypes={scheduleTypes} schedules={schedules} />
          )}

          {!isMobile && activeTab === 'staff' && canAccess('staff') && (
            <StaffManager staff={staff} setStaff={setStaff} schedules={schedules} />
          )}

          {activeTab === 'products' && canAccess('products') && (
            <ProductManager
              services={services}
              setServices={setServices}
              departments={departments}
              setDepartments={setDepartments}
              serviceTypesList={serviceGroupsList}
              currentUser={currentUser}
              scheduleTypes={scheduleTypes}
            />
          )}

          {!isMobile && activeTab === 'settings' && canAccess('settings') && (
            <StudioSettings
              studioInfo={studioInfo}
              setStudioInfo={setStudioInfo}
              serviceTypes={serviceTypes}
              setServiceTypes={setServiceTypes}
              serviceGroups={serviceGroups}
              setServiceGroups={setServiceGroups}
              isAdmin={isAdminOrDirector}
            />
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg lg:hidden">
            <div className="grid grid-cols-4">
              <BottomNavItem
                icon={FileText}
                label="Hợp đồng"
                active={activeTab === 'contracts'}
                onClick={() => setTab('contracts')}
                visible={canAccess('contracts')}
              />
              <BottomNavItem
                icon={CheckSquare}
