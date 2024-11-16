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
export class TokenManager {
  private static readonly TOKEN_KEY = 'grant_token';
  private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  // トークンの保存（Cookie と localStorage の両方に保存）
  static saveToken(token: string, expiresSeconds: number): void {
    const expiresAt = Date.now() + expiresSeconds * 1000;

    // Cookieに保存
    const expires = new Date(expiresAt).toUTCString();
    document.cookie = `${
      this.TOKEN_KEY
    }=${token}; expires=${expires}; ${Object.entries(COOKIE_OPTIONS)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')}`;

    // LocalStorageにバックアップとして保存
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiresAt.toString());
    } catch (error) {
      console.warn('LocalStorage is not available:', error);
    }
  }

  // トークンの取得（Cookie を優先し、失敗時は localStorage をフォールバックとして使用）
  static getToken(): TokenInfo | null {
    const cookieToken = this.getTokenFromCookie();
    if (cookieToken) {
      return cookieToken;
    }

    return this.getTokenFromLocalStorage();
  }

  // Cookieからトークンを取得
  private static getTokenFromCookie(): TokenInfo | null {
    try {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${this.TOKEN_KEY}=`));

      if (!tokenCookie) {
        return null;
      }

      const token = tokenCookie.split('=')[1];
      if (!token) {
        return null;
      }

      // Cookie の有効期限を取得
      const expires = cookies
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith('expires='));

      const expiresAt = expires
        ? new Date(expires.split('=')[1]).getTime()
        : Date.now() + 24 * 60 * 60 * 1000;

      return { token, expiresAt };
    } catch (error) {
      console.error('Error reading cookie:', error);
      return null;
    }
  }

  // LocalStorageからトークンを取得
  private static getTokenFromLocalStorage(): TokenInfo | null {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const expiresAt = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

      if (!token || !expiresAt) {
        return null;
      }

      const expiryTime = parseInt(expiresAt, 10);
      if (isNaN(expiryTime) || expiryTime < Date.now()) {
        this.clearToken();
        return null;
      }

      return { token, expiresAt: expiryTime };
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  // トークンのクリア
  static clearToken(): void {
    try {
      // Cookie のクリア
      document.cookie = `${this.TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      console.log('Cookie cleared');

      // LocalStorage のクリア
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      console.log('LocalStorage cleared');

    } catch (error) {
      console.warn('Error clearing tokens:', error);
    }
    // 認証状態の変更を通知
    notifyAuthStateChange();
  }

  // トークンの有効性チェック
  static isTokenValid(): boolean {
    const tokenInfo = this.getToken();
    if (!tokenInfo) {
      return false;
    }

    return tokenInfo.expiresAt > Date.now();
  }

  static clearAllStorages(): void {
    this.clearToken();

    // セッションストレージをクリア
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear sessionStorage:', e);
    }

    // 追加のストレージをクリア
    try {
      // アプリケーション固有の他のストレージをクリア
      localStorage.removeItem('user_settings');
      localStorage.removeItem('cached_data');
      // 必要に応じて他のキーも追加
    } catch (e) {
      console.warn('Failed to clear additional storage:', e);
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
  console.log('Sending login request to:', url);
  console.log('Sending login request to:', url);

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
          const errorMessage = data.error?.message || data.errors?.[0]?.message || `ログインに失敗しました。Status: ${response.status}`;
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
