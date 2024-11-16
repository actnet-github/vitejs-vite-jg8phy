import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (value: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Cookie から認証状態を初期化
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return document.cookie.split('; ').some(row => row.startsWith('grant_token='));
  });

  // Cookie の変更を監視する場合はこちらを使用（オプション）
  useEffect(() => {
    const checkAuthStatus = () => {
      const isAuth = document.cookie
        .split('; ')
        .some(row => row.startsWith('grant_token='));
      if (isAuthenticated !== isAuth) {
        setIsAuthenticated(isAuth);
      }
    };

    // 定期的なチェック（必要な場合）
    const interval = setInterval(checkAuthStatus, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = (value: boolean) => {
    setIsAuthenticated(value);
  };

  const logout = () => {
    // Cookie を削除
    document.cookie = 'grant_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    setIsAuthenticated(false);
  };

  // Provider の値をメモ化してレンダリングを最適化
  const value = {
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}