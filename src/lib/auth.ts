const API_URL = 'https://qiss-nwes.g.kuroco.app';
const API_BASE_URL = `${API_URL}/rcms-api/1`;

interface LoginRequest {
  email: string;
  password: string;
  login_save: number;  // 固定で0
}

interface ApiError {
  code: string;
  message: string;
}

interface LoginResponse {
  grant_token: string;
  status: number;
  member_id: number;
  info: {
    validUntil: number;
  };
  messages: string[];
  errors: ApiError[];
}

interface LogoutResponse {
  status: number;
  messages: string[];
  errors: ApiError[];
}

// src/lib/auth.ts
import { notifyAuthStateChange } from '../hooks/useAuth';

// auth.ts
interface TokenInfo {
  token: string;
  expiresAt: number;
}

// セキュアなCookie設定のためのオプション
const COOKIE_OPTIONS = {
  path: '/',
  secure: true, // HTTPS環境でのみCookieを送信
  sameSite: 'strict' as const,
};

// トークン管理のためのユーティリティクラス
interface TokenInfo {
  token: string;
  expiresAt: number;
}

export class TokenManager {
  private static readonly TOKEN_KEY = 'grant_token';
  private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  static saveToken(token: string, expiresSeconds: number): void {
    try {
      const expiresAt = Date.now() + expiresSeconds * 1000;
      
      // Cookieに保存
      const expires = new Date(expiresAt).toUTCString();
      document.cookie = `${this.TOKEN_KEY}=${token}; expires=${expires}; path=/`;
      console.log('Token saved to cookie:', token, 'expires:', expires);

      // LocalStorageにも保存
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiresAt.toString());
      console.log('Token saved to localStorage', { token, expiresAt });

    } catch (error) {
      console.error('Error saving token:', error);
      throw new Error('トークンの保存に失敗しました');
    }
  }

  static getToken(): TokenInfo | null {
    try {
      // Cookieからトークンを取得
      const token = this.getTokenFromCookie();
      console.log('Token from cookie:', token);

      if (!token) {
        console.log('No token found in cookie');
        return null;
      }

      // LocalStorageから有効期限を取得
      const expiresAt = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      console.log('Expiry from localStorage:', expiresAt);

      if (!expiresAt) {
        // 有効期限が見つからない場合は24時間として設定
        const newExpiresAt = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, newExpiresAt.toString());
        console.log('Set new expiry:', newExpiresAt);
        return { token, expiresAt: newExpiresAt };
      }

      return {
        token,
        expiresAt: parseInt(expiresAt, 10)
      };

    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  private static getTokenFromCookie(): string | null {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith(`${this.TOKEN_KEY}=`));

    if (tokenCookie) {
      const token = tokenCookie.split('=')[1];
      console.log('Found token in cookie:', token);
      return token;
    }

    return null;
  }

  static isTokenValid(): boolean {
    try {
      const tokenInfo = this.getToken();
      console.log('Checking token validity:', tokenInfo);

      if (!tokenInfo || !tokenInfo.token) {
        console.log('No token found');
        return false;
      }

      const now = Date.now();
      const isValid = tokenInfo.expiresAt > now;

      console.log('Token validity check:', {
        now: new Date(now).toISOString(),
        expiresAt: new Date(tokenInfo.expiresAt).toISOString(),
        isValid
      });

      return isValid;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  }

  static clearToken(): void {
    try {
      // Cookie から削除
      document.cookie = `${this.TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      
      // LocalStorage から削除
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      
      console.log('Token cleared successfully');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }
}

// API関連の修正されたヘッダー生成関数
export const getHeaders = (): Headers => {
  const tokenInfo = TokenManager.getToken();
  if (!tokenInfo || !TokenManager.isTokenValid()) {
    throw new Error('認証が必要です');
  }

  return new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-rcms-api-access-token': tokenInfo.token,
    Authorization: `Bearer ${tokenInfo.token}`,
  });
};

// ログイン関数の修正
export const login = async (loginId: string, password: string): Promise<void> => {
  const url = `${API_BASE_URL}/login`;
  console.log('Sending login request to:', url);
  console.log('Sending login request2 to:', url);
  console.log('Sending login request3 to:', url);

  try {
    const loginData: LoginRequest = {
      email: loginId,
      password: password,
      login_save: 0
    };

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',  // Swaggerの設定に合わせる
      },
      credentials: 'include',
      mode: 'cors',      // CORSモードを明示的に指定
      body: JSON.stringify(loginData),
    };

    // リクエストの詳細をログ出力（パスワードは除く）
    console.log('Login request:', {
      url,
      method: requestOptions.method,
      headers: requestOptions.headers,
      body: { email: loginId, login_save: 0 }
    });

    const response = await fetch(url, requestOptions);

    // レスポンスの詳細をログ出力
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    // 空のレスポンスでなければJSONとしてパース
    if (responseText) {
      try {
        const data = JSON.parse(responseText);
        
        if (!response.ok) {
          const errorMessage = data.error?.message || data.errors?.[0]?.message || `ログインに失敗しました。。Status: ${response.status}`;
          throw new Error(errorMessage);
        }

        if (data.grant_token) {
          const expiresSeconds = data.info?.validUntil 
            ? data.info.validUntil - Math.floor(Date.now() / 1000)
            : 24 * 60 * 60;

          TokenManager.saveToken(data.grant_token, expiresSeconds);
          console.log('Login successful, token saved');
          return;
        }
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('サーバーからの応答を解析できませんでした');
      }
    }

    // 成功レスポンスが期待した形式でない場合
    throw new Error('Invalid response format from server');

    if (data.grant_token) {
      const expiresSeconds = data.info?.validUntil 
        ? data.info.validUntil - Math.floor(Date.now() / 1000)
        : 24 * 60 * 60;

      TokenManager.saveToken(data.grant_token, expiresSeconds);
      console.log('Login successful, token saved');
      
      // 認証状態の変更を通知
      window.dispatchEvent(new Event('authStateChanged'));
    }

  } catch (error) {
    console.error('Login process failed:', error);
    throw error;
  }
};

export interface LogoutResponse {
  status: number;
  messages: string[];
  errors: ApiError[];
}

// ログアウト機能
export const logout = async (): Promise<void> => {
  const url = `${API_BASE_URL}/logout`;
  
  try {
    console.log('Sending logout request to:', url);
    const tokenInfo = TokenManager.getToken();
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-RCMS-API-ACCESS-TOKEN': tokenInfo?.token || '', // トークンが無い場合は空文字
    };

    const requestOptions = {
      method: 'POST',
      headers: headers,
      credentials: 'include' as const,
    };
    
    console.log('Logout request options:', {
      url,
      method: requestOptions.method,
      headers: requestOptions.headers,
    });

    const response = await fetch(url, requestOptions);

    // レスポンスの詳細をログ出力
    console.log('Logout response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    // レスポンスが200以外の場合はエラーとして扱う
    if (!response.ok) {
      let errorMessage = `ログアウトに失敗しました。Status: ${response.status}`;
      
      try {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.errors?.[0]?.message) {
              errorMessage = errorData.errors[0].message;
            }
          } catch (e) {
            console.warn('Failed to parse error response as JSON:', e);
          }
        }
      } catch (e) {
        console.warn('Failed to read error response:', e);
      }
      
      throw new Error(errorMessage);
    }

    // レスポンスが空でもOKとして扱う
    let data: LogoutResponse | null = null;
    try {
      const responseText = await response.text();
      if (responseText) {
        data = JSON.parse(responseText);
      }
    } catch (e) {
      console.warn('No response body or invalid JSON:', e);
    }

    // データがあり、エラーが含まれている場合のみエラーとして扱う
    if (data?.errors?.length) {
      throw new Error(`ログアウトエラー: ${data.errors[0].message}`);
    }

    console.log('Logout successful');

  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  } finally {
    // トークンをクリア
    TokenManager.clearToken();
    console.log('Token cleared after logout');
    
    // セッションストレージもクリア
    try {
      sessionStorage.clear();
      console.log('Session storage cleared');
    } catch (e) {
      console.warn('Failed to clear sessionStorage:', e);
    }
  }
};
