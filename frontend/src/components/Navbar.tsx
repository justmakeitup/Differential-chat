import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, NotificationItem, resolveMediaUrl } from '../services/api';
import { brandConfig } from '../config/brandConfig';
import {
  Compass,
  Image as ImageIcon,
  Users,
  Shield,
  MessageSquareLock,
  Bell,
  Settings,
  LogOut,
  User as UserIcon,
  PlusSquare,
  Menu,
  X,
  Check
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenComposer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenComposer }) => {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch notifications periodically if logged in
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const res = await api.getNotifications();
        setNotifications(res.notifications);
        setUnreadCount(res.unread_count);
      } catch {
        // ignore
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 25000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const navLinks = [
    { label: 'Discover', path: '/discover', icon: Compass },
    { label: 'Exhibition', path: '/feed', icon: ImageIcon },
    { label: 'Connections', path: '/connections', icon: Users },
    { label: 'Encrypted P2P', path: '/chat', icon: MessageSquareLock, badge: 'E2EE' }
  ];

  return (
    <>
      <header
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)' }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 dark:bg-obsidian-950/85 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shadow-md dark:shadow-2xl py-3'
            : 'bg-white/70 dark:bg-transparent backdrop-blur-sm dark:backdrop-blur-none border-b border-slate-200/60 dark:border-white/5 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 sm:gap-3 group text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded-lg p-0.5 shrink-0"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/30 border border-gold-500/40 dark:from-obsidian-800 dark:to-obsidian-900 dark:border-gold-500/30 flex items-center justify-center shadow-gold-glow group-hover:border-gold-500 transition-all shrink-0">
              <span className="font-serif font-bold text-gold-600 dark:text-gold-400 text-base sm:text-lg tracking-wider">D</span>
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-electric-500 dark:bg-electric-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="font-serif text-base sm:text-lg font-semibold tracking-wider text-slate-900 group-hover:text-gold-600 dark:text-white dark:group-hover:text-gold-200 transition-colors block truncate">
                {brandConfig.name}
              </span>
              <span className="hidden sm:block text-[10px] uppercase font-mono tracking-widest text-slate-500 dark:text-slate-400">
                Zero-Knowledge Network
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 p-1 bg-slate-100/90 dark:bg-obsidian-900/60 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => onNavigate(link.path)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold dark:bg-obsidian-800 dark:text-white dark:border-white/10 dark:shadow-inner-glow'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-gold-600 dark:text-gold-400' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-electric-500/15 text-electric-700 border border-electric-500/30 dark:bg-electric-500/20 dark:text-electric-300">
                        {link.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {user ? (
              <>
                {/* Publish Image CTA */}
                {onOpenComposer && (
                  <button
                    onClick={onOpenComposer}
                    className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 shadow-gold-glow transition-all cursor-pointer"
                  >
                    <PlusSquare className="w-4 h-4" />
                    <span>Publish Image</span>
                  </button>
                )}

                {/* Theme Mode Toggle (Desktop only - mobile uses Appearance in drawer/settings) */}
                <ThemeToggle className="hidden md:inline-flex" />

                {/* Notifications Bell */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setProfileDropdownOpen(false);
                    }}
                    aria-label={`Notifications, ${unreadCount} unread`}
                    className="relative p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm dark:bg-obsidian-900/80 dark:hover:bg-obsidian-800 dark:border-white/10 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-electric-500 text-[10px] font-bold text-white shadow-electric-glow">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl dark:bg-obsidian-900/95 dark:text-white dark:border-white/10 backdrop-blur-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                        <span className="font-serif text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300 flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Check className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                      </div>

                      <div className="mt-3 max-h-80 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-center py-6 text-xs text-slate-500 dark:text-editorial-subtle">
                            Sanctuary is quiet. No new notifications.
                          </p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-2.5 rounded-xl border text-xs transition-colors flex items-start gap-2.5 ${
                                !n.is_read
                                  ? 'bg-electric-50 border-electric-200 text-slate-900 dark:bg-electric-500/10 dark:border-electric-500/30 dark:text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-obsidian-800/50 dark:border-white/5 dark:text-slate-300'
                              }`}
                            >
                              <img
                                src={resolveMediaUrl(n.actor?.avatar_url) || brandConfig.sampleImages.defaultAvatar}
                                alt={n.actor?.full_name || 'Member'}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = brandConfig.sampleImages.defaultAvatar;
                                }}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-white/10 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="leading-snug">{n.message}</p>
                                <span className="text-[10px] text-slate-500 dark:text-editorial-muted font-mono mt-1 block">
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(!profileDropdownOpen);
                      setNotificationsOpen(false);
                    }}
                    aria-label="Profile menu"
                    className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 shadow-sm dark:bg-obsidian-900/80 dark:hover:bg-obsidian-800 dark:border-white/10 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
                  >
                    <img
                      src={resolveMediaUrl(user.avatar_url) || brandConfig.sampleImages.defaultAvatar}
                      alt={user.full_name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = brandConfig.sampleImages.defaultAvatar;
                      }}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-gold-500/40 shrink-0 aspect-square min-w-[32px] min-h-[32px]"
                    />
                    <span className="hidden sm:block text-xs font-semibold text-slate-900 dark:text-slate-200 pr-2 max-w-[100px] truncate">
                      {user.full_name.split(' ')[0]}
                    </span>
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl dark:bg-obsidian-900/95 dark:text-white dark:border-white/10 backdrop-blur-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-3 border-b border-slate-200 dark:border-white/10">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.full_name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-editorial-subtle font-mono truncate">@{user.username}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-300 uppercase font-semibold">
                            Zero-Knowledge Active
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onNavigate(`/profile/${user.username}`);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                        >
                          <UserIcon className="w-4 h-4 text-gold-500 dark:text-gold-400" />
                          <span>My Portfolio & Gallery</span>
                        </button>
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onNavigate('/settings');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-electric-600 dark:text-electric-400" />
                          <span>Privacy & Cryptography</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-slate-200 dark:border-white/10">
                        <button
                          onClick={async () => {
                            setProfileDropdownOpen(false);
                            await logout();
                            onNavigate('/');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Terminate Session</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                  className="md:hidden p-2 rounded-xl bg-obsidian-900 border border-white/10 text-slate-300 hover:text-white cursor-pointer shrink-0"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              /* Guest Navigation */
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <ThemeToggle className="hidden md:inline-flex" />
                <button
                  onClick={() => onNavigate('/login')}
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('/signup')}
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 shadow-gold-glow transition-all cursor-pointer whitespace-nowrap"
                >
                  <span className="inline sm:hidden">Join</span>
                  <span className="hidden sm:inline">Request Access</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden fixed inset-0 top-[65px] z-30 bg-obsidian-950/95 backdrop-blur-2xl p-6 border-b border-white/10 animate-in fade-in duration-200">
          <div className="space-y-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate(link.path);
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-obsidian-800 text-white border border-gold-500/30'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-gold-400' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-electric-500/20 text-electric-300 border border-electric-500/30">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {onOpenComposer && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenComposer();
                }}
                className="w-full flex items-center justify-center gap-2 p-3.5 mt-4 rounded-xl text-sm font-semibold bg-gold-500 text-obsidian-950 shadow-gold-glow cursor-pointer"
              >
                <PlusSquare className="w-5 h-5" />
                <span>Publish Image Post</span>
              </button>
            )}

            <div className="pt-3 mt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300">Appearance Mode</span>
              <ThemeToggle showLabel />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sticky Bar for rapid navigation */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-obsidian-950/90 backdrop-blur-xl border-t border-white/10 px-4 py-2 flex items-center justify-around">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className={`flex flex-col items-center gap-1 p-1 text-[10px] transition-colors ${
                  isActive ? 'text-gold-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};
