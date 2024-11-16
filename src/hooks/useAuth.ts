// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { TokenManager } from '../lib/auth';

export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const isValid = TokenManager.isTokenValid();
    console.log('Initial auth check:', isValid);
    return isValid;
  });

  const checkAuth = useCallback(() => {
    const isValid = TokenManager.isTokenValid();
    console.log('Auth status check:', isValid);
    setIsAuthenticated(isValid);
  }, []);

  useEffect(() => {
    // 初回チェック
    checkAuth();

    // トークンの有効期限をチェックする間隔（ミリ秒）
    const interval = setInterval(checkAuth, 60000); // 1分ごとにチェック

    // カスタムイベントの定義と監視
    const handleAuthChange = () => {
      console.log('Auth state change detected');
      checkAuth();
    };
    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, [checkAuth]);

  return isAuthenticated;
};

// 認証状態変更を通知する関数
export const notifyAuthStateChange = () => {
  window.dispatchEvent(new Event('authStateChanged'));
};