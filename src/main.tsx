import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './styles/index.css';
import { i18n } from './i18n';
import { AccountLanguageSync } from './auth/AccountLanguageSync';
import { AuthProvider } from './auth/AuthProvider';
import { AppRoutes } from './App';

function setDocumentLanguage(language: string) {
  document.documentElement.lang = language === 'en' ? 'en-ZA' : language;
}
setDocumentLanguage(i18n.language);
i18n.on('languageChanged', setDocumentLanguage);

const root = document.getElementById('root');
if (!root) throw new Error('The #root element is missing from index.html');

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <AccountLanguageSync />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
