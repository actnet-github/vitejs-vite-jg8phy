import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import NewsDashboard from './pages/NewsDashboard';
import NewsCreatePage from './pages/NewsCreatePage';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/news"
            element={
              <PrivateRoute>
                <NewsDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/news/create"
            element={
              <PrivateRoute>
                <NewsCreatePage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/news" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;