import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { PlatformCatalogProvider } from './contexts/PlatformCatalogContext';

export default function App() {
  return (
    <AuthProvider>
      <PlatformCatalogProvider>
        <RouterProvider router={router} />
      </PlatformCatalogProvider>
    </AuthProvider>
  );
}