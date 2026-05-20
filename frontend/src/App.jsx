import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import AdminChatPage from './pages/AdminChatPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminWithdrawPage from './pages/AdminWithdrawPage';
import AdminDepositPage from './pages/AdminDepositPage';
import DepositPage from './pages/DepositPage';
import KYCPage from './pages/KYCPage';
import TradePage from './pages/TradePage';
import DerivativesPage from './pages/DerivativesPage';
import SpotPage from './pages/SpotPage';
import MarketPage from './pages/MarketPage';
import AdminTradesPage from './pages/AdminTradesPage';
import AdminAccountPage from './pages/AdminAccountPage';
import AdminPaymentMethodsPage from './pages/AdminPaymentMethodsPage';
import AdminKYCPage from './pages/AdminKYCPage';
import WithdrawPage from './pages/WithdrawPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import PersonalInfoPage from './pages/PersonalInfoPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import SecurityPage from './pages/SecurityPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          {/* ── User routes ── */}
          <Route path="/"            element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
          <Route path="/chat"        element={<PrivateRoute><Layout><ChatPage /></Layout></PrivateRoute>} />
          <Route path="/deposit"     element={<PrivateRoute><Layout><DepositPage /></Layout></PrivateRoute>} />
          <Route path="/withdraw"    element={<PrivateRoute><Layout><WithdrawPage /></Layout></PrivateRoute>} />
          <Route path="/trade"       element={<PrivateRoute><Layout><TradePage /></Layout></PrivateRoute>} />
          <Route path="/derivatives" element={<PrivateRoute><Layout><DerivativesPage /></Layout></PrivateRoute>} />
          <Route path="/spot"        element={<PrivateRoute><Layout><SpotPage /></Layout></PrivateRoute>} />
          <Route path="/kyc"         element={<PrivateRoute><Layout><KYCPage /></Layout></PrivateRoute>} />
          <Route path="/market"      element={<PrivateRoute><Layout><MarketPage /></Layout></PrivateRoute>} />
          <Route path="/profile"          element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/profile/info"     element={<PrivateRoute><PersonalInfoPage /></PrivateRoute>} />
          <Route path="/profile/payments" element={<PrivateRoute><PaymentMethodsPage /></PrivateRoute>} />
          <Route path="/profile/security" element={<PrivateRoute><SecurityPage /></PrivateRoute>} />

          {/* ── Admin routes (dedicated AdminLayout, no Spot/Derivatives) ── */}
          <Route path="/admin"         element={<AdminRoute><AdminLayout><AdminDashboardPage /></AdminLayout></AdminRoute>} />
          <Route path="/admin/withdraw" element={<AdminRoute><AdminLayout><AdminWithdrawPage /></AdminLayout></AdminRoute>} />
          <Route path="/admin/deposit"  element={<AdminRoute><AdminLayout><AdminDepositPage /></AdminLayout></AdminRoute>} />
          <Route path="/admin/support"  element={<AdminRoute><AdminLayout><AdminChatPage /></AdminLayout></AdminRoute>} />
          <Route path="/admin/trades"   element={<AdminRoute><AdminLayout><AdminTradesPage /></AdminLayout></AdminRoute>} />
          <Route path="/admin/kyc"      element={<AdminRoute><AdminLayout><AdminKYCPage /></AdminLayout></AdminRoute>} />
          <Route path="/admin/account"   element={<AdminRoute><AdminLayout><AdminAccountPage /></AdminLayout></AdminRoute>} />
          <Route path="/admin/payments"  element={<AdminRoute><AdminLayout><AdminPaymentMethodsPage /></AdminLayout></AdminRoute>} />

          {/* ── Public routes ── */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />

          {/* ── Auth routes ── */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
