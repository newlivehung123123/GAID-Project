import { GoogleGenAI, Type } from "@google/genai";
import { DashboardData, BooksPageData, Book, Article } from "../types";
import { fetchWordPressArticles } from "./wordpressService";


const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&fm=jpg&fit=crop", 
  "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?q=80&w=800&fm=jpg&fit=crop",
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&fm=jpg&fit=crop",
  "https://images.unsplash.com/photo-1620825937374-87fc7d6bddc2?q=80&w=800&fm=jpg&fit=crop",
  "https://images.unsplash.com/photo-1589254065878-42c9da9e2bc6?q=80&w=800&fm=jpg&fit=crop",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&fm=jpg&fit=crop"
];

const getRandomImage = (seed: string) => {
  const index = seed.length % STOCK_IMAGES.length;
  return STOCK_IMAGES[index];
};

/**
 * Normalizes and enhances Google Books image URL for highest quality
 * Always returns a valid URL string or the original if invalid
 */
const enhanceImageUrl = (imageUrl: string): string => {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return imageUrl || '';
  }
  
  try {
    // Force HTTPS
    let enhanced = imageUrl.replace(/^http:\/\//, 'https://');
    
    // Validate it's a proper URL
    if (!enhanced.startsWith('http://') && !enhanced.startsWith('https://')) {
      return imageUrl; // Return original if not a valid URL
    }
    
    // Try to get highest quality version
    // Google Books uses zoom parameter: zoom=0 (full), zoom=1 (thumbnail), zoom=2 (small), etc.
    // Remove zoom parameter to get default (usually better quality)
    enhanced = enhanced.replace(/[?&]zoom=\d+/, '');
    
    // Prefer large or extraLarge if available, otherwise use what we have
    // If it's a thumbnail URL, try to construct a larger version
    if (enhanced.includes('thumbnail')) {
      // Try to get medium or large version by replacing thumbnail in the path
      enhanced = enhanced.replace('/thumbnail', '/large').replace('/thumbnail', '/medium');
    }
    
    // Ensure we're using the best available size for Google Books
    if (enhanced.includes('books.google.com')) {
      // Keep the URL structure but ensure we have a valid URL
      // Don't break the URL by removing too much
      const urlObj = new URL(enhanced);
      // Remove zoom if present, then add zoom=0 for maximum quality
      urlObj.searchParams.delete('zoom');
      urlObj.searchParams.set('zoom', '0');
      enhanced = urlObj.toString();
    }
    
    // Final validation - ensure we have a valid URL
    if (enhanced && (enhanced.startsWith('http://') || enhanced.startsWith('https://'))) {
      return enhanced;
    }
    
    return imageUrl; // Return original if enhancement failed
  } catch (error) {
    console.warn('Error enhancing image URL:', error);
    return imageUrl; // Return original on error
  }
};

/**
 * Fetches book cover image URL from Google Books API using ISBN/ASIN
 * Falls back to Amazon image service if Google Books doesn't have it
 */
