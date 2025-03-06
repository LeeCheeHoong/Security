// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';  // Import Navigate
import NavBar from './Components/Navbar';
import Home from './Pages/Home';
import Login from './Pages/Login';
import Register from './Pages/Register';
import config from './config';
import VerifyPage from './Pages/VerifyPage';
import CreateItem from './Pages/CreateItem';
import SellerDashboard from './Pages/SellerDashboard';
import AdminHome from './Pages/AdminHome';
const apiUrl = config.apiUrl

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
  };

  // PrivateRoute component to handle protected routes
  const PrivateRoute = ({ element }) => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      // Log out if the user is not authenticated
      localStorage.removeItem('authToken');
      setIsLoggedIn(false);
      return <Navigate to="/login" />;
    }
    return element;
  };

  // Modified PublicRoute component
  const PublicRoute = ({ element }) => {
    const token = localStorage.getItem('authToken');
    const [shouldRedirect, setShouldRedirect] = useState(false);
    const [redirectPath, setRedirectPath] = useState('/');

    useEffect(() => {
      const checkUserRole = async () => {
        if (token) {
          try {
            const response = await fetch(`${apiUrl}/auth/getUserAttributes`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              setIsLoggedIn(true);
              if (data.attributes.includes('ADMIN')) {
                setRedirectPath('/admin');
              }
              setShouldRedirect(true);
            }
          } catch (error) {
            console.error('Error checking user role:', error);
          }
        }
      };

      checkUserRole();
    }, [token]);

    if (shouldRedirect) {
      return <Navigate to={redirectPath} />;
    }

    return element;
  };

  const RoleRouter = ({ roleRequired, element }) => {
    const token = localStorage.getItem('authToken');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkPermission = async () => {
        try {
          const response = await fetch(`${apiUrl}/auth/getUserAttributes`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            // Check if user has the required role
            const hasRequiredRole = roleRequired.every(role =>
              data.attributes.includes(role.toUpperCase())
            );
            setIsAuthorized(hasRequiredRole);
          } else {
            setIsAuthorized(false);
          }
        } catch (error) {
          console.error('Permission check failed:', error);
          setIsAuthorized(false);
        } finally {
          setIsLoading(false);
        }
      };

      if (token) {
        checkPermission();
      } else {
        setIsAuthorized(false);
        setIsLoading(false);
      }
    }, [roleRequired, token]);

    if (isLoading) {
      return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    return isAuthorized ? element : <Navigate to="/" replace />;
  };


  return (
    <div>
      {isLoggedIn && <NavBar onLogout={handleLogout} />}
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute element={<Login onLogin={handleLogin} />} />} />
        <Route path="/register" element={<PublicRoute element={<Register />} />} />

        {/* Protected routes */}
        <Route path="/" element={<PrivateRoute element={<Home />} />} />
        <Route path="/admin" element={<RoleRouter roleRequired={['ADMIN']} element={<AdminHome />} />} />

        <Route path="/verify" element={<PrivateRoute element={<VerifyPage />} />} />

        <Route path="/create-item" element={<RoleRouter roleRequired={['SELLER']} element={<CreateItem />} />} />
        <Route path="/seller-dashboard" element={<RoleRouter roleRequired={['SELLER']} element={<SellerDashboard />} />} />

        {/* Redirect if the user tries to access a non-existent route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
