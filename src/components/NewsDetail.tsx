import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Button } from './ui/Button';

interface NewsDetailProps {
  title: string;
  content: string;
  publishDate: string;
  endDate?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function NewsDetail({ 
  title, 
  content, 
  publishDate, 
  endDate, 
  onEdit, 
  onDelete 
}: NewsDetailProps) {
  const formatDate = (date: string) => {
    return format(new Date(date), 'yyyy年MM月dd日', { locale: ja });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="text-sm text-gray-500 space-y-1">
        <p>公開日: {formatDate(publishDate)}</p>
        {endDate && <p>終了日: {formatDate(endDate)}</p>}
      </div>
      <p className="whitespace-pre-wrap">{content}</p>
      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-4">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              編集
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" onClick={onDelete}>
              削除
            </Button>
          )}
        </div>
      )}
    </div>
  );
}