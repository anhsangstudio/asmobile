import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  DollarSign,
  Users,
  Package,
  Settings,
  LogOut,
  Menu,
  CheckSquare,
  Sparkles,
  Loader2,
  Lock,
  Receipt,
  X
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import ContractManager from './components/ContractManager';
import ExpenseManager from './components/ExpenseManager';
import PayrollManager from './components/PayrollManager';
import ScheduleManager from './components/ScheduleManager';
import StaffManager from './components/StaffManager';
import ProductManager from './components/ProductManager';
import StudioSettings from './components/StudioSettings';
import TaskManager from './components/TaskManager';

import {
  Contract,
  Customer,
  Staff,
  Service,
  Transaction,
  Schedule,
  Task,
  StudioInfo,
  ExpenseCategoryItem,
  ServiceTypeItem,
  ServiceGroupItem
} from './types';
import { fetchBootstrapData, login as apiLogin, fetchTasks } from './apiService';
import { mockCustomers, mockContracts, mockServices, mockStaff, mockTransactions } from './mockData';

type TabId =
  | 'dashboard'
  | 'quick_expense'
  | 'contracts'
  | 'tasks'
  | 'schedule'
  | 'finance'
  | 'payroll'
  | 'staff'
  | 'products'
  | 'settings';

export default function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // App State
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Sidebar/Drawer state
  const [isSidebarOpen, setSidebarOpen] = useState(true); // desktop sidebar
  const [isDrawerOpen, setDrawerOpen] = useState(false); // mobile drawer
  const [isMobile, setIsMobile] = useState(false);

  // Data State
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
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
        setCustomers(mockCustomers);
        setServices(mockServices);
        setStaff(mockStaff);
        setTransactions(mockTransactions);
        setSchedules([]);
        setTasks([]);
        const uniqueTypes = Array.from(new Set(mockServices.map(s => s.type || 'Khác')));
        setServiceTypes(uniqueTypes.map((t, i) => ({ id: `st-${i}`, name: t })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const chooseDefaultTabAfterLogin = (user: Staff) => {
    const mobile = window.innerWidth < 1024;
    if (mobile) return 'quick_expense' as TabId;
    if (user.username === 'admin' || user.role === 'Giám đốc') return 'dashboard' as TabId;
    // for staff: default tasks
    return 'tasks' as TabId;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');
    try {
      const result = await apiLogin(loginUser, loginPass);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        await loadData();
        setActiveTab(chooseDefaultTabAfterLogin(result.user));
      } else {
        setAuthError(result.error || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLoginUser('');
    setLoginPass('');
    setActiveTab('dashboard');
    setDrawerOpen(false);
  };

  const setTab = (id: TabId) => {
    setActiveTab(id);
    if (isMobile) setDrawerOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/30">
              <Sparkles size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ánh Sáng Studio</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">
              Hệ thống quản trị tập trung
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                Tên đăng nhập
              </label>
              <input
                type="text"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                placeholder="admin"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                Mật khẩu
              </label>
              <input
                type="password"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                placeholder="••••••"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                <Lock size={14} /> {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Đăng nhập hệ thống'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pendingTasksCount = tasks.filter(
    t => t.assignedStaffIds.includes(currentUser?.id || '') && t.status !== 'Completed'
  ).length;

  const pageTitle = (() => {
    if (activeTab === 'dashboard') return 'Dashboard';
    if (activeTab === 'quick_expense') return 'Ghi Phiếu Chi Nhanh';
    if (activeTab === 'contracts') return 'Quản lý Hợp đồng';
    if (activeTab === 'tasks') return 'Quản lý Công việc';
    if (activeTab === 'schedule') return 'Lịch làm việc';
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
            visible={canViewDashboard()}
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
            visible={canAccess('schedules')}
          />

          <SidebarItem
            icon={DollarSign}
            label="Thu & Chi"
            id="finance"
            activeTab={activeTab}
            setActiveTab={setTab}
            visible={canViewFinance()}
          />

          <SidebarItem
            icon={DollarSign}
            label="Bảng lương"
            id="payroll"
            activeTab={activeTab}
            setActiveTab={setTab}
            visible={canAccess('staff')}
          />

          <SidebarItem
            icon={Users}
            label="Nhân sự"
            id="staff"
            activeTab={activeTab}
            setActiveTab={setTab}
            visible={canAccess('staff')}
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
            visible={canAccess('settings')}
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
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex-col`}
      >
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobile && (
        <>
          <div
            className={`fixed inset-0 z-50 transition-opacity ${
              isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <div
              className={`absolute inset-y-0 left-0 w-72 bg-slate-900 text-white shadow-2xl transition-transform duration-300 ${
                isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="text-xs font-black uppercase tracking-widest text-slate-300">Menu</div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-300"
                >
                  <X size={18} />
                </button>
              </div>
              {SidebarContent}
            </div>
          </div>
        </>
      )}

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
          {activeTab === 'dashboard' && canViewDashboard() && (
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

          {activeTab === 'finance' && canViewFinance() && (
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

          {activeTab === 'payroll' && canAccess('staff') && (
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

          {activeTab === 'schedule' && canAccess('schedules') && (
            <ScheduleManager contracts={contracts} staff={staff} scheduleTypes={scheduleTypes} schedules={schedules} />
          )}

          {activeTab === 'staff' && canAccess('staff') && (
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

          {activeTab === 'settings' && canAccess('settings') && (
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
                label="Công việc"
                active={activeTab === 'tasks'}
                onClick={() => setTab('tasks')}
                visible={true}
                badge={pendingTasksCount > 0 ? pendingTasksCount : undefined}
              />
              <BottomNavItem
                icon={Package}
                label="Dịch vụ"
                active={activeTab === 'products'}
                onClick={() => setTab('products')}
                visible={canAccess('products')}
              />
              <BottomNavItem
                icon={Receipt}
                label="Phiếu chi"
                active={activeTab === 'quick_expense'}
                onClick={() => setTab('quick_expense')}
                visible={true}
              />
            </div>
          </nav>
        )}
      </main>
    </div>
  );
}

const SidebarItem = ({ icon: Icon, label, id, activeTab, setActiveTab, visible = true, badge }: any) => {
  if (!visible) return null;
  const isActive = activeTab === id;
  return (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all mb-1 group relative ${
        isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
        <span className="font-bold text-xs uppercase tracking-wider">{label}</span>
      </div>
      {badge > 0 && (
        <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">{badge}</span>
      )}
      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />}
    </button>
  );
};

const BottomNavItem = ({ icon: Icon, label, active, onClick, visible = true, badge }: any) => {
  if (!visible) return <div className="py-2" />;
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-black uppercase tracking-widest ${
        active ? 'text-blue-600' : 'text-slate-500'
      }`}
    >
      <Icon size={20} className={active ? 'text-blue-600' : 'text-slate-400'} />
      <span className="leading-none">{label}</span>
      {badge > 0 && (
        <span className="absolute top-1 right-5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
};
