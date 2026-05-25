import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import { AppProvider } from './context/AppContext';
import AdminPage from './pages/AdminPage';
import OrderPage from './pages/OrderPage';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <div className="app">
            <Header />
            <Routes>
              <Route path="/" element={<OrderPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
