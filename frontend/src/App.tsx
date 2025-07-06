import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';

// Theme Context
import { AppThemeProvider } from './contexts/ThemeContext';

// Components
import AdminDashboard from './features/admin/AdminDashboard';
import SearchPage from './features/search/SearchPage';
import AskPage from './features/assistant/AskPage';
import MainLayout from './features/main/MainLayout';
import HomePage from './features/main/HomePage';
import { DevelopmentModeIndicator } from './components/DevelopmentModeIndicator';

function App() {
  return (
    <Router>
      <AppThemeProvider>
        <CssBaseline />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="ask" element={<AskPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
        <DevelopmentModeIndicator />
      </AppThemeProvider>
    </Router>
  );
}

export default App;