const getBookCoverImage = async (asin: string, title: string, author: string): Promise<string | undefined> => {
  // Skip placeholder ASINs
  if (!asin || asin.startsWith('PLACEHOLDER') || asin.length !== 10) {
    return undefined;
  }

  try {
    // Try Google Books API first (free, no auth required)
    // Convert ASIN to ISBN if needed (ASINs starting with B are Kindle, others are usually ISBN-10)
    const isbn = asin.startsWith('B') ? undefined : asin;
    
    if (isbn) {
      const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`;
      const response = await fetch(googleBooksUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items[0]?.volumeInfo?.imageLinks) {
          const imageLinks = data.items[0].volumeInfo.imageLinks;
          // Prefer extraLarge > large > medium > thumbnail
          const imageUrl = imageLinks.extraLarge || 
                          imageLinks.large || 
                          imageLinks.medium ||
                          imageLinks.thumbnail ||
                          imageLinks.smallThumbnail;
          
          if (imageUrl) {
            return enhanceImageUrl(imageUrl);
          }
        }
      }
    }

    // Fallback 1: Try searching with intitle and inauthor for better match
    const cleanTitle = title.replace(/[^\w\s]/g, '').trim();
    const cleanAuthor = author.split(',')[0].split('&')[0].trim(); // Get first author
    const intitleQuery = `intitle:${encodeURIComponent(cleanTitle)}+inauthor:${encodeURIComponent(cleanAuthor)}`;
    const intitleUrl = `https://www.googleapis.com/books/v1/volumes?q=${intitleQuery}&maxResults=1`;
    
    const intitleResponse = await fetch(intitleUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
    });

    if (intitleResponse.ok) {
      const intitleData = await intitleResponse.json();
      if (intitleData.items && intitleData.items[0]?.volumeInfo?.imageLinks) {
        const imageLinks = intitleData.items[0].volumeInfo.imageLinks;
        const imageUrl = imageLinks.extraLarge || 
                        imageLinks.large || 
                        imageLinks.medium ||
                        imageLinks.thumbnail ||
                        imageLinks.smallThumbnail;
        
        if (imageUrl) {
          return enhanceImageUrl(imageUrl);
        }
      }
    }

    // Fallback 2: Try searching by title and author (general search)
    const searchQuery = encodeURIComponent(`${title} ${author}`);
    const googleBooksSearchUrl = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=1`;
    const searchResponse = await fetch(googleBooksSearchUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.items && searchData.items[0]?.volumeInfo?.imageLinks) {
        const imageLinks = searchData.items[0].volumeInfo.imageLinks;
        const imageUrl = searchData.items[0].volumeInfo.imageLinks.extraLarge || 
                        imageLinks.large || 
                        imageLinks.medium ||
                        imageLinks.thumbnail ||
                        imageLinks.smallThumbnail;
        
        if (imageUrl) {
          return enhanceImageUrl(imageUrl);
        }
      }
    }

    // Fallback 3: Try Open Library API (if we have an ISBN)
    // Open Library format: https://covers.openlibrary.org/b/isbn/[ISBN]-L.jpg
    // Sizes: -S (small), -M (medium), -L (large)
    // Open Library is reliable and doesn't require validation - return URL directly
    if (isbn) {
      // Return large size for best quality
      return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    }

    // Final fallback: Amazon image service (direct ASIN lookup)
    // Try multiple Amazon image sizes for best quality
    // Format: https://images-na.ssl-images-amazon.com/images/P/{ASIN}.{size}.jpg
    // Sizes: 01 (small), 02 (medium), 03 (large), 04 (extra large)
    return `https://images-na.ssl-images-amazon.com/images/P/${asin}.04._SX500_.jpg`;
  } catch (error) {
    console.warn(`Failed to fetch cover image for ${title}:`, error);
    return undefined;
  }
};

/**
 * Adds cover images to an array of books
 * Prioritizes the first 12 books for faster initial load
 */
const enrichBooksWithImages = async (books: Book[]): Promise<Book[]> => {
  // Prioritize first 12 books - fetch them first with smaller batches for reliability
  const priorityBooks = books.slice(0, 12);
  const remainingBooks = books.slice(12);
  
  const enrichedBooks: Book[] = [];
  
  // Process priority books in smaller batches (3 at a time) for better reliability
  const priorityBatchSize = 3;
  for (let i = 0; i < priorityBooks.length; i += priorityBatchSize) {
    const batch = priorityBooks.slice(i, i + priorityBatchSize);
    const enrichedBatch = await Promise.all(
      batch.map(async (book) => {
        // Always try to fetch image if not present or empty
        if (!book.imageUrl || book.imageUrl.trim() === '') {
          const imageUrl = await getBookCoverImage(book.asin, book.title, book.author);
          // Only set imageUrl if we got a valid URL
          if (imageUrl && imageUrl.trim() !== '') {
            return { ...book, imageUrl: imageUrl.trim() };
          }
        }
        // Return book with existing imageUrl or without if fetch failed
        return { ...book, imageUrl: book.imageUrl || undefined };
      })
    );
    enrichedBooks.push(...enrichedBatch);
    
    // Small delay between batches to be respectful to the API
    if (i + priorityBatchSize < priorityBooks.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  // Process remaining books if any (shouldn't happen with 12 limit, but keep for safety)
  if (remainingBooks.length > 0) {
    const batchSize = 5;
    for (let i = 0; i < remainingBooks.length; i += batchSize) {
      const batch = remainingBooks.slice(i, i + batchSize);
      const enrichedBatch = await Promise.all(
        batch.map(async (book) => {
          if (!book.imageUrl || book.imageUrl.trim() === '') {
            const imageUrl = await getBookCoverImage(book.asin, book.title, book.author);
            if (imageUrl && imageUrl.trim() !== '') {
              return { ...book, imageUrl: imageUrl.trim() };
            }
          }
          return { ...book, imageUrl: book.imageUrl || undefined };
        })
      );
      enrichedBooks.push(...enrichedBatch);
      
      if (i + batchSize < remainingBooks.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  return enrichedBooks;
};

const INITIAL_BEST_SELLERS: Book[] = [
  { title: "Superintelligence: Paths, Dangers, Strategies", author: "Nick Bostrom", description: "A seminal work on the potential risks of AGI.", coverColor: "#1B3D7B", rating: 4.5, reviewCount: 3200, price: "$18.99", rank: 1, amazonUrl: "#", asin: "0199678111" },
  { title: "Life 3.0: Being Human in the Age of AI", author: "Max Tegmark", description: "How AI will affect crime, war, justice, jobs, society and our very sense of being human.", coverColor: "#10b981", rating: 4.7, reviewCount: 4500, price: "$16.50", rank: 2, amazonUrl: "#", asin: "1101946598" },
  { title: "The Coming Wave", author: "Mustafa Suleyman", description: "Technology, Power, and the Twenty-first Century's Greatest Dilemma.", coverColor: "#ef4444", rating: 4.6, reviewCount: 1200, price: "$22.00", rank: 3, amazonUrl: "#", asin: "B0BT6Y69QC" },
  { title: "Human Compatible", author: "Stuart Russell", description: "Artificial Intelligence and the Problem of Control.", coverColor: "#f59e0b", rating: 4.6, reviewCount: 1800, price: "$19.99", rank: 4, amazonUrl: "#", asin: "0525558616" },
  { title: "Nexus: A Brief History of Information Networks", author: "Yuval Noah Harari", description: "Looking at how information networks have made and broken our world.", coverColor: "#6366f1", rating: 4.8, reviewCount: 5000, price: "$24.99", rank: 5, amazonUrl: "#", asin: "0062871331" },
  { title: "Co-Intelligence", author: "Ethan Mollick", description: "Living and Working with AI.", coverColor: "#8b5cf6", rating: 4.9, reviewCount: 850, price: "$18.00", rank: 6, amazonUrl: "#", asin: "0593716722" },
  { title: "The Worlds I See", author: "Fei-Fei Li", description: "Curiosity, Exploration, and Discovery at the Dawn of AI.", coverColor: "#ec4899", rating: 4.9, reviewCount: 1100, price: "$21.00", rank: 7, amazonUrl: "#", asin: "1250897880" },
  { title: "AI 2041", author: "Kai-Fu Lee", description: "Ten Visions for Our Future.", coverColor: "#14b8a6", rating: 4.4, reviewCount: 2300, price: "$17.50", rank: 8, amazonUrl: "#", asin: "059323829X" },
  { title: "Prediction Machines", author: "Agrawal et al.", description: "The Simple Economics of Artificial Intelligence.", coverColor: "#f97316", rating: 4.5, reviewCount: 900, price: "$20.00", rank: 9, amazonUrl: "#", asin: "1633695670" },
  { title: "Genius Makers", author: "Cade Metz", description: "The Mavericks Who Brought AI to Google, Facebook, and the World.", coverColor: "#06b6d4", rating: 4.6, reviewCount: 750, price: "$19.00", rank: 10, amazonUrl: "#", asin: "1524742671" },
  { title: "Atlas of AI", author: "Kate Crawford", description: "Power, Politics, and the Planetary Costs of Artificial Intelligence.", coverColor: "#84cc16", rating: 4.3, reviewCount: 600, price: "$25.00", rank: 11, amazonUrl: "#", asin: "0300209574" },
  { title: "Rebooting AI", author: "Gary Marcus", description: "Building Artificial Intelligence We Can Trust.", coverColor: "#a855f7", rating: 4.2, reviewCount: 800, price: "$16.00", rank: 12, amazonUrl: "#", asin: "1524748254" }
];

const INITIAL_TOP_RATED: Book[] = [
  { title: "Deep Learning", author: "Ian Goodfellow", description: "The bible of deep learning.", coverColor: "#6366f1", rating: 4.9, reviewCount: 800, price: "$65.00", amazonUrl: "#", asin: "0262035618" },
  { title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell & Peter Norvig", description: "The standard textbook for AI.", coverColor: "#8b5cf6", rating: 4.8, reviewCount: 2100, price: "$90.00", amazonUrl: "#", asin: "0134610997" },
  { title: "Chip War", author: "Chris Miller", description: "The Fight for the World's Most Critical Technology.", coverColor: "#ec4899", rating: 4.8, reviewCount: 5000, price: "$17.99", amazonUrl: "#", asin: "1982172002" },
  { title: "Scary Smart", author: "Mo Gawdat", description: "The Future of Artificial Intelligence and How You Can Save Our World.", coverColor: "#14b8a6", rating: 4.7, reviewCount: 3000, price: "$15.00", amazonUrl: "#", asin: "1529077651" },
  { title: "Algorithms to Live By", author: "Brian Christian", description: "The Computer Science of Human Decisions.", coverColor: "#f43f5e", rating: 4.7, reviewCount: 4000, price: "$16.00", amazonUrl: "#", asin: "1627790365" },
  { title: "The Master Algorithm", author: "Pedro Domingos", description: "How the Quest for the Ultimate Learning Machine Will Remake Our World.", coverColor: "#eab308", rating: 4.3, reviewCount: 1500, price: "$18.00", amazonUrl: "#", asin: "0465065708" },
  { title: "Machine Learning Yearning", author: "Andrew Ng", description: "Technical strategy for AI engineers.", coverColor: "#3b82f6", rating: 4.8, reviewCount: 2000, price: "$0.00", amazonUrl: "#", asin: "1732265108" },
  { title: "Pattern Recognition and Machine Learning", author: "Christopher Bishop", description: "A comprehensive introduction to the fields of pattern recognition and machine learning.", coverColor: "#ef4444", rating: 4.6, reviewCount: 900, price: "$75.00", amazonUrl: "#", asin: "0387310738" }
];

// Fallback data in case API key is missing or quota is exceeded
// Removed all hard-coded article data - site now strictly relies on live WordPress database
const FALLBACK_DATA: DashboardData = {
  heroArticle: {
    title: "",
    summary: "",
    category: "General",
    articleType: "Analysis",
    author: "",
    date: "",
    readTime: "0 min read",
    views: 0
  },
  featuredArticles: [],
  opportunities: [],
  mustReadBooks: INITIAL_BEST_SELLERS.slice(0, 6)
};

// Fallback books - limited to 12 per category
const FALLBACK_BOOKS: BooksPageData = {
  bestSellers: INITIAL_BEST_SELLERS.slice(0, 12),
  topRated: INITIAL_TOP_RATED.slice(0, 12)
};

export const fetchDashboardContent = async (): Promise<DashboardData> => {
  try {
    // Talk to the new WordPress Dashboard Vault
    const response = await fetch('/wp-json/ai-hub/v1/dashboard');
    if (!response.ok) throw new Error("Dashboard vault empty");
    const data = await response.json();
    
    // Add images to hero article
    if (data.heroArticle && !data.heroArticle.imageUrl) {
        data.heroArticle.imageUrl = getRandomImage(data.heroArticle.title);
    }
    
    // Add images to featured articles
    data.featuredArticles = (data.featuredArticles || []).map((article: Article) => ({
      ...article,
      imageUrl: article.imageUrl || getRandomImage(article.title)
    }));

    // Use static source for books to ensure consistency
    data.mustReadBooks = INITIAL_BEST_SELLERS.slice(0, 6);
    data.mustReadBooks = await enrichBooksWithImages(data.mustReadBooks);

    return data;
  } catch (error) {
    console.error("Dashboard fetch failed", error);
    return FALLBACK_DATA;
  }
};

export const fetchBooksPageContent = async (): Promise<BooksPageData> => {
  try {
    // This line is the "Bridge." It tells the app to fetch from your WordPress 
    // server instead of waiting 60 seconds for a direct Gemini response.
    const response = await fetch('/wp-json/ai-hub/v1/books');
    
    if (!response.ok) throw new Error("Server vault is empty or erroring");
    
    const data = await response.json();

    // We still run image enrichment on the device to keep the covers looking sharp
    data.bestSellers = await enrichBooksWithImages(data.bestSellers || []);
    data.topRated = await enrichBooksWithImages(data.topRated || []);

    return data;
  } catch (error) {
    console.error("Global vault fetch failed, using local fallback", error);
    return FALLBACK_BOOKS; 
  }
};
