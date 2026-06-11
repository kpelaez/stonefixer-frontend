import './App.css'
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AboutPage from './pages/AboutPage';
import SingleDashboardPage from './pages/SingleDashboardPage';
import UserRegisterPage from './pages/UserRegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Páginas del módulo de inventario
import InventoryDashboardPage from './pages/Inventory/InventoryDashboardPage';
import TechAssetsPage from './pages/Inventory/TechAssetsPage';
import AssignmentsPage from './pages/Inventory/AssignmentsPage';
import MaintenancePage from './pages/Inventory/MaintenancePage';
import MaintenanceFormPage from './pages/Inventory/MaintenanceFormPage';
import AssetFormPage from './pages/Inventory/AssetFormPage';
import AssignmentFormPage from './pages/Inventory/AssignmentFormPage';
import MyAssetsPage from './pages/Inventory/MyAssetsPage';
import InventoryReportsPage from './pages/Inventory/InventoryReportsPage';
import AssetDetailPage from './pages/Inventory/AssetDetailPage';


// Página generacion de Documento de asignación
import AssignmentDetailPage from './pages/Inventory/AssignmentDetailPage';
import UsersManagementPage from './pages/Users/UsersManagementPage';

// Página generacion de Contribucion Marginal Dashboard
import ContribucionMarginalDashboard from './pages/ContribucionMarginalDashboard'
import { ExcelDataProvider } from './pages/ExcelDataContext'
import PanelEjecutivoDashboard from './pages/PanelEjecutivoDashboard'

// Agregar al bloque de imports de páginas
import RemitosReportPage from './pages/Stock/Reports/RemitosReportsPage';
import HRSurveyDashboardPage from './pages/HrSurveyDashboard/HRSurveyDashboardPage';
// Toaster
import { Toaster } from 'react-hot-toast';


// Guards
import ProtectedRoute from './components/Auth/ProtectedRoute';
import RoleProtectedRoute from './components/Auth/RoleProtectedRoute';


// Nueva pagina modulo agenda stock
import ShiftSchedulePage from './pages/ShiftSchedulePage/ShiftSchedulePage';
import DashboardsPage from './pages/DashboardsPage';

import MyOvertimePage from './pages/Overtime/MyOvertimePage';
import OvertimeManagePage from './pages/Overtime/OvertimeManagePage';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';


// ─── Layout wrapper — UNA sola instancia de MainLayout 

const ExcelDashboardsLayout = () => (
  <ExcelDataProvider>
    <Outlet />
  </ExcelDataProvider>
);
// Todas las rutas hijas comparten el mismo sidebar y layout.
const AppLayout = () => (
  <MainLayout>
    <Outlet />
  </MainLayout>
);



