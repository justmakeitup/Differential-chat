/**
 * DIFFERENTIAL TYPED API CLIENT
 * 
 * Central HTTP client interacting with the Python Flask backend.
 * Authentication is carried only in a secure HTTP-only cookie. JavaScript never receives it.
 */

export interface User {
  id: string;
  username: string;
  email?: string;
  full_name: string;
  headline: string;
  bio: string;
  location: string;
  avatar_url: string;
  banner_url: string;
  privacy_mode: 'public' | 'connections_only' | 'incognito';
  is_verified: boolean;
  onboarding_completed: boolean;
  interests: string[];
  posts_count?: number;
  e2ee_public_key: string;
  created_at: string;
  connection_status?: 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'blocked';
  connection_id?: string | null;
  is_restricted?: boolean;
  is_owner?: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    is_verified: boolean;
  };
  image_url: string;
  thumbnail_url: string;
  caption: string;
  alt_text: string;
  aspect_ratio: string;
  privacy_level: 'public' | 'connections_only';
  likes_count: number;
  comments_count: number;
  has_liked: boolean;
  created_at: string;
  comments?: PostComment[];
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    is_verified: boolean;
  };
  content: string;
  created_at: string;
}

export interface ConnectionItem {
  connection_id: string;
  peer: User;
  since: string;
}

export interface ConnectionRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  note: string;
  requester?: User;
  addressee?: User;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  actor_id: string;
  actor: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  type: 'connection_request' | 'connection_accepted' | 'post_like' | 'post_comment';
  entity_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SystemConfig {
  brand_name: string;
  tagline: string;
  business_contact: {
    company_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    concierge_email: string;
  };
  analytics_id: string;
  privacy_framework: string;
  storage_policy: string;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Configurable API base url (especially for native Android Capacitor pointing to Flask backend)
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('aetheris_api_host');
    if (custom) return custom.replace(/\/$/, '');
    
    // Check environment variable (set on Vercel deployment)
    if (import.meta.env.VITE_API_URL) {
      return (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');
    }

    // In Capacitor native Android environment, window.location.origin is https://localhost
    // If running on device or emulator, backend can be configured or defaulted
    if (window.location.protocol === 'https:' && window.location.hostname === 'localhost' && window.location.port === '') {
      // Capacitor android WebView default origin
      return 'http://10.0.2.2:5000'; // Standard Android emulator localhost host
    }
  }
  return '';
};

export const setCustomApiHost = (host: string) => {
  if (typeof window !== 'undefined') {
    if (host) {
      localStorage.setItem('aetheris_api_host', host);
    } else {
      localStorage.removeItem('aetheris_api_host');
    }
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('aetheris_token');
  }
  return null;
};

export const setAuthToken = (token: string | null) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('aetheris_token', token);
    } else {
      localStorage.removeItem('aetheris_token');
    }
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Authorization Bearer token if present (crucial for native mobile platforms)
  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  // Add 4-second timeout to avoid long app stalls when server is unreachable
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      signal: options.signal || controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = 'An unexpected network error occurred.';
      try {
        const errData = await response.json();
        errorMsg = errData.error || errData.message || errorMsg;
      } catch {
        // response was not JSON
      }
      throw new ApiError(errorMsg, response.status);
    }

    return response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError('Network connection timed out. Please check backend server URL in Settings.', 408);
    }
    throw err;
  }
}

