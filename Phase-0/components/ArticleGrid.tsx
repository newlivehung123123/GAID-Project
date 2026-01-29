import React from 'react';
import { Article } from '../types';
import ScrollReveal from './ScrollReveal';

interface ArticleGridProps {
  articles: Article[];
  onArticleClick?: (article: Article) => void;
}

const ArticleGrid: React.FC<ArticleGridProps> = ({ articles, onArticleClick }) => {
  // Safety check: Ensure articles is an array and not empty
  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 font-mono text-lg">No articles available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
      {articles.map((article, idx) => {
        // Safety check: Ensure article has required fields
        if (!article || !article.title) {
          console.warn('Article missing required fields:', article);
          return null;
        }
        
        return (
        <ScrollReveal key={idx} staggerIndex={idx} className="h-full">
          <article 
            className="flex flex-col group cursor-pointer h-full"
            onClick={() => onArticleClick && onArticleClick(article)}
          >
            <div className="overflow-hidden rounded-sm mb-4 relative">
                 {/* Use featured image from WordPress API, fallback to placeholder only if no image */}
               <img 
                  src={article.imageUrl || `https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=800&auto=format&fit=crop`} 
                alt={article.title} 
                className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out grayscale group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col flex-grow">
                {/* Category Badge - Conditional Styling matching FELLOWSHIP badge aesthetic */}
                <div className="mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest border px-1.5 py-0.5 rounded ${
                    article.category === 'Perspective' 
                      ? 'text-blue-700 border-blue-900/50 bg-blue-200/30' // Soft blue background with dark blue text
                      : article.category === 'Analysis'
                      ? 'text-amber-700 border-amber-900/50 bg-amber-200/30' // Soft amber/gold background
                      : article.category === 'Long-read'
                      ? 'text-purple-700 border-purple-900/50 bg-purple-200/30' // Soft purple background
                      : 'text-blue-400 border-blue-900/50 bg-blue-900/10' // Default fallback
                  }`}>
                {article.category}
              </span>
                </div>
              <h3 className="text-xl font-orbitron font-bold text-gray-100 mb-3 group-hover:text-blue-400 transition-colors leading-snug">
                  {article.title || 'Untitled Article'}
              </h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                {article.summary}
              </p>
              <div className="mt-auto text-xs text-gray-600 font-medium border-t border-gray-800 pt-3 flex items-center">
                <span className="text-gray-500">{article.date}</span>
                <span className="mx-2 text-blue-900">&bull;</span>
                <span>{article.readTime}</span>
              </div>
            </div>
          </article>
        </ScrollReveal>
        );
      })}
    </div>
  );
};

export default ArticleGrid;