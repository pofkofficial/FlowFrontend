import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { IconContext } from '@phosphor-icons/react';

// Pages
import Login from './pages/Login';
import CheckIn from './pages/public/CheckIn';
import StaffDashboard from './pages/staff/StaffDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';

// Guards
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <IconContext.Provider
      value={{
        color: 'currentColor',
        size: 20,
        weight: 'duotone',
      }}
    >
      <BrowserRouter>
        <Routes>
          {/* Public Customer Routes */}
          <Route path="/check-in" element={<CheckIn />} />
          {/* <Route path="/ticket/:id" element={<TicketStatus />} /> */}

          {/* Staff & Admin Unified Auth */}
          <Route path="/login" element={<Login />} />

          {/* Protected Staff Routes */}
          <Route element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']} />}>
            <Route path="/staff" element={<StaffDashboard />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>

          {/* Fallback Redirection */}
          <Route path="*" element={<Navigate to="/check-in" replace />} />
        </Routes>
      </BrowserRouter>
    </IconContext.Provider>
  );
}