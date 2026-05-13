import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Login from './pages/Auth/Login';
import FindDoctor from './pages/Patient/FindDoctor';
import QueueManager from './pages/Doctor/QueueManager';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div style={{ padding: '20px' }}>Loading Application...</div>;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Admin implicitly bypasses RBAC in our design, or restrict heavily
  if (roles && !roles.includes(user.role) && user.role !== 'admin') {
    return <div style={{ padding: '20px', color: 'red' }}>Unauthorized Access: Role required ({roles.join(', ')})</div>;
  }

  return children;
};

function AppRoutes() {
  const { user, logout } = useContext(AuthContext);
  
  return (
    <Router>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        {user && (
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '15px 20px', background: '#eee', borderRadius: '5px' }}>
            <span style={{ fontSize: '18px' }}>
              <strong>Clinic Flow</strong> | Logged in as: {user.name} ({user.role.toUpperCase()})
            </span>
            <button 
              onClick={logout}
              style={{ padding: '8px 15px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Logout
            </button>
          </nav>
        )}
        <Routes>
          {/* Public Route */}
          <Route path="/" element={!user ? <Login /> : <Navigate to={`/${user.role}-dashboard`} replace />} />
          
          {/* Patient Role Protected */}
          <Route 
            path="/patient-dashboard" 
            element={
              <PrivateRoute roles={['patient']}>
                <FindDoctor />
              </PrivateRoute>
            } 
          />
          
          {/* Doctor Role Protected */}
          <Route 
            path="/doctor-dashboard" 
            element={
              <PrivateRoute roles={['doctor']}>
                <QueueManager />
              </PrivateRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
