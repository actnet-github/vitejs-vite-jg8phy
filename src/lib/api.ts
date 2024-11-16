// api.ts
import { useState, useEffect } from 'react';
import { TokenManager } from './auth';

const API_URL = 'https://qiss-nwes.g.kuroco.app';
const API_BASE_URL = `${API_URL}/rcms-api/1`;

interface ApiError {
  code: string;
  message: string;
}

interface ApiErrorResponse {
  errors: ApiError[];
  status: number;
  'x-rcms-request-id': string;
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

// レスポンス型の定義
interface NewsListResponse {
  list: {
    topics_id: number;
    subject: string;
    contents: string;
    ymd: string;
    open_date: string;
    close_date?: string;
    m_site_id: string;
  }[];
  pageInfo: {
    totalCnt: number;
    perPage: number;
    totalPageCnt: number;
    pageNo: number;
  };
  errors: ApiError[];
  messages: string[];
}

export interface NewsContent {
  subject: string;
  contents: string;
  contents_type: number;
  ymd?: string;
  open_date: string;
  close_date?: string;
  m_site_id?: string;
}

const getHeaders = (): HeadersInit => {
  const tokenInfo = TokenManager.getToken();
  if (!tokenInfo || !TokenManager.isTokenValid()) {
    throw new Error('認証が必要です');
  }

  // デバッグ用
  console.log('Current token info:', tokenInfo);

  return {
    'Accept': '*/*',
    'Content-Type': 'application/json',
    'X-RCMS-API-ACCESS-TOKEN': tokenInfo.token, // ヘッダー名を確認
  };
};

// Cookieから指定された名前の値を取得するヘルパー関数
const getCookie = (name: string): string | null => {
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      console.log(`Found cookie ${key}:`, value); // デバッグ用
      if (key === name) {
        console.log(`Found cookie ${name}:`, value); // デバッグ用
        return value;
      }
    }
    console.log(`Cookie ${name} not found`); // デバッグ用
    return null;
  } catch (error) {
    console.error('Error getting cookie:', error);
    return null;
  }
};

// Cookie設定用のヘルパー関数
const setCookie = (name: string, value: string, expiresSeconds: number) => {
  try {
    const expires = new Date(Date.now() + expiresSeconds * 1000).toUTCString();
    // Cookieの設定を単純化
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
    console.log('Setting cookie with value:', value); // デバッグ用
    console.log('Current cookies:', document.cookie); // デバッグ用
  } catch (error) {
    console.error('Error setting cookie:', error);
    throw error;
  }
};

// トークンの保存と検証
const saveAndVerifyToken = (token: string, expiresSeconds: number): boolean => {
  try {
    console.log('Attempting to save token:', token);
    console.log('Expires in seconds:', expiresSeconds);

    // トークンを保存
    setCookie('grant_token', token, expiresSeconds);

    // 保存されたトークンを確認
    const savedToken = getCookie('grant_token');
    console.log('Verification - Saved token:', savedToken);

    return savedToken;
  } catch (error) {
    console.error('Error saving token:', error);
    return false;
  }
};

export const login = async (
  loginId: string,
  password: string
): Promise<void> => {
  const url = `${API_BASE_URL}/login`;
  console.log('Sending login request to:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-rcms-api-access-token': '',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: loginId,
        password: password,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Login error response:', errorText);
      throw new Error(`ログインに失敗しました。Status: ${response.status}`);
    }

    const data: LoginResponse = await response.json();
    console.log('Login response:', data);

    if (data.errors?.length) {
      throw new Error(`ログインエラー: ${data.errors[0].message}`);
    }

    if (!data.grant_token) {
      throw new Error('認証トークンが見つかりません');
    }

    // トークンの保存と検証
    const expiresSeconds = data.info.validUntil - Math.floor(Date.now() / 1000);
    const isTokenSaved = saveAndVerifyToken(data.grant_token, expiresSeconds);

    if (!isTokenSaved) {
      throw new Error('認証トークンの保存に失敗しました');
    }

    console.log('Login successful - Token saved and verified');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// 認証状態の監視用カスタムフック
export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const isValid = TokenManager.isTokenValid();
      setIsAuthenticated(isValid);
    };

    // 初回チェック
    checkAuth();

    // 定期的な認証状態チェック（オプション）
    const interval = setInterval(checkAuth, 60000); // 1分ごとにチェック

    return () => clearInterval(interval);
  }, []);

  return isAuthenticated;
};
// APIエラーハンドリングの共通関数
const handleApiError = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message === '認証が必要です') {
      TokenManager.clearToken();
      throw new Error('認証が必要です');
    }
    throw error;
  }
  throw new Error('不明なエラーが発生しました');
};

// ニュース一覧取得の修正
export const getNewsList = async (): Promise<NewsListResponse> => {
  try {
    console.log('Fetching news list...');

    // トークンの存在確認
    const tokenInfo = TokenManager.getToken();
    if (!tokenInfo || !TokenManager.isTokenValid()) {
      throw new Error('認証が必要です');
    }

    // URLにクエリパラメータを追加
    const url = new URL(`${API_BASE_URL}/content/list`);
    url.searchParams.append('topics_group_id[]', '7');

    console.log('Request URL:', url.toString());
    console.log('Using token:', tokenInfo.token);

    const headers = new Headers({
      'Accept': '*/*',
      'Content-Type': 'application/json',
      'X-RCMS-API-ACCESS-TOKEN': tokenInfo.token
    });

    const requestOptions: RequestInit = {
      method: 'GET',
      headers: headers,
      credentials: 'include',
    };

    // リクエストの詳細をログ出力
    console.log('Request options:', {
      method: requestOptions.method,
      headers: Object.fromEntries(headers.entries()),
      credentials: requestOptions.credentials
    });

    const response = await fetch(url.toString(), requestOptions);

    // レスポンスの詳細をログ出力
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    // レスポンスの解析
    if (!response.ok) {
      const errorData = responseText ? JSON.parse(responseText) : {};
      
      if (response.status === 401 || response.status === 403) {
        // 認証エラーの場合、トークンをクリアして再ログインを促す
        TokenManager.clearToken();
        throw new Error('認証の有効期限が切れました。再度ログインしてください。');
      }

      throw new Error(
        errorData.errors?.[0]?.message || 
        `ニュース取得に失敗しました。Status: ${response.status}`
      );
    }

    // 正常なレスポンスの処理
    const data: NewsListResponse = JSON.parse(responseText);
    return data;

  } catch (error) {
    console.error('Error fetching news:', error);
    
    if (error instanceof Error && error.message === '認証が必要です') {
      TokenManager.clearToken();
    }
    
    throw error;
  }
};

// 型定義の修正
interface NewsListResponse {
  list: Array<{
    topics_id: number;
    subject: string;
    contents: string;
    ymd: string;
    open_date: string;
    close_date?: string;
    inst_ymdhi: string;
    update_ymdhi: string;
    topics_flg: number;
    open_flg: number;
  }>;
  pageInfo: {
    totalCnt: number;
    perPage: number;
    totalPageCnt: number;
    pageNo: number;
  };
  errors?: Array<{
    message: string;
    code: string;
  }>;
}

// NewsItemの型定義（Dashboardで使用）
export interface NewsItem {
  id: number;
  title: string;
  content: string;
  publishDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  siteInfo?: {
    key?: string;
    label?: string;
  };
}

// レスポンスデータを変換するヘルパー関数
export const transformNewsData = (response: NewsListResponse): NewsItem[] => {
  return response.list.map((item) => ({
    id: item.topics_id,
    title: item.subject,
    content: item.contents,
    publishDate: item.open_date,
    endDate: item.close_date,
    siteInfo: item.m_site_id,
  }));
};

// ニュース作成
export const createNews = async (data: NewsContent) => {
  try {
    console.log('Creating news with data:', data);

    const response = await fetch(`${API_BASE_URL}/content/create`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        ...data,
        topics_group_id: 1,
      }),
    });

    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// レスポンスハンドリング関数の修正
const handleResponse = async <T>(response: Response): Promise<T> => {
  const responseData = await response.text(); // 一旦テキストとして取得

  try {
    const data = JSON.parse(responseData);
    console.log('Response data:', data); // デバッグ用

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        TokenManager.clearToken();
        throw new Error('認証が必要です');
      }

      if (data.errors?.[0]?.message) {
        throw new Error(data.errors[0].message);
      }

      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error parsing response:', responseData);
    throw error;
  }
};

export const deleteNews = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/content/delete/${id}`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const getNewsDetails = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/content/details/${id}`, {
    headers: getHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const updateNews = async (id: number, data: NewsContent) => {
  const response = await fetch(`${API_BASE_URL}/content/update/${id}`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};
