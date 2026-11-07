import { Route, Routes } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { DevPlaceholder } from './components/DevPlaceholder';
import { Home } from './screens/Home';

/**
 * Routes from Section 7.3 and PRD 7.2. Screens not built yet show a development-only
 * placeholder and are replaced in their phase (S2–S4, S11 in Phase 3; S5, S6 in Phase 4;
 * S8 in Phase 5; S9 in Phase 6; S7, S10 in Phase 7). Guards (BR16) are added in Phase 3.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout showTabBar />}>
        <Route index element={<Home />} />
        <Route path="learn" element={<DevPlaceholder screen="S5" />} />
        <Route path="safety" element={<DevPlaceholder screen="S6" />} />
        <Route path="help" element={<DevPlaceholder screen="S7" />} />
        <Route path="diary" element={<DevPlaceholder screen="S8" />} />
        <Route path="checklist" element={<DevPlaceholder screen="S9" />} />
        <Route path="dashboard" element={<DevPlaceholder screen="S10" />} />
        <Route path="profile" element={<DevPlaceholder screen="S11" />} />
        <Route path="*" element={<Home />} />
      </Route>
      <Route element={<AppLayout showTabBar={false} />}>
        <Route path="sign-up" element={<DevPlaceholder screen="S2" />} />
        <Route path="log-in" element={<DevPlaceholder screen="S3" />} />
        <Route path="forgot-password" element={<DevPlaceholder screen="S4" />} />
      </Route>
    </Routes>
  );
}
