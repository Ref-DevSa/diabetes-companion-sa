import { Route, Routes } from 'react-router';
import { RequireUser, RequireVisitor } from './auth/guards';
import { AppLayout } from './components/AppLayout';
import { DevPlaceholder } from './components/DevPlaceholder';
import { DailyChecklist } from './screens/DailyChecklist';
import { ForgotPassword } from './screens/ForgotPassword';
import { GlucoseDiary } from './screens/GlucoseDiary';
import { Home } from './screens/Home';
import { LearningCentre } from './screens/LearningCentre';
import { LogIn } from './screens/LogIn';
import { Profile } from './screens/Profile';
import { SafetyGuide } from './screens/SafetyGuide';
import { SignUp } from './screens/SignUp';

/**
 * Routes from Section 7.3 and PRD 7.2, with the guards from Section 11 (BR16).
 * Screens not built yet show a development-only placeholder and are replaced in their phase
 * (S7 and S10 in Phase 7).
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout showTabBar />}>
        <Route index element={<Home />} />
        <Route path="learn" element={<LearningCentre />} />
        <Route path="safety" element={<SafetyGuide />} />
        <Route path="help" element={<DevPlaceholder screen="S7" />} />
        <Route element={<RequireUser />}>
          <Route path="diary" element={<GlucoseDiary />} />
          <Route path="checklist" element={<DailyChecklist />} />
          <Route path="dashboard" element={<DevPlaceholder screen="S10" />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Home />} />
      </Route>
      <Route element={<AppLayout showTabBar={false} />}>
        <Route element={<RequireVisitor />}>
          <Route path="sign-up" element={<SignUp />} />
          <Route path="log-in" element={<LogIn />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
        </Route>
      </Route>
    </Routes>
  );
}
