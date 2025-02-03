import { API_ENDPOINTS } from '@/config/apiConfig';

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    role: string;
    is_active: number;
    last_login: string | null;
    created_at: string;
    updated_at: string;
  };
}

export interface SignupResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    role: string;
    is_active: number;
    created_at: string;
    updated_at: string;
  };
}

export interface AuthError {
  message: string;
  error?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ValidateTokenResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    username: string;
  };
}

// Helper to check if we're on the server
const isServer = () => typeof window === 'undefined';

// Safe local storage operations
const safeLocalStorage = {
  getItem(key: string): string | null {
    if (isServer()) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('[LOG auth] ========= Error accessing localStorage:', e);
      return null;
    }
  },

  setItem(key: string, value: string): void {
    if (isServer()) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('[LOG auth] ========= Error setting localStorage:', e);
    }
  },

  removeItem(key: string): void {
    if (isServer()) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('[LOG auth] ========= Error removing from localStorage:', e);
    }
  }
};

const readResponseBody = async (response: Response): Promise<any> => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (e) {
      return null;
    }
  }

  try {
    return await response.text();
  } catch (e) {
    return null;
  }
};

const toAuthError = (input: unknown, fallbackMessage: string, statusText?: string): Error => {
  if (input instanceof Error) return input;

  if (typeof input === 'string') {
    return new Error(input || fallbackMessage);
  }

  if (input && typeof input === 'object') {
    const msg = (input as any).message;
    const err = (input as any).error;

    if (typeof msg === 'string' && msg.trim()) {
      const generic = msg === 'Error during login' || msg === 'Error during signup' || msg === 'Authentication error';
      if (generic && typeof err === 'string' && err.trim()) {
        return new Error(err);
      }

      return new Error(msg);
    }

    if (typeof err === 'string' && err.trim()) {
      return new Error(err);
    }
  }

  if (input && typeof input === 'object' && 'errors' in input) {
    const errs = (input as any).errors;
    if (Array.isArray(errs) && errs.length > 0) {
      return new Error(errs[0]);
    }
  }

  if (statusText) {
    return new Error(statusText);
  }

  return new Error(fallbackMessage);
};

export const authService = {
  async signup(payload: SignupPayload): Promise<SignupResponse> {
    try {
      if (isServer()) {
        throw new Error('Cannot sign up on server side');
      }

      const response = await fetch(API_ENDPOINTS.AUTH.SIGNUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await readResponseBody(response);

      if (!response.ok) {
        throw toAuthError(data, `Signup failed (${response.status})`);
      }

      // Store token in localStorage for future requests
      if (data.token) {
        safeLocalStorage.setItem('token', data.token);
        safeLocalStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('[LOG auth] ========= Signup error:', error);
      throw toAuthError(error, 'Signup failed');
    }
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    try {
      if (isServer()) {
        throw new Error('Cannot login on server side');
      }

      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await readResponseBody(response);

      if (!response.ok) {
        throw toAuthError(data, `Login failed (${response.status})`);
      }

      // Store token in localStorage for future requests
      if (data.token) {
        safeLocalStorage.setItem('token', data.token);
        safeLocalStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('[LOG auth] ========= Login error:', error);
      throw toAuthError(error, 'Login failed');
    }
  },

  logout() {
    safeLocalStorage.removeItem('token');
    safeLocalStorage.removeItem('user');
    safeLocalStorage.removeItem('chat-list');
    safeLocalStorage.removeItem('topicsExpanded');

    // Also clear session storage just in case anything sensitive is there
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
      } catch (e) {
        console.error('[LOG auth] ========= Error clearing sessionStorage:', e);
      }
    }
  },

  isAuthenticated(): boolean {
    return Boolean(safeLocalStorage.getItem('token'));
  },

  getToken(): string | null {
    return safeLocalStorage.getItem('token');
  },

  getUser(): any {
    const user = safeLocalStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  async updateProfile(payload: { fullName?: string; email?: string; username?: string }): Promise<any> {
    try {
      const token = this.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await readResponseBody(response);
      if (!response.ok) throw toAuthError(data, `Profile update failed (${response.status})`);
      return data;
    } catch (error) {
      console.error('[LOG auth] ========= Update profile error:', error);
      throw toAuthError(error, 'Profile update failed');
    }
  },

  async uploadAvatar(file: File): Promise<any> {
    try {
      const token = this.getToken();
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(API_ENDPOINTS.AUTH.UPLOAD_AVATAR, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // don't set Content-Type so browser sets correct boundary
        },
        body: formData,
      });

      const data = await readResponseBody(response);
      if (!response.ok) throw toAuthError(data, `Avatar upload failed (${response.status})`);
      return data;
    } catch (error) {
      console.error('[LOG auth] ========= Avatar upload error:', error);
      throw toAuthError(error, 'Avatar upload failed');
    }
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
    try {
      if (isServer()) {
        throw new Error('Cannot request password reset on server side');
      }

      const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      return data;
    } catch (error) {
      console.error('[LOG auth] ========= Forgot password error:', error);
      throw error;
    }
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
    try {
      if (isServer()) {
        throw new Error('Cannot reset password on server side');
      }

      const response = await fetch(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      return data;
    } catch (error) {
      console.error('[LOG auth] ========= Reset password error:', error);
      throw error;
    }
  },

  async validateResetToken(token: string): Promise<ValidateTokenResponse> {
    try {
      if (isServer()) {
        throw new Error('Cannot validate token on server side');
      }

      const response = await fetch(API_ENDPOINTS.AUTH.VALIDATE_RESET_TOKEN(token), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      return data;
    } catch (error) {
      console.error('[LOG auth] ========= Validate token error:', error);
      throw error;
    }
  },
}; 