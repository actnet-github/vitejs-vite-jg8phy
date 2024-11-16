import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/Button';

interface AuthExpiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthExpiredDialog({ isOpen, onClose }: AuthExpiredDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  const handleConfirm = () => {
    onClose();
    // 現在のページ情報を保存してログインページに遷移
    navigate('/login', {
      replace: true,
      state: { from: location },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">認証期限切れ</h2>
          <p className="text-gray-600">
            セッションの有効期限が切れました。 再度ログインしてください。
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleConfirm}>ログイン画面へ</Button>
        </div>
      </div>
    </div>
  );
}
