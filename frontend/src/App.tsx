import { RouterProvider } from 'react-router-dom';
import { router } from './utils/routes.tsx';

export default function App() {
  return <RouterProvider router={router} />;
}
