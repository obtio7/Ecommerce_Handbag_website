import { Router, Request, Response } from 'express';

const router = Router();

// Instagram API configuration
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID || 'me';

// Cache for Instagram posts (to avoid hitting API rate limits)
let cachedPosts: any[] = [];
let lastFetchTime: number = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache

interface InstagramPost {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
}

// Fetch posts from Instagram Basic Display API
async function fetchInstagramPosts(): Promise<InstagramPost[]> {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    console.warn('Instagram Access Token not configured');
    return [];
  }

  // Return cached posts if still valid
  const now = Date.now();
  if (cachedPosts.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedPosts;
  }

  try {
    // Fetch user's media from Instagram Basic Display API
    const fields = 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp';
    const url = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=${fields}&access_token=${INSTAGRAM_ACCESS_TOKEN}&limit=12`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Instagram API error:', error);
      return cachedPosts; // Return stale cache on error
    }

    const data = await response.json();
    cachedPosts = data.data || [];
    lastFetchTime = now;
    
    return cachedPosts;
  } catch (error) {
    console.error('Failed to fetch Instagram posts:', error);
    return cachedPosts; // Return stale cache on error
  }
}

// GET /api/instagram/posts - Get latest Instagram posts
router.get('/posts', async (_req: Request, res: Response) => {
  try {
    const posts = await fetchInstagramPosts();
    
    // Transform posts for frontend
    const transformedPosts = posts.map(post => ({
      id: post.id,
      type: post.media_type.toLowerCase(),
      imageUrl: post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url,
      videoUrl: post.media_type === 'VIDEO' ? post.media_url : undefined,
      permalink: post.permalink,
      caption: post.caption || '',
      timestamp: post.timestamp,
    }));

    res.json({ 
      success: true, 
      posts: transformedPosts,
      cached: (Date.now() - lastFetchTime) < 1000 // Was this from cache?
    });
  } catch (error: any) {
    console.error('Error fetching Instagram posts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch Instagram posts',
      posts: [] 
    });
  }
});

// GET /api/instagram/status - Check if Instagram is configured
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    configured: !!INSTAGRAM_ACCESS_TOKEN,
    username: 'zarevielleofficial'
  });
});

// POST /api/instagram/refresh - Force refresh the cache (admin only)
router.post('/refresh', async (_req: Request, res: Response) => {
  // Clear cache to force refresh
  lastFetchTime = 0;
  cachedPosts = [];
  
  const posts = await fetchInstagramPosts();
  
  res.json({
    success: true,
    message: 'Instagram feed refreshed',
    postCount: posts.length
  });
});

export default router;
