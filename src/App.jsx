import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import AuthForm from './components/auth/AuthForm';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, PublicRoute } from './components/layout/RouteGuards';
import AppLayout from './components/layout/AppLayout';
import { ChatProvider } from './context/ChatContext';



export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        {/* add socketProvider here */}
        <BrowserRouter>
          <Routes>

            {/* Public Guest Routes */}
            <Route element={<PublicRoute />}>
              <Route path='/login' element={<AuthForm isRegister={false} />} />
              <Route path='/register' element={<AuthForm isRegister={true} />} />
            </Route>

            {/* Private Authenticated Routes */}
            <Route element={<PrivateRoute />}>
              <Route path='/' element={<AppLayout />} />
            </Route>

            {/* Fallback Catch-all */}
            <Route path='*' element={<Navigate to='/login' replace />} />

          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  )
}
