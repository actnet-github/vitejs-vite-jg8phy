// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { TokenManager } from '../lib/auth';

export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => TokenManager.isTokenValid());

  const checkAuth = useCallback(() => {
    const isValid = TokenManager.isTokenValid();
    setIsAuthenticated(isValid);
    return isValid;
  }, []);

  useEffect(() => {
    // 初回チェック
    checkAuth();

    // トークンの有効期限をチェックする間隔（ミリ秒）
    const interval = setInterval(checkAuth, 60000); // 1分ごとにチェック

    // イベントリスナーの設定
    const handleStorageChange = () => {
      checkAuth();
    };

    // localStorage の変更を監視
    window.addEventListener('storage', handleStorageChange);

    // カスタムイベントの定義と監視
    const handleAuthChange = () => {
      checkAuth();
    };
    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, [checkAuth]);

  return isAuthenticated;
};

// 認証状態変更を通知する関数
export const notifyAuthStateChange = () => {
  window.dispatchEvent(new Event('authStateChanged'));
};