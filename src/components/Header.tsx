// src/components/Header.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { logout } from '../lib/auth';

export const Header = () => {
  const navigate = useNavigate();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting logout process');
      
      await logout();
      console.log('Logout successful, redirecting to login page');
      
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout process failed:', error);
      setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました');
      
      // エラーが発生しても、トークンはクリアされているのでログイン画面に遷移
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000); // エラーメッセージを表示するため少し遅延
    } finally {
      setIsLoading(false);
      setIsLogoutDialogOpen(false);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                ニュース管理システム
              </h1>
            </div>
            <div className="flex items-center">
              <Button 
                variant="secondary"
                onClick={() => setIsLogoutDialogOpen(true)}
                disabled={isLoading}
              >
                {isLoading ? 'ログアウト中...' : 'ログアウト'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <LogoutConfirmDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => {
          setIsLogoutDialogOpen(false);
          setError(null);
        }}
        onConfirm={handleLogout}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
};

// LogoutConfirmDialogコンポーネントも更新
interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  error: string | null;
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  error
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">ログアウトの確認</h2>
        <p className="text-gray-600 mb-6">
          ログアウトしてもよろしいですか？
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            キャンセル
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'ログアウト中...' : 'ログアウト'}
          </Button>
        </div>
      </div>
    </div>
  );
};