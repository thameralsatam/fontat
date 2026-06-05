import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { GlobalProvider } from './contexts/GlobalContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Layout } from './components/Layout';
import { AnimatePresence } from 'framer-motion';
import { SplashScreen } from './components/SplashScreen';
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
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={
        <Layout>
          <Home />
        </Layout>
      } />
      
      <Route path="/fonts" element={
        <Layout>
          <FontsPage mode="public" />
        </Layout>
      } />
      
      <Route path="/fonts/:fontParam" element={
        <Layout>
          <FontsPage mode="public" />
        </Layout>
      } />
      
      <Route path="/my-fonts" element={
        <Layout>
          <FontsPage mode="private" />
        </Layout>
      } />

      <Route path="/my-fonts/:fontParam" element={
        <Layout>
          <FontsPage mode="private" />
        </Layout>
      } />
      
      <Route path="/login" element={
        <Layout>
          {!user ? <Login /> : <Navigate to="/account" />}
        </Layout>
      } />
      
      <Route path="/account" element={
        <Layout>
          <Account />
        </Layout>
      } />
      
      <Route path="/lab" element={
        <Layout>
          <Lab />
        </Layout>
      } />
      
      <Route path="/group/:id" element={
        <Layout>
          <GroupDetails />
        </Layout>
      } />
      
      <Route path="/privacy" element={
        <Layout>
          <PrivacyPolicy />
        </Layout>
      } />
      
      <Route path="/terms" element={
        <Layout>
          <TermsOfUse />
        </Layout>
      } />
      
      <Route path="/about" element={
        <Layout>
          <AboutUs />
        </Layout>
      } />
      
      <Route path="*" element={
        <Layout>
          <NotFound />
        </Layout>
      } />
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
