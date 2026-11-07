import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { ChallengePage } from '../features/challenges/ChallengePage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { LandingPage } from '../features/landing/LandingPage';
import { NotFoundPage } from '../features/not-found/NotFoundPage';
import { TutorPage } from '../features/tutor-demo/TutorPage';
import { AuthPage } from '../features/auth/AuthPage';
import { DraftsPage } from '../features/drafts/DraftsPage';
import { PublicSampleQuizPage } from '../features/quizzes/PublicSampleQuizPage';
import { QuizListPage } from '../features/quizzes/QuizListPage';
import { QuizRoutePage } from '../features/quizzes/QuizPage';

export const appRoutes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'tutor', element: <TutorPage /> },
      { path: 'challenges/:challengeId', element: <ChallengePage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'sample-quiz', element: <PublicSampleQuizPage /> },
      { path: 'quizzes', element: <QuizListPage /> },
      { path: 'quizzes/:quizId/:quizVersion', element: <QuizRoutePage /> },
      { path: 'account', element: <AuthPage /> },
      { path: 'drafts', element: <DraftsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(appRoutes);
