// src/pages/NewsEdit.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ErrorAlert } from '../components/ErrorAlert';
import { Header } from '../components/Header';
import { getNewsDetails, updateNews } from '../lib/api';

interface NewsEditForm {
  subject: string;
  contents: string;
  open_date: string;
  close_date?: string;
  m_site_id?: string;
}

export default function NewsEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<NewsEditForm>({
    subject: '',
    contents: '',
    open_date: '',
    close_date: '',
    m_site_id: ''
  });

  useEffect(() => {
    const fetchNewsDetails = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await getNewsDetails(parseInt(id));
        console.log('News details:', response);

        setFormData({
          subject: response.details.subject,
          contents: response.details.contents,
          open_date: response.details.open_date,
          close_date: response.details.close_date,
          m_site_id: response.details.m_site_id?.key || ''
        });
      } catch (error) {
        console.error('Error fetching news details:', error);
        setError('ニュースの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewsDetails();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
  
    try {
      setIsSubmitting(true);
      setError(null);
  
      const updateData: NewsUpdateRequest = {
        subject: formData.subject,
        contents: formData.contents,
        open_date: formData.open_date,
        close_date: formData.close_date,
        m_site_id: formData.m_site_id || '',
        validate_only: false,
        approvalflow_id: 0
      };
  
      await updateNews(parseInt(id), updateData);
      console.log('News updated successfully');
      navigate('/news');
    } catch (error) {
      console.error('Error updating news:', error);
      setError(error instanceof Error ? error.message : 'ニュースの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6">ニュースの編集</h1>
            
            {error && (
              <ErrorAlert
                message={error}
                onClose={() => setError(null)}
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  タイトル
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  内容
                </label>
                <textarea
                  value={formData.contents}
                  onChange={(e) => setFormData({...formData, contents: e.target.value})}
                  rows={5}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  公開日
                </label>
                <input
                  type="date"
                  value={formData.open_date}
                  onChange={(e) => setFormData({...formData, open_date: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  終了日
                </label>
                <input
                  type="date"
                  value={formData.close_date || ''}
                  onChange={(e) => setFormData({...formData, close_date: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/news')}
                  disabled={isSubmitting}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '保存中...' : '保存'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}