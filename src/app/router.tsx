import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { ChallengePage } from '../features/challenges/ChallengePage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { LandingPage } from '../features/landing/LandingPage';
import { NotFoundPage } from '../features/not-found/NotFoundPage';
import { TutorPage } from '../features/tutor-demo/TutorPage';

export const appRoutes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'tutor', element: <TutorPage /> },
      { path: 'challenges/:challengeId', element: <ChallengePage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(appRoutes);
