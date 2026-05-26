import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { ReactNode } from "react";

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({children, requiredRoles = []}) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasAnyRole = useAuthStore(state => state.hasAnyRole);
    const isLoading = useAuthStore(state => state.isLoading);
    const location = useLocation();

    if(isLoading) {
        return <div className="loading">Verificando autenticacion...</div>;
    }
    
    if(!isAuthenticated) {
        return <Navigate to="/login" state={{from: location}} replace />;
    }

    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;