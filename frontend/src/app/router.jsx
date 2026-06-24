import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import Dashboard from '../pages/Dashboard';
import Analysis from '../pages/Analysis';
import AntiPatterns from '../pages/AntiPatterns';
import Reports from '../pages/Reports';
import History from '../pages/History';
import HowItWorks from '../pages/HowItWorks';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/analysis', element: <Analysis /> },
      { path: '/patterns', element: <AntiPatterns /> },
      { path: '/how-it-works', element: <HowItWorks /> },
      { path: '/reports', element: <Reports /> },
      { path: '/history', element: <History /> },
    ],
  },
]);
