export interface NewsItem {
  id: number;
  title: string;
  content: string;
  publishDate: string;
  endDate: string | null;
  isDeleted: boolean;
}

export interface CreateNewsData {
  title: string;
  content: string;
  publishDate: string;
  endDate?: string;
}