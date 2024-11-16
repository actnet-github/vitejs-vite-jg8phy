// src/components/LogoutConfirmDialog.tsx
interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">ログアウトの確認</h2>
        <p className="text-gray-600 mb-6">
          ログアウトしてもよろしいですか？
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            キャンセル
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
          >
            ログアウト
          </Button>
        </div>
      </div>
    </div>
  );
};
