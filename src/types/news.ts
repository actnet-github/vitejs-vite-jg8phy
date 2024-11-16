// src/types/news.ts

// APIレスポンスの型定義
export interface NewsApiResponse {
  list: NewsApiItem[];
  pageInfo: {
    totalCnt: number;
    perPage: number;
    totalPageCnt: number;
    pageNo: number;
  };
  errors: any[];
  messages: any[];
}

export interface NewsApiItem {
  topics_id: number;
  subject: string;
  contents: string;
  ymd: string;
  open_date: string;
  close_date: string;
  inst_ymdhi: string;
  update_ymdhi: string;
  topics_flg: number;
  open_flg: number;
  m_site_id: {
    key?: string;
    label?: string;
  };
}

// 表示用の型定義
export interface NewsItem {
  id: number;
  title: string;
  content: string;
  publishDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  siteInfo?: {
    key?: string;
    label?: string;
  };
}