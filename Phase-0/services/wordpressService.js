/**
 * Strips HTML tags from a string
 */
const stripHtml = (html) => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Formats WordPress date to our format
 */
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return dateString;
  }
};

/**
 * Estimates read time based on content length
 */
const estimateReadTime = (content) => {
  const wordsPerMinute = 200;
  const text = stripHtml(content);
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
};

/**
 * Maps WordPress post to our Article format
 */
const mapWordPressPostToArticle = (post) => {
  // Extract featured image
  let imageUrl;
  if (post._embedded?.['wp:featuredmedia']?.[0]) {
    const media = post._embedded['wp:featuredmedia'][0];
    // Try to get large size, fallback to source_url
    imageUrl = media.media_details?.sizes?.large?.source_url || 
               media.media_details?.sizes?.medium?.source_url ||
               media.source_url;
  }

  // Extract author name
  const authorName = post._embedded?.author?.[0]?.name || 'Unknown Author';

  // Extract categories and tags
  const categories = [];
  const tags = [];
  
  if (post._embedded?.['wp:term']) {
    post._embedded['wp:term'].forEach(termGroup => {
      termGroup.forEach(term => {
        if (term.taxonomy === 'category') {
          categories.push(term.name);
        } else if (term.taxonomy === 'post_tag') {
          tags.push(term.name);
        }
      });
    });
  }

  // Use first category as the main category, or default
  const category = categories[0] || 'General';

  // Extract summary from excerpt
  const summary = stripHtml(post.excerpt.rendered);

  // Estimate read time
  const readTime = estimateReadTime(post.content.rendered);

  return {
    title: stripHtml(post.title.rendered),
    summary: summary,
    category: category,
    articleType: category || 'General',
    author: authorName,
    date: formatDate(post.date),
    readTime: readTime,
    imageUrl: imageUrl,
    tags: tags.length > 0 ? tags : undefined,
    views: 0 // WordPress doesn't provide views by default, can be added via plugin
  };
};

/**
 * Fetches articles from WordPress REST API using custom endpoint
 */
export const fetchWordPressArticles = async () => {
  try {
    const apiUrl = '/wp-json/ai-hub/v1/articles';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit',
    });

    if (!response.ok) {
      console.error(`WordPress API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const wpArticles = await response.json();

    console.log('WordPress API response:', wpArticles);

    if (!Array.isArray(wpArticles)) {
      console.error('WordPress API did not return an array:', wpArticles);
      return [];
    }

    if (wpArticles.length === 0) {
      console.warn('WordPress API returned no articles');
      return [];
    }

    // Map WordPress articles to our Article format
    const articles = wpArticles.map((wpArticle) => {
      // Use category from WordPress API, default to 'General' if empty
      const categoryName = (wpArticle.category || 'General').toString().trim();
      
      // Ensure title is a string
      const articleTitle = (wpArticle.title || 'Untitled').toString().trim();
      
      // Clean excerpt - remove &hellip; and handle HTML entities
      let cleanExcerpt = (wpArticle.excerpt || '').toString().trim();
      cleanExcerpt = cleanExcerpt.replace(/&hellip;/g, '...');
      cleanExcerpt = cleanExcerpt.replace(/&nbsp;/g, ' ');
      cleanExcerpt = cleanExcerpt.replace(/&#8217;/g, "'");
      cleanExcerpt = cleanExcerpt.replace(/&#8220;/g, '"');
      cleanExcerpt = cleanExcerpt.replace(/&#8221;/g, '"');
      
        return {
        id: wpArticle.id || undefined, // Add id field for routing
        title: articleTitle, // Use title field directly from API
        summary: cleanExcerpt,
        content: wpArticle.content || undefined, // Full post content with HTML formatting
        category: categoryName || 'General', // Use the category name from API, default to 'General'
        author: wpArticle.author || 'AI in Society', // Use author from API, fallback to site name
        date: (wpArticle.date || '').toString(),
        readTime: wpArticle.readTime || '5 min read', // Use dynamic readTime from API, fallback to default
        imageUrl: wpArticle.featured_image_url || undefined, // Use featured image from API
        tags: undefined,
        views: 0,
        slug: wpArticle.slug || undefined // WordPress post slug
      };
    });

    console.log(`Successfully mapped ${articles.length} articles from WordPress:`, articles);
    console.log('Fetched Articles:', articles);
    return articles;
  } catch (error) {
    console.error('Error fetching WordPress articles:', error);
    return [];
  }
};

/**
 * Fetches a single article by ID from WordPress REST API
 */
export const fetchWordPressArticleById = async (id) => {
  try {
    const apiUrl = `https://aiinsocietyhub.com/wp-json/wp/v2/posts/${id}?_embed`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit',
    });

    if (!response.ok) {
      console.error(`WordPress API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const post = await response.json();
    return mapWordPressPostToArticle(post);
  } catch (error) {
    console.error('Error fetching WordPress article:', error);
    return null;
  }
};
