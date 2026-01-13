import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainSite from './components/MainSite';
import AdminPanel from './components/admin/AdminPanel';
import AdminLogin from './components/admin/AdminLogin';
import ProtectedRoute from './components/admin/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Admin routes - must come first for proper matching */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          
          {/* Main site routes - catch all */}
          <Route path="/*" element={<MainSite />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;