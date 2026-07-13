import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// 1. PrivateRoute: Restricts access to authenticated users
export function PrivateRoute() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className=''>
                <div className=''></div>
            </div>
        )
    }

    // If authenticated, render child routes (Outlet). Otherwise, boot to /login
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// 2. PublicRoute: Restricts access to guests (unauthenticated users)
export function PublicRoute() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className=''>
                <div className=''></div>
            </div>
        );
    }

    // If NOT authenticated, render child routes (Outlet). Otherwise, redirect to dashboard (/)
    return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};