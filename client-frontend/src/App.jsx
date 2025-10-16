import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import EmailVerification from './pages/EmailVerification'
import Dashboard from './pages/Dashboard'
import Messages from './pages/Messages'
import WebsiteMessages from './pages/WebsiteMessages'
import WhatsAppMessages from './pages/WhatsAppMessages'
import FacebookMessages from './pages/FacebookMessages'
import InstagramMessages from './pages/InstagramMessages'
import TikTokMessages from './pages/TikTokMessages'
import Analytics from './pages/Analytics'
import CRM from './pages/CRM'
import KnowledgeBase from './pages/KnowledgeBase'
import BotSettings from './pages/BotSettings'
import Help from './pages/Help'
import Payment from './pages/Payment'
import Layout from './components/Layout'

const queryClient = new QueryClient()

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <Layout>
                    <Messages />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/messages/website" element={
                <ProtectedRoute>
                  <Layout>
                    <WebsiteMessages />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/messages/whatsapp" element={
                <ProtectedRoute>
                  <Layout>
                    <WhatsAppMessages />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/messages/facebook" element={
                <ProtectedRoute>
                  <Layout>
                    <FacebookMessages />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/messages/instagram" element={
                <ProtectedRoute>
                  <Layout>
                    <InstagramMessages />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/messages/tiktok" element={
                <ProtectedRoute>
                  <Layout>
                    <TikTokMessages />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Layout>
                    <Analytics />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/crm" element={
                <ProtectedRoute>
                  <Layout>
                    <CRM />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/knowledge-base" element={
                <ProtectedRoute>
                  <Layout>
                    <KnowledgeBase />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/bot-settings" element={
                <ProtectedRoute>
                  <Layout>
                    <BotSettings />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/help" element={
                <ProtectedRoute>
                  <Layout>
                    <Help />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/payment" element={
                <ProtectedRoute>
                  <Layout>
                    <Payment />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
