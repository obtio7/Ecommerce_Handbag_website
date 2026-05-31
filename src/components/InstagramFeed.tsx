import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Instagram, ExternalLink, Heart, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  permalink: string;
}

interface InstagramFeedProps {
  username?: string;
  className?: string;
}

// Placeholder posts for demo - in production, these would come from Instagram API
const PLACEHOLDER_POSTS: InstagramPost[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop',
    caption: 'The art of simplicity. Our new Carryall in Cognac. #Zarevielle #LeatherGoods',
    likes: 234,
    comments: 18,
    permalink: '#',
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop',
    caption: 'Behind the scenes at our London atelier. Every stitch tells a story.',
    likes: 456,
    comments: 32,
    permalink: '#',
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=400&fit=crop',
    caption: 'Sunset hues. The Minim Clutch in Terracotta.',
    likes: 389,
    comments: 24,
    permalink: '#',
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop',
    caption: 'Crafted for the everyday extraordinary. #ArtisanMade',
    likes: 567,
    comments: 41,
    permalink: '#',
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1566150905458-1bf1fd111c91?w=400&h=400&fit=crop',
    caption: 'The Crossbody Edit. Effortless elegance for every journey.',
    likes: 298,
    comments: 15,
    permalink: '#',
  },
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&h=400&fit=crop',
    caption: 'Details matter. Hand-finished edges on our signature pieces.',
    likes: 412,
    comments: 28,
    permalink: '#',
  },
];

const InstagramFeed: React.FC<InstagramFeedProps> = ({ 
  username = 'zarevielle',
  className 
}) => {
  const [posts, setPosts] = useState<InstagramPost[]>(PLACEHOLDER_POSTS);
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);

  // In production, you would fetch from Instagram Basic Display API
  // useEffect(() => {
  //   const fetchInstagramPosts = async () => {
  //     try {
  //       const response = await fetch(`/api/instagram/feed`);
  //       const data = await response.json();
  //       setPosts(data.posts);
  //     } catch (error) {
  //       console.error('Failed to fetch Instagram posts:', error);
  //     }
  //   };
  //   fetchInstagramPosts();
  // }, []);

  return (
    <section className={cn("py-20", className)}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Instagram size={24} className="text-primary" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">
                @{username}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif tracking-tighter">
              Follow the <span className="italic font-light opacity-60">Journey</span>
            </h2>
          </div>
          <a
            href={`https://instagram.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 text-[10px] uppercase tracking-[0.2em] font-bold border border-primary rounded-full hover:bg-primary hover:text-white transition-all w-fit"
          >
            Follow Us
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {posts.map((post, index) => (
            <motion.a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative aspect-square rounded-[20px] overflow-hidden group cursor-pointer"
              onMouseEnter={() => setHoveredPost(post.id)}
              onMouseLeave={() => setHoveredPost(null)}
            >
              <img
                src={post.imageUrl}
                alt={post.caption}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className={cn(
                "absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 transition-opacity duration-300",
                hoveredPost === post.id ? "opacity-100" : "opacity-0"
              )}>
                <div className="flex items-center gap-6 text-white">
                  <div className="flex items-center gap-2">
                    <Heart size={18} fill="white" />
                    <span className="text-sm font-medium">{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle size={18} fill="white" />
                    <span className="text-sm font-medium">{post.comments}</span>
                  </div>
                </div>
              </div>

              {/* Instagram icon indicator */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Instagram size={20} className="text-white drop-shadow-lg" />
              </div>
            </motion.a>
          ))}
        </div>

        {/* Caption */}
        <p className="text-center text-sm text-black/50 mt-8 font-serif italic">
          Share your Zarevielle moments with #ZarevielleStyle
        </p>
      </div>
    </section>
  );
};

export default InstagramFeed;
