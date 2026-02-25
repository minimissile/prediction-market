import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/layouts';
import { HomePage, ChartPage } from '@/pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'chart',
        element: <ChartPage />,
      },
      {
        path: 'chart/:symbol',
        element: <ChartPage />,
      },
    ],
  },
]);
