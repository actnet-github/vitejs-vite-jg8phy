// src/pages/NewsDashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewsCard } from '../components/NewsCard';
import { NewsDetail } from '../components/NewsDetail';
import { Button } from '../components/ui/Button';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { ErrorAlert } from '../components/ErrorAlert';
import { getNewsList, deleteNews } from '../lib/api';
import { AuthExpiredDialog } from '../components/AuthExpiredDialog';
import { useAuthStatus } from '../hooks';
import { TokenManager } from '../lib/auth';
import { Header } from '../components/Header';
import { NewsApiResponse, NewsItem } from '../types/news';

// データ変換関数
const transformNewsData = (response: NewsApiResponse): NewsItem[] => {
  return response.list.map(item => ({
    id: item.topics_id,
    title: item.subject,
    content: item.contents,
    publishDate: item.open_date,
    endDate: item.close_date,
    createdAt: item.inst_ymdhi,
    updatedAt: item.update_ymdhi,
    siteInfo: item.m_site_id
  }));
};

export default function NewsDashboard() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStatus();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        const response = await getNewsList();
        console.log('API Response:', response); // デバッグ用

        const transformedNews = transformNewsData(response);
        console.log('Transformed news:', transformedNews); // デバッグ用
        
        setNews(transformedNews);
      } catch (error) {
        console.error('Error fetching news:', error);
        if (error instanceof Error) {
          if (error.message === '認証が必要です') {
            setIsAuthDialogOpen(true);
          } else {
            setError('ニュースの取得に失敗しました。');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchNews();
    }
  }, [isAuthenticated]);

  const filteredNews = news.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = () => {
    if (selectedNews) {
      navigate(`/news/edit/${selectedNews.id}`);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedNews) return;
  
    try {
      await deleteNews(selectedNews.id);
      setNews(news.filter(item => item.id !== selectedNews.id));
      setSelectedNews(null);
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error deleting news:', err);
      if (err instanceof Error && 
         (err.message.includes('Unauthorized') || err.message.includes('認証'))) {
        setIsAuthDialogOpen(true);
      } else {
        setError(err instanceof Error ? err.message : 'ニュースの削除に失敗しました');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">新着情報一覧</h1>
              <Button variant="primary" onClick={() => navigate('/news/create')}>
                新規作成
              </Button>
            </div>
            
            <input
              type="text"
              placeholder="検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />

            {isLoading ? (
              <div className="text-center py-4">読み込み中...</div>
            ) : (
              <div className="space-y-4">
                {filteredNews.length > 0 ? (
                  filteredNews.map((item) => (
                    <NewsCard
                      key={item.id}
                      title={item.title}
                      content={item.content}
                      publishDate={item.publishDate}
                      endDate={item.endDate}
                      onClick={() => setSelectedNews(item)}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    表示するニュースがありません
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            {selectedNews ? (
              <NewsDetail
                title={selectedNews.title}
                content={selectedNews.content}
                publishDate={selectedNews.publishDate}
                endDate={selectedNews.endDate}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ) : (
              <p className="text-gray-500 text-center">
                左側のリストからニュースを選択してください
              </p>
            )}
          </div>
        </div>

        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          title={selectedNews?.title ?? ''}
        />

        <AuthExpiredDialog
          isOpen={isAuthDialogOpen}
          onClose={() => setIsAuthDialogOpen(false)}
        />

        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      </div>
    </div>
  );
}