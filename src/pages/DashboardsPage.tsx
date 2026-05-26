import DashboardGrid from '../components/Dashboard/DashboardGrid';
import { DASHBOARDS, DashboardConfig } from '../config/dashboards';
import { useAuthStore } from '../stores/authStore';
import { useEffect, useState } from 'react';
import useMobile from '../hooks/useMobile';
import MobileDashboardGrid from '../components/Dashboard/MobileDashboardGrid';

const DashboardsPage = () => {

  const roles = useAuthStore(state => state.roles);
  const hasAnyRole = useAuthStore(state => state.hasAnyRole);
  const [filteredDashboards, setFilteredDashboards] = useState<DashboardConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isMobile } = useMobile();

  useEffect(() => {
    const allowedDashboards = DASHBOARDS.filter(dashboard => {
      if (!dashboard.requiredRoles || dashboard.requiredRoles.length === 0) return true;

      return hasAnyRole(dashboard.requiredRoles);
    });

    setFilteredDashboards(allowedDashboards);
    setIsLoading(false);
  }, [roles, hasAnyRole]);
  

  return (
      <div>
        <div className="py-6">
          <div className="px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboards</h1>
            <p className="mt-1 text-sm text-gray-500">
              Visualizaciones interactivas y análisis de datos
            </p>
          </div>
          
          <div className="mt-6 px-4 sm:px-6 md:px-8">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : filteredDashboards.length > 0 ? (
              <DashboardGrid dashboards={filteredDashboards} />
            ) : (
              <div className="bg-yellow-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">No hay dashboards disponibles</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        No tienes acceso a ningún dashboard o no hay dashboards configurados.
                        Contacta a un administrador si crees que esto es un error.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {isMobile && (
        <MobileDashboardGrid dashboards={filteredDashboards} />
      )}
    </div>
  );
};

export default DashboardsPage;