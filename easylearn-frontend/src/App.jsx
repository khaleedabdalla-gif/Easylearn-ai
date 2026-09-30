import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DocumentDetail from './pages/DocumentDetail';
import TopicStudy from './pages/TopicStudy';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/"
          element={token ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/documents/:id"
          element={token ? <DocumentDetail /> : <Navigate to="/login" />}
        />
        <Route
          path="/documents/:id/topics/:topicId"
          element={token ? <TopicStudy /> : <Navigate to="/login" />}
        />


      </Routes>
    </BrowserRouter>
  );
}

export default App;