import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { AccountsPage } from './pages/AccountsPage'
import { BudgetPage } from './pages/BudgetPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { CategoryBudgetPage } from './pages/CategoryBudgetPage'
import { ProfilePage } from './pages/ProfilePage'
import { TransactionFormPage } from './pages/TransactionFormPage'
import { CalculatorPage } from './pages/CalculatorPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes with layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/transaction/form" element={<TransactionFormPage />} />
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/budget" element={<BudgetPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/:id" element={<CategoryBudgetPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
