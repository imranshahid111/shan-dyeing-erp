import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';
import ServerUnavailable from './components/ServerUnavailable';
import { Toaster } from 'sonner';

function AppContent() {
  const { isSplashLoading } = useAuth();

  if (isSplashLoading) {
    return <SplashScreen />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <AuthProvider>
      <ServerUnavailable />
      <Toaster position="bottom-center" richColors />
      <AppContent />
    </AuthProvider>
  );
}