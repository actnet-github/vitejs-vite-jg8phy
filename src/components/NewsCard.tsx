import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface NewsCardProps {
  title: string;
  content: string;
  publishDate: string;
  endDate?: string | null;
  onClick: () => void;
}

export function NewsCard({ title, content, publishDate, endDate, onClick }: NewsCardProps) {
  const formatDate = (date: string) => {
    return format(new Date(date), 'yyyy年MM月dd日', { locale: ja });
  };

  return (
    <div 
      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{content}</p>
      <div className="text-xs text-gray-500">
        <p>公開日: {formatDate(publishDate)}</p>
        {endDate && <p>終了日: {formatDate(endDate)}</p>}
      </div>
    </div>
  );
}