import { useEffect } from 'react';
import { getProfile } from '../data/profile';
import { chooseLanguage, i18n } from '../i18n';
import { appLanguageFor, enabledLanguages } from '../i18n/languages';
import { isSignedIn, useAuth } from './AuthContext';

/**
 * When a User logs in (on any phone), the app switches to the language saved to their account
 * (BR17, T-US4-2), if that language is switched on (BR21). Renders nothing.
 */
export function AccountLanguageSync() {
  const auth = useAuth();
  const userId = isSignedIn(auth) ? auth.session?.user.id : undefined;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void getProfile().then((result) => {
      if (!active || !result.ok) return;
      const language = appLanguageFor(result.data.language, enabledLanguages);
      if (language !== i18n.language) void chooseLanguage(language);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  return null;
}
