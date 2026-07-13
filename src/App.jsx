import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import AuthForm from './components/auth/AuthForm';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, PublicRoute } from './components/layout/RouteGuards';

// Temporary dashboard to view after successful login
const TempDashboard = () => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 text-slate-100 gap-4">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-blue-500">Welcome to Nexus Chat!</h1>
      <p className="text-slate-400 text-sm mt-1">You have successfully authenticated.</p>
    </div>
    <button
      onClick={() => {
        localStorage.removeItem('token');
        window.location.reload(); // Quick way to trigger logout for now
      }}
      className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg text-sm text-slate-200 cursor-pointer"
    >
      Sign Out
    </button>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public Guest Routes */}
          <Route element={<PublicRoute />}>
            <Route path='/login' element={<AuthForm isRegister={false} />} />
            <Route path='/register' element={<AuthForm isRegister={true} />} />
          </Route>

          {/* Private Authenticated Routes */}
          <Route element={<PrivateRoute />}>
            <Route path='/' element={<TempDashboard />} />
          </Route>

          {/* Fallback Catch-all */}
          <Route path='*' element={<Navigate to='/login' replace />} />
          
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
