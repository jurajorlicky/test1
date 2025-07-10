import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { User } from '@supabase/supabase-js';
import { supabase } from "./lib/supabase";

// Error fallback component
const ErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
  <div className="min-h-screen flex justify-center items-center bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="text-red-600 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Chyba aplikácie</h1>
      <p className="text-gray-600 mb-4">Nastala neočakávaná chyba pri načítavaní aplikácie.</p>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Skúsiť znova
      </button>
    </div>
  </div>
);

import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import UserSales from "./components/UserSales";
import AdminDashboard from "./components/AdminDashboard";
import ProductsPage from "./pages/ProductsPage";
import UsersPage from "./pages/UsersPage";
import ListedProductsPage from "./pages/ListedProductsPage";
import SalesPage from "./pages/SalesPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appError, setAppError] = useState<Error | null>(null);
  
  const adminCacheRef = useRef<{[key: string]: boolean}>({});
  const initializingRef = useRef(false);

  const checkAdminStatus = useCallback(async (userId: string): Promise<boolean> => {
    try {
      if (adminCacheRef.current[userId] !== undefined) {
        return adminCacheRef.current[userId];
      }
      
      const { data: adminData, error: adminError } = await Promise.race([
        supabase.from('admin_users').select('id').eq('id', userId).single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Admin check timeout')), 2000))
      ]) as any;
      
      if (adminError && adminError.code !== 'PGRST116') {
        console.warn('Admin check error:', adminError.message);
        return false;
      }
      
      const isAdminUser = !!adminData;
      adminCacheRef.current[userId] = isAdminUser;
      return isAdminUser;
    } catch (err: any) {
      console.warn('Error checking admin status:', err.message);
      return false;
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    if (initializingRef.current) return;
    
    try {
      initializingRef.current = true;
      setError(null);
      setAppError(null);
      
      // Quick auth check with timeout
      const { data: { user }, error: authError } = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 3000))
      ]) as any;

      if (authError && authError.message !== 'Auth session missing!') {
        setUser(null);
        setIsAdmin(false);
        return;
      }

      setUser(user);
      
      if (user) {
        try {
          const adminStatus = await checkAdminStatus(user.id);
          setIsAdmin(adminStatus);
        } catch (adminError) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        adminCacheRef.current = {};
      }
    } catch (err: any) {
      console.warn('Auth initialization error:', err.message);
      setUser(null);
      setIsAdmin(false);
      
      if (!err.message.includes('timeout')) {
        setError("Chyba pri načítavaní: " + err.message);
      }
    } finally {
      setLoading(false);
      initializingRef.current = false;
    }
  }, [checkAdminStatus]);

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setAppError(event.error);
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled rejection:', event.reason);
      setAppError(new Error(event.reason?.message || 'Unhandled promise rejection'));
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
    return () => {};
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      if (isMounted) {
        await initializeAuth();
      }
    };
    
    // Quick initialization
    initialize();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          if (event === 'SIGNED_IN') {
            adminCacheRef.current = {};
          }
          const adminStatus = await checkAdminStatus(currentUser.id);
          setIsAdmin(adminStatus);
        } else {
          setIsAdmin(false);
          adminCacheRef.current = {};
        }
        setError(null);
      } catch (err: any) {
        setIsAdmin(false);
      }
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [initializeAuth, checkAdminStatus]);

  // Show error fallback if there's an app error
  if (appError) {
    return <ErrorFallback error={appError} resetError={() => setAppError(null)} />;
  }

  // Quick loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Načítava sa...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          !user ? (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
              <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Prihlásenie
                </h1>
                <AuthForm />
                {error && (
                  <div className="mt-4 p-2 bg-red-100 text-red-800 rounded text-center text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>
          ) : isAdmin ? (
            <Navigate to="/admin" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/dashboard"
        element={user && !isAdmin ? <Dashboard isAdmin={isAdmin} /> : <Navigate to={isAdmin ? "/admin" : "/"} replace />}
      />
      <Route
        path="/profile"
        element={user ? <Profile /> : <Navigate to="/" replace />}
      />
      <Route
        path="/sales"
        element={user ? <UserSales /> : <Navigate to="/" replace />}
      />
      <Route
        path="/admin"
        element={user && isAdmin ? <AdminDashboard /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/admin/products"
        element={user && isAdmin ? <ProductsPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/admin/users"
        element={user && isAdmin ? <UsersPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/admin/listed-products"
        element={user && isAdmin ? <ListedProductsPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/admin/sales"
        element={user && isAdmin ? <SalesPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/admin/settings"
        element={user && isAdmin ? <SettingsPage /> : <Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}