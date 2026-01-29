import React from 'react';
import { Article } from '../types';
import ScrollReveal from './ScrollReveal';
// import { jsPDF } from 'jspdf'; // PDF generation disabled for deadline

interface ArticleDetailProps {
  article: Article;
  articleNumber?: number;
  onBack: () => void;
  onSubscribeClick: () => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, articleNumber, onBack, onSubscribeClick }) => {
  
  // PDF generation disabled for deadline
  /* const generateWhitePaper = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 72; // 1 inch (72pt) margins on all sides
    const contentWidth = pageWidth - (margin * 2);
    const bodyFontSize = 12; // Standard 12pt body text
    const headerFontSize = 16; // Standard 16pt headers
    const lineSpacing = 14.4; // 12pt * 1.2 line height
    const textBottomLimit = pageHeight - 80; // Text stops 80pt from bottom
    const footerY = pageHeight - 40; // Footer at 40pt from bottom

    // --- Helper to fetch image and convert to Base64 ---
    const getImageDataUrl = async (url: string): Promise<{ data: string, format: string } | null> => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
             const data = reader.result as string;
             let format = 'JPEG';
             if (data.startsWith('data:image/png')) format = 'PNG';
             else if (data.startsWith('data:image/webp')) format = 'WEBP';
             resolve({ data, format });
          };
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn("Could not fetch image for PDF", e);
        return null;
      }
    };

    // Pre-fetch image data
    let imgResult: { data: string, format: string } | null = null;
    if (article.imageUrl) {
        imgResult = await getImageDataUrl(article.imageUrl);
    }

    // Helper function to add footer to every page (fixed at bottom)
    const addFooter = () => {
      const footerLineY = footerY - 6;
      
      // Draw separator line
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.3);
      doc.line(margin, footerLineY, pageWidth - margin, footerLineY);
      
      // Brand and copyright
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text("AI IN SOCIETY", margin, footerY);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      const year = new Date().getFullYear();
      const copyright = `© ${year} AI in Society. All rights reserved.`;
      doc.text(copyright, pageWidth - margin, footerY, { align: 'right' });
    };

    // Simple Y-coordinate system: check if we need a new page
    const needsNewPage = (requiredHeight: number): boolean => {
      return yPos + requiredHeight > textBottomLimit;
    };

    const startNewPage = () => {
      addFooter();
      doc.addPage();
      doc.setFillColor(18, 18, 18);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      yPos = margin;
    };

    // --- PAGE 1: COVER PAGE (Dark Mode) ---
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    let yPos = margin + 20;

    // Category Label (Top Center) - RED COLOR
    const categoryLabel = (article.articleType || "ARTICLE").toUpperCase();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38);
    doc.text(categoryLabel, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // Article Number (If available)
    if (articleNumber) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`ARTICLE #${articleNumber}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 12;
    }

    // Separator Line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 30, yPos, pageWidth / 2 + 30, yPos);
    yPos += 20;
    
    // Main Title (Centered)
    yPos = pageHeight / 2 - 30;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    const titleLines = doc.splitTextToSize(article.title.toUpperCase(), contentWidth);
    doc.text(titleLines, pageWidth / 2, yPos, { align: 'center' });
    yPos += (titleLines.length * 14) + 20;

    // Metadata (Centered below title)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(200, 200, 200);
    doc.text(`By ${article.author}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFontSize(10);
    doc.text(`${article.date}  |  ${article.readTime}`, pageWidth / 2, yPos, { align: 'center' });
    
    // Add footer to cover page
    addFooter();


    // --- CONTENT PAGES (Dark Mode) ---
    doc.addPage();
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    yPos = margin;

    // Add Featured Image if available
    if (imgResult) {
        try {
            const imgProps = doc.getImageProperties(imgResult.data);
            const ratio = imgProps.width / imgProps.height;
            let imgHeight = contentWidth / ratio;
            
            // Scale to fit page width, limit to reasonable height
            const maxHeight = (textBottomLimit - margin) * 0.4;
            if (imgHeight > maxHeight) {
                imgHeight = maxHeight;
            }

            // Check if image fits (with 12pt margins)
            if (needsNewPage(imgHeight + 24)) {
                startNewPage();
            }

            yPos += 12; // 12pt margin above
            doc.addImage(imgResult.data, imgResult.format, margin, yPos, contentWidth, imgHeight);
            yPos += imgHeight + 12; // 12pt margin below
        } catch (e) {
            console.error("Error adding image to PDF", e);
        }
    }

    // Body Text Content - Use real article content from WordPress
    let bodyText = '';
    
    if (article.content) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = article.content;
      bodyText = tempDiv.textContent || tempDiv.innerText || '';
      bodyText = bodyText.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
    } else if (article.summary) {
      bodyText = article.summary;
    } else {
      bodyText = 'Content not available.';
    }
    
    // Split into paragraphs
    const paragraphs = bodyText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    paragraphs.forEach(para => {
        const trimmedPara = para.trim();
        if (!trimmedPara) return;
        
        // Detect headers (all caps, short, or specific patterns)
        const isHeader = trimmedPara.length < 100 && (
          trimmedPara === trimmedPara.toUpperCase() ||
          trimmedPara.match(/^(THE|A|AN|CHAPTER|SECTION|PART)\s/i)
        );
    
        // Set font and size
        if (isHeader) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(headerFontSize);
            doc.setTextColor(255, 255, 255);
        } else {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(bodyFontSize);
            doc.setTextColor(230, 230, 230);
        }
        
        // Let jsPDF handle text wrapping automatically
        const lines = doc.splitTextToSize(trimmedPara, contentWidth);
        const singleLineHeight = isHeader ? headerFontSize * 1.2 : lineSpacing;
        const paragraphHeight = lines.length * singleLineHeight;
        
        // Only start new page if remaining space is less than a single line
        if (needsNewPage(paragraphHeight + (isHeader ? 16 : 12))) {
            startNewPage();
        }
        
        // Add spacing before paragraph
        if (isHeader) {
            yPos += 12;
        } else {
            yPos += 6;
        }
        
        // Add text - jsPDF already wrapped it with splitTextToSize
        lines.forEach((line: string) => {
          doc.text(line, margin, yPos);
          yPos += singleLineHeight;
        });
        
        // Add spacing after paragraph
        yPos += isHeader ? 12 : 6;
    });

    // Add footer to final page
    addFooter();

    doc.save(`${article.title.substring(0, 20).replace(/\s+/g, '_')}_${categoryLabel}.pdf`);
  }; */

  // Social Sharing Handlers
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out "${article.title}" on AI in Society`;
  
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(article.title)}`,
    instagram: `https://instagram.com` 
  };

  const SocialButton: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void; href?: string; color: string }> = ({ icon, label, onClick, href, color }) => (
    <a 
      href={href} 
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:-translate-y-1 hover:shadow-lg ${color}`}
      title={label}
    >
      {icon}
    </a>
  );

  // Render article content from WordPress API
  const renderArticleContent = () => {
    return (
      <>
        {/* Display full article content from WordPress with HTML formatting preserved */}
        {/* Science Magazine Typography: Source Serif Pro with academic journal styling */}
        {article.content ? (
          <div 
            className="article-content mb-8 first-letter:text-5xl first-letter:font-bold first-letter:text-white first-letter:mr-3 first-letter:float-left max-w-none
              font-serif text-[1.125rem] lg:text-[21px] leading-[1.8] text-gray-300
              [&>p]:mb-8 [&>p]:space-y-6
              [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-white [&>h1]:mt-12 [&>h1]:mb-6 [&>h1]:font-orbitron
              [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-10 [&>h2]:mb-5 [&>h2]:font-orbitron
              [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-white [&>h3]:mt-8 [&>h3]:mb-4 [&>h3]:font-orbitron
              [&>figure]:my-8 [&>figure]:mx-auto [&>figure]:w-full
              [&>img]:my-8 [&>img]:mx-auto [&>img]:rounded-sm [&>img]:w-full
              [&>ul]:mb-8 [&>ul]:space-y-2 [&>ul]:list-disc [&>ul]:list-inside
              [&>ol]:mb-8 [&>ol]:space-y-2 [&>ol]:list-decimal [&>ol]:list-inside
              [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:my-8 [&>blockquote]:italic"
            style={{ fontFamily: "'Source Serif Pro', 'Georgia', 'Times New Roman', serif" }}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : (
          // Fallback to summary if content is not available
          article.summary && (
            <p className="mb-8 first-letter:text-5xl first-letter:font-bold first-letter:text-white first-letter:mr-3 first-letter:float-left">
              {article.summary}
            </p>
          )
        )}
        
        {/* Embedded Subscribe CTA - Modeled after Science Magazine's Career strip */}
        <div className="my-10 bg-gray-100 text-black border-l-8 border-[#dc2626] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg rounded-r-sm">
          <div className="flex-grow">
            <h4 className="font-bold text-xl md:text-2xl uppercase tracking-tight mb-2 font-sans text-gray-900">
              WANT TO STAY INFORMED?
            </h4>
            <p className="text-gray-700 font-sans text-sm md:text-base">
              Subscribe to instantly get notified when our new articles on societal impacts of AI are out.
            </p>
          </div>
          <button 
            onClick={onSubscribeClick}
            className="whitespace-nowrap bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold uppercase tracking-wider py-3 px-8 text-sm transition-all flex items-center group"
          >
            JOIN OUR COMMUNITY 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] font-sans pb-20 animate-in fade-in duration-500">
      
      {/* Breadcrumb / Back Navigation */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6">
        <button 
          onClick={onBack}
          className="text-xs text-blue-400 hover:text-white uppercase tracking-widest font-bold flex items-center transition-colors mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Articles
        </button>
      </div>

      {/* Header Info */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 mb-8">
        <div className="flex gap-2 mb-4">
          <span className="text-blue-500 font-bold uppercase tracking-widest text-xs border border-blue-900/50 px-2 py-1 rounded bg-blue-900/10">
            {article.category}
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-orbitron font-bold text-white leading-tight mb-6">
          {article.title}
        </h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between border-t border-gray-800 pt-4 gap-4">
          <div className="flex flex-wrap items-center text-sm text-gray-400 font-mono gap-4">
            <span className="text-white font-bold">{article.author}</span>
            <span className="text-gray-600">|</span>
            <span>{article.date}</span>
            <span className="text-gray-600">|</span>
            <span>{article.readTime}</span>
          </div>
          
          {/* Social Sharing Buttons */}
          <div className="flex items-center gap-2">
            <SocialButton 
              label="Share on Facebook" 
              color="bg-[#1877F2] hover:bg-[#1559b3]" 
              href={shareLinks.facebook}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>} 
            />
            <SocialButton 
              label="Share on X" 
              color="bg-black border border-gray-700 hover:border-white" 
              href={shareLinks.twitter}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>} 
            />
             <SocialButton 
              label="Share on LinkedIn" 
              color="bg-[#0077b5] hover:bg-[#005e93]" 
              href={shareLinks.linkedin}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>} 
            />
             <SocialButton 
              label="Share on Reddit" 
              color="bg-[#ff4500] hover:bg-[#e03d00]" 
              href={shareLinks.reddit}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>} 
            />
            {/* PDF Download Button - Disabled for deadline */}
            {/* <SocialButton 
              label="Download Article PDF" 
              color="bg-white text-black hover:bg-gray-200" 
              onClick={generateWhitePaper}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>} 
            /> */}
          </div>
        </div>
      </div>

      {/* Full Width Image (No Margin) */}
      <div className="w-full h-[50vh] md:h-[65vh] relative mb-12 overflow-hidden bg-gray-900">
        <img 
          src={article.imageUrl || "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=2072"} 
          alt={article.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60"></div>
      </div>

      {/* Main Content */}
      <article className="max-w-5xl mx-auto px-4 sm:px-8">
        <div className="text-gray-300 font-mono text-base md:text-lg leading-relaxed md:leading-loose">
          {renderArticleContent()}
        </div>

        {/* Tags Section */}
        {article.tags && article.tags.length > 0 && (
          <ScrollReveal>
            <div className="mt-16 pt-8 border-t border-gray-800">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                Related Topics
              </h4>
              <div className="flex flex-wrap gap-3">
                {article.tags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="text-xs bg-[#1a1a1a] text-blue-300 border border-gray-800 px-3 py-1.5 rounded hover:border-blue-500 cursor-pointer transition-colors font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

      </article>
    </div>
  );
};

export default ArticleDetail;