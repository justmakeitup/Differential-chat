import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CustomCursor } from './components/CustomCursor';
import { ToastContainer } from './components/ToastContainer';
import { CookieBanner } from './components/CookieBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PostComposerModal } from './components/PostComposerModal';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { ProfilePage } from './pages/ProfilePage';
import { FeedPage } from './pages/FeedPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { ThankYouPage } from './pages/ThankYouPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo(0, 0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-obsidian-900 border border-gold-500/40 flex items-center justify-center shadow-gold-glow animate-pulse">
            <span className="font-serif font-bold text-gold-400 text-xl">Æ</span>
          </div>
          <span className="font-mono text-xs text-editorial-subtle">
            Initializing Cryptographic Node...
          </span>
        </div>
      </div>
    );
  }

  // Parse path and route params
  const pathname = currentPath.split('?')[0];
  const searchParams = new URLSearchParams(window.location.search);
  const peerParam = searchParams.get('peer');

  const renderContent = () => {
    // 1. Home
    if (pathname === '/') {
      return <HomePage onNavigate={navigate} />;
    }

    // 2. Login
    if (pathname === '/login') {
      return <LoginPage onNavigate={navigate} />;
    }

    // 3. Sign Up
    if (pathname === '/signup') {
      return <SignUpPage onNavigate={navigate} />;
    }

    // 4. Forgot / Reset Password
    if (pathname === '/forgot-password') {
      return <ForgotPasswordPage onNavigate={navigate} />;
    }

    // 5. Onboarding (Protected)
    if (pathname === '/onboarding') {
      if (!user) return <LoginPage onNavigate={navigate} />;
      return <OnboardingPage onNavigate={navigate} />;
    }

    // 6. Discover People
    if (pathname === '/discover') {
      return <DiscoverPage onNavigate={navigate} />;
    }

    // 7. Profile Page (/profile/:username)
    if (pathname.startsWith('/profile/')) {
      const username = pathname.replace('/profile/', '');
      return (
        <ProfilePage
          username={username}
          onNavigate={navigate}
          onOpenPost={(id) => navigate(`/posts/${id}`)}
        />
      );
    }

    // 8. Image Feed & Post Composer
    if (pathname === '/feed') {
      return (
        <FeedPage
          key={feedRefreshKey}
          onNavigate={navigate}
          onOpenPost={(id) => navigate(`/posts/${id}`)}
          onOpenComposer={() => setIsComposerOpen(true)}
        />
      );
    }

    // 9. Post Detail (/posts/:id)
    if (pathname.startsWith('/posts/')) {
      const postId = pathname.replace('/posts/', '');
      return (
        <PostDetailPage
          postId={postId}
          onNavigate={navigate}
          onPostDeleted={() => setFeedRefreshKey((k) => k + 1)}
        />
      );
    }

    // 10. Connections & Requests (Protected)
    if (pathname === '/connections') {
      if (!user) return <LoginPage onNavigate={navigate} />;
      return <ConnectionsPage onNavigate={navigate} />;
    }

    // 11. Encrypted Chat Inbox & Conversation (Protected)
    if (pathname === '/chat') {
      if (!user) return <LoginPage onNavigate={navigate} />;
      return <ChatPage initialPeerId={peerParam} onNavigate={navigate} />;
    }

    // 12. Settings and Privacy Controls (Protected)
    if (pathname === '/settings') {
      if (!user) return <LoginPage onNavigate={navigate} />;
      return <SettingsPage onNavigate={navigate} />;
    }

    // 13. Thank You Page
    if (pathname === '/thank-you') {
      return <ThankYouPage onNavigate={navigate} />;
    }

    // 14. Privacy Policy
    if (pathname === '/privacy') {
      return <PrivacyPolicyPage onNavigate={navigate} />;
    }

    // 15. Terms and Conditions
    if (pathname === '/terms') {
      return <TermsPage onNavigate={navigate} />;
    }

    // 16. Custom Animated 404
    return <NotFoundPage onNavigate={navigate} />;
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col selection:bg-gold-500 selection:text-obsidian-950 font-sans">
        {/* Custom Tasteful Cursor */}
        <CustomCursor />

        {/* Fixed Navigation */}
        <Navbar
          currentPath={pathname}
          onNavigate={navigate}
          onOpenComposer={() => setIsComposerOpen(true)}
        />

        {/* Main Routed Page */}
        <main className="flex-1">
          {renderContent()}
        </main>

        {/* Footer */}
        <Footer onNavigate={navigate} />

        {/* Global Image Post Composer Modal */}
        <PostComposerModal
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          onPostCreated={() => {
            setFeedRefreshKey((k) => k + 1);
            if (pathname !== '/feed') navigate('/feed');
          }}
        />

        {/* Global Toast Alert Notifications */}
        <ToastContainer />

        {/* Consent-Based Privacy Cookie Banner */}
        <CookieBanner />
      </div>
    </ErrorBoundary>
  );
};
export default App;