export const api = {
  // Auth
  register: async (data: { email: string; username: string; full_name: string; password: string }) => {
    const res = await request<{ user: User; token?: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  login: async (data: { identifier: string; password: string }) => {
    const res = await request<{ user: User; token?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  logout: async () => {
    try {
      const res = await request<{ message: string }>('/api/auth/logout', { method: 'POST' });
      setAuthToken(null);
      return res;
    } catch (e) {
      setAuthToken(null);
      throw e;
    }
  },

  getMe: () =>
    request<{ user: User }>('/api/auth/me'),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: (token: string, new_password: string) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password })
    }),

  changePassword: (data: { current_password: string; new_password: string }) =>
    request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Users & Profiles
  discoverUsers: (params?: { q?: string; tag?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.tag) qs.set('tag', params.tag);
    if (params?.page) qs.set('page', params.page.toString());
    if (params?.limit) qs.set('limit', params.limit.toString());
    return request<{ users: User[]; total: number; pages: number; current_page: number }>(`/api/users/discover?${qs}`);
  },

  getUserProfile: (username: string) =>
    request<{ profile: User & { posts: Post[] } }>(`/api/users/${username}`),

  updateProfile: (data: Partial<User>) =>
    request<{ user: User }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return request<{ avatar_url: string; thumbnail_url: string }>('/api/users/avatar', {
      method: 'POST',
      body: form
    });
  },

  getSessions: () =>
    request<{ sessions: Array<{ id: string; ip_address: string; user_agent: string; last_active: string }> }>('/api/users/sessions'),

  revokeSession: (id: string) =>
    request<{ message: string }>(`/api/users/sessions/${id}`, { method: 'DELETE' }),

  deleteAccount: () =>
    request<{ message: string }>('/api/users/account', { method: 'DELETE' }),

  // Posts (Strictly image-only!)
  getFeed: (type: 'discover' | 'connections' = 'discover', page: number = 1) =>
    request<{ posts: Post[]; total: number; pages: number; current_page: number }>(`/api/posts/feed?type=${type}&page=${page}`),

  getPost: (id: string) =>
    request<{ post: Post }>(`/api/posts/${id}`),

  createPost: (data: { image: File; alt_text: string; caption?: string; privacy_level?: string }) => {
    const form = new FormData();
    form.append('image', data.image);
    form.append('alt_text', data.alt_text);
    if (data.caption) form.append('caption', data.caption);
    if (data.privacy_level) form.append('privacy_level', data.privacy_level);
    return request<{ message: string; post: Post }>('/api/posts', {
      method: 'POST',
      body: form
    });
  },

  deletePost: (id: string) =>
    request<{ message: string }>(`/api/posts/${id}`, { method: 'DELETE' }),

  toggleLike: (id: string) =>
    request<{ liked: boolean; likes_count: number }>(`/api/posts/${id}/like`, { method: 'POST' }),

  addComment: (postId: string, content: string) =>
    request<{ message: string; comment: PostComment }>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    }),

  deleteComment: (postId: string, commentId: string) =>
    request<{ message: string }>(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }),

  // Connections
  getConnections: () =>
    request<{ active: ConnectionItem[]; received: ConnectionRequest[]; sent: ConnectionRequest[] }>('/api/connections'),

  sendConnectionRequest: (target_user_id: string, note?: string) =>
    request<{ message: string; connection: any }>('/api/connections/request', {
      method: 'POST',
      body: JSON.stringify({ target_user_id, note })
    }),

  acceptConnection: (connection_id: string) =>
    request<{ message: string }>(`/api/connections/${connection_id}/accept`, { method: 'POST' }),

  declineConnection: (connection_id: string) =>
    request<{ message: string }>(`/api/connections/${connection_id}/decline`, { method: 'POST' }),

  removeConnection: (connection_id: string) =>
    request<{ message: string }>(`/api/connections/${connection_id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () =>
    request<{ notifications: NotificationItem[]; unread_count: number }>('/api/notifications'),

  markAllNotificationsRead: () =>
    request<{ message: string }>('/api/notifications/read-all', { method: 'POST' }),

  markOneNotificationRead: (id: string) =>
    request<{ message: string }>(`/api/notifications/${id}/read`, { method: 'POST' }),

  // System Config
  getSystemConfig: () =>
    request<SystemConfig>('/api/system/config'),

  getHealth: () =>
    request<{ status: string; database: string }>('/api/system/health')
};
