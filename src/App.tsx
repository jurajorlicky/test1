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
      <details className="mt-4 text-left">
        <summary className="cursor-pointer text-gray-500 text-sm">Technické detaily</summary>
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
          {error.message}
        </pre>
      </details>
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
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', userId)
        .single();
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
      // Add timeout to prevent infinite loading
      const authPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 10000)
      );
      const { data: { user }, error: authError } = await Promise.race([
        authPromise,
        timeoutPromise
      ]) as any;

      if (authError && authError.message !== 'Auth session missing!') {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
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
      if (err.message.includes('timeout') || err.message.includes('fetch')) {
        setUser(null);
        setIsAdmin(false);
      } else {
        setError("Chyba pri načítavaní: " + err.message);
        setAppError(err);
      }
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
      initializingRef.current = false;
    }
  }, [checkAdminStatus]);

  // Add global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setAppError(event.error);
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
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
    initialize();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          if (event === 'SIGNED_IN') {
            adminCacheRef.current = {};
            const adminStatus = await checkAdminStatus(currentUser.id);
            setIsAdmin(adminStatus);
          } else {
            const adminStatus = await checkAdminStatus(currentUser.id);
            setIsAdmin(adminStatus);
          }
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

  // --- ZOBRAZ LOGIN/UI IHNEĎ ---
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
                {/* Loading info pod loginom (nie blokujúce) */}
                {loading && (
                  <div className="mb-4 text-gray-500 text-center text-sm">
                    Overujem prihlásenie...
                  </div>
                )}
                <AuthForm />
                {/* Error info pod loginom */}
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