function App() {

  const getUser = useAuthStore(state => state.getUser);

  useEffect(() => {
    // Siempre intentar recuperar el usuario al cargar la app
    // Si no hay cookie válida, el backend devuelve 401 y getUser() limpia el estado
      getUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  return (
    <div className="app-container">
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          // Estilos por defecto
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          // Estilos por tipo
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            duration: Infinity,
          },
        }}
      />
        <Router>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Rutas protegidas basicas (cualquier usuario autenticado) y con Layout */}
            <Route element={<AppLayout />}>
            
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } 
            />
            

            <Route 
              path="/teams/stock/schedule" 
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager', 'user']}>
                  <ShiftSchedulePage />
                </RoleProtectedRoute>
              } 
            />

            <Route
              path="/teams/stock/overtime"
              element={
                <ProtectedRoute>
                  <MyOvertimePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock/reports/remitos-cx"
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager', 'user']}>
                  <RemitosReportPage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/overtime/manage"
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager']}>
                  <OvertimeManagePage />
                </RoleProtectedRoute>
              }
            />       
            

            {/* Rutas protegidas por roles */}
            <Route 
              path="/dashboards/:dashboardId" 
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager']}>
                  <SingleDashboardPage />
                </RoleProtectedRoute>
              }  
            />
            {/* RUTAS DEL MÓDULO DE INVENTARIO */}
            
            {/* Dashboard de inventario - accesible para roles básicos de inventario */}
            <Route 
              path="/inventory/dashboard" 
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager', 'inventory_manager', 'user']}>
                  <InventoryDashboardPage />
                </RoleProtectedRoute>
              } 
            />

            {/* Gestión de activos tecnológicos - requiere permisos de gestión */}
            <Route 
              path="/inventory/tech-assets" 
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager', 'inventory_manager', 'user']}>
                  <TechAssetsPage />
                </RoleProtectedRoute>
              } 
            />

            {/* Gestion de activos tecnologicos - requiere permisos de gestion */}
            <Route
              path="/inventory/tech-assets/new"
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager', 'inventory_manager']}>
                  <AssetFormPage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/inventory/tech-assets/:id"
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager', 'inventory_manager']}>
                  <AssetDetailPage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/inventory/tech-assets/:id/edit"
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager', 'inventory_manager']}>
                  <AssetFormPage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/tech-inventory/reports"
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager', 'inventory_manager']}>
                  <InventoryReportsPage />
                </RoleProtectedRoute>
              }
            />

            {/* Gestión de asignaciones - requiere permisos de gestión */}
            <Route 
              path="/inventory/assignments" 
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager', 'inventory_manager']}>
                  <AssignmentsPage />
                </RoleProtectedRoute>
              } 
            />

            <Route
              path="/inventory/assignments/new"
              element={
                <RoleProtectedRoute requiredRoles={['admin']}>
                  <AssignmentFormPage />
                </RoleProtectedRoute>
              }   
            />

            <Route 
              path='/inventory/assignments/:id' 
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager']}>
                  <AssignmentDetailPage/>
                </RoleProtectedRoute>  
              }            
            />

            {/* Gestión de mantenimiento - accesible para técnicos también */}
            <Route 
              path="/inventory/maintenance" 
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager', 'inventory_manager', 'technician']}>
                  <MaintenancePage />
                </RoleProtectedRoute>
              } 
            />

            <Route 
              path="/inventory/maintenance/new" 
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager', 'inventory_manager', 'technician']}>
                  <MaintenanceFormPage />
                </RoleProtectedRoute>
              } 
            />

            {/* Mis activos - accesible para todos los usuarios autenticados */}
            <Route 
              path="/inventory/my-assets" 
              element={
                <ProtectedRoute>
                  <MyAssetsPage />
                </ProtectedRoute>
              } 
            />

            {/* Reportes de inventario - requiere permisos de gestión */}
            {/* <Route 
              path="/inventory/reports" 
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager', 'inventory_manager']}>
                  <InventoryReportsPage />
                </RoleProtectedRoute>
              } 
            /> */}
            <Route 
              path="/about" 
              element={
                <ProtectedRoute>
                  <AboutPage />
                </ProtectedRoute>
              } 
            />
            {/* Ruta de Dashboard Contribucion Marginal */}
            <Route element={<ExcelDashboardsLayout />}>
              <Route
                path="/dashboards/dash-ppal"
                element={
                  <RoleProtectedRoute requiredRoles={['admin','manager']}>
                    <PanelEjecutivoDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/dashboards/contribucion-marginal"
                element={
                  <RoleProtectedRoute requiredRoles={['admin','manager']}>
                    <ContribucionMarginalDashboard />
                  </RoleProtectedRoute>
                }
              />
            </Route>
            <Route
              path="/teams/rrhh/dashboards/hr-survey"
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'manager']}>
                  <HRSurveyDashboardPage />
                </RoleProtectedRoute>
              }
            />


            {/* Ruta para el registro de usuarios */}
            <Route 
              path="/admin/register-user" 
              element={
                <RoleProtectedRoute requiredRoles={['admin']}>
                  <UserRegisterPage />
                </RoleProtectedRoute>
              } 
            />
            <Route
              path="/admin/users"
              element={
                <RoleProtectedRoute requiredRoles={['admin']}>
                  <UsersManagementPage />
                </RoleProtectedRoute>
              }
            />
            </Route> 
            {/* Fin de rutas con Layout */}
          </Routes>
        </Router>
    </div>
  )
}

export default App