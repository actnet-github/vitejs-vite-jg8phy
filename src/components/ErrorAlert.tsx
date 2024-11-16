interface ErrorAlertProps {
  message: string;
  onClose: () => void;
}

export function ErrorAlert({ message, onClose }: ErrorAlertProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 flex items-center shadow-lg">
      <span className="mr-2">{message}</span>
      <button
        onClick={onClose}
        className="text-red-700 font-bold hover:text-red-800"
      >
        ×
      </button>
    </div>
  );
}