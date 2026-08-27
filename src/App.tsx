import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { LandingPage } from '@/pages/LandingPage'
import { SignInPage } from '@/pages/SignInPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { BusinessProfilePage } from '@/pages/BusinessProfilePage'
import { CreateInvoicePage } from '@/pages/CreateInvoicePage'
import { EditInvoicePage } from '@/pages/EditInvoicePage'
import { InvoicePreviewPage } from '@/pages/InvoicePreviewPage'
import { InvoiceHistoryPage } from '@/pages/InvoiceHistoryPage'
import { ClientManagementPage } from '@/pages/ClientManagementPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="business-profile" element={<BusinessProfilePage />} />
              <Route path="invoices" element={<InvoiceHistoryPage />} />
              <Route path="invoices/create" element={<CreateInvoicePage />} />
              <Route path="invoices/:id" element={<InvoicePreviewPage />} />
              <Route path="invoices/:id/edit" element={<EditInvoicePage />} />
              <Route path="clients" element={<ClientManagementPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
