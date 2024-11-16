import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { createNews } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { AuthExpiredDialog } from '../components/AuthExpiredDialog';

export default function NewsCreatePage() {
  const [subject, setSubject] = useState('');
  const [contents, setContents] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [error, setError] = useState('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleAuthExpired = () => {
    setError(''); // エラーメッセージをクリア
    setShowAuthDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // フォーム送信時にエラーをクリア

    if (!isAuthenticated) {
      handleAuthExpired();
      return;
    }

    try {
      await createNews({
        subject,
        contents,
        contents_type: 15,
        topics_flg: 1,
        open_flg: 1,
        ymd: getCurrentDate(),
        open_date: openDate,
        close_date: closeDate || undefined,
        m_site_id: "",
        regular_flg: 0,
        dispatch_github_workflow: 0
      });
      
      navigate('/news');
    } catch (err) {
      console.error('Error details:', err);
      
      // 認証エラーの場合
      if (err instanceof Error && 
         (err.message.toLowerCase().includes('unauthorized') || 
          err.message.includes('認証') ||
          err.message.includes('認証が必要です'))) {
        handleAuthExpired();
        return;
      }
      
      // その他のエラーの場合
      setError(err instanceof Error ? err.message : 'ニュースの作成に失敗しました。');
    }
  };

  const handleCloseAuthDialog = () => {
    setShowAuthDialog(false);
  };

  return (
    <>
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">新着情報の作成</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* フォームの内容は変更なし */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                タイトル
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="contents" className="block text-sm font-medium text-gray-700">
                内容
              </label>
              <textarea
                id="contents"
                value={contents}
                onChange={(e) => setContents(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={6}
                required
              />
            </div>
            <div>
              <label htmlFor="openDate" className="block text-sm font-medium text-gray-700">
                公開日
              </label>
              <input
                id="openDate"
                type="date"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="closeDate" className="block text-sm font-medium text-gray-700">
                公開終了日（任意）
              </label>
              <input
                id="closeDate"
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/news')}
              >
                キャンセル
              </Button>
              <Button type="submit">
                作成
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* 認証切れダイアログ */}
      <AuthExpiredDialog 
        isOpen={showAuthDialog}
        onClose={handleCloseAuthDialog}
      />
    </>
  );
}