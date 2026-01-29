export interface Article {
  title: string;
  summary: string;
  content?: string; // Full post content with HTML formatting
  category: string; // The topic (e.g. Infrastructure, Ethics)
  articleType: 'Perspective' | 'Analysis' | 'Long-read'; // The format/depth
  author: string;
  date: string;
  readTime: string;
  imageUrl?: string;
  tags?: string[];
  views?: number;
  slug?: string; // WordPress post slug for URL matching
}

export interface JobOpportunity {
  id: string;
  role: string;
  company: string;
  location: string;
  region: string;
  type: 'Remote' | 'On-site' | 'Hybrid';
  category: 'Full-time' | 'Part-time' | 'Fellowship' | 'Funding' | 'Internship' | 'Training' | 'Volunteering' | 'Others';
  posted: string;
  description: string;
  url: string;
}

export interface Book {
  title: string;
  author: string;
  description: string;
  coverColor: string;
  rating?: number;
  reviewCount?: number;
  price?: string;
  rank?: number;
  amazonUrl?: string;
  asin: string;
  imageUrl?: string;
}

export interface BooksPageData {
  bestSellers: Book[];
  topRated: Book[];
}

export interface DashboardData {
  heroArticle: Article;
  featuredArticles: Article[];
  opportunities: JobOpportunity[];
  mustReadBooks: Book[];
}
