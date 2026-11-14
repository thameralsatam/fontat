import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { GlobalProvider } from './contexts/GlobalContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Layout } from './components/Layout';
import { AnimatePresence } from 'framer-motion';
import { SplashScreen } from './components/SplashScreen';
import { AutoUpdateChecker } from './components/AutoUpdateChecker';
import { Login } from './pages/Login';
import { FontsPage } from './pages/FontsPage';
import { GroupDetails } from './pages/GroupDetails';
import { Lab } from './pages/Lab';
import { Account } from './pages/Account';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfUse } from './pages/TermsOfUse';
import { AboutUs } from './pages/AboutUs';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      
      <Route path="/fonts" element={<FontsPage mode="public" />} />
      
      <Route path="/fonts/:fontParam" element={<FontsPage mode="public" />} />
      
      <Route path="/my-fonts" element={<FontsPage mode="private" />} />

      <Route path="/my-fonts/:fontParam" element={<FontsPage mode="private" />} />
      
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/account" />} />
      
      <Route path="/account" element={<Account />} />
      
      <Route path="/lab" element={<Lab />} />
      
      <Route path="/group/:id" element={<GroupDetails />} />
      
      <Route path="/group/:id/:fontParam" element={<GroupDetails />} />
      
      <Route path="/privacy" element={<PrivacyPolicy />} />
      
      <Route path="/terms" element={<TermsOfUse />} />
      
      <Route path="/about" element={<AboutUs />} />
      
      <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <LanguageProvider>
      <NotificationProvider>
        <GlobalProvider>
          <BrowserRouter>
            <AutoUpdateChecker />
            <AppRoutes />
            <AnimatePresence>
              {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            </AnimatePresence>
          </BrowserRouter>
        </GlobalProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
