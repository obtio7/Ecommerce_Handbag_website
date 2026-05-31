import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Instagram, ExternalLink } from 'lucide-react';
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

// ============================================================
// 📸 INSTAGRAM POSTS - ADD YOUR POSTS HERE
// ============================================================
// To add a new post:
// 1. Copy the image URL from your Instagram post
// 2. Copy the post link (e.g., https://www.instagram.com/p/ABC123/)
// 3. Add a new entry below
// ============================================================

const INSTAGRAM_POSTS: InstagramPost[] = [
  // ---------------------------------------------------------------
  // 📸 POST 1 - Replace imageUrl and permalink with your own
  // ---------------------------------------------------------------
  {
    id: '1',
    imageUrl: 'https://www.instagram.com/p/DU_6Z4fCDss/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
    caption: 'Not just a bag.',
    likes: 10,
    comments: 0,
    permalink: 'https://instagram.com/zarevielleofficial',
  },
  // ---------------------------------------------------------------
  // 📸 POST 2
  // ---------------------------------------------------------------
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop',
    caption: 'Behind the scenes',
    likes: 0,
    comments: 0,
    permalink: 'https://instagram.com/zarevielleofficial',
  },
  // ---------------------------------------------------------------
  // 📸 POST 3
  // ---------------------------------------------------------------
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=400&fit=crop',
    caption: 'Sunset hues',
    likes: 0,
    comments: 0,
    permalink: 'https://instagram.com/zarevielleofficial',
  },
  // ---------------------------------------------------------------
  // 📸 POST 4
  // ---------------------------------------------------------------
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop',
    caption: 'Crafted for the everyday',
    likes: 0,
    comments: 0,
    permalink: 'https://instagram.com/zarevielleofficial',
  },
  // ---------------------------------------------------------------
  // 📸 POST 5
  // ---------------------------------------------------------------
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1566150905458-1bf1fd111c91?w=400&h=400&fit=crop',
    caption: 'The Crossbody Edit',
    likes: 0,
    comments: 0,
    permalink: 'https://instagram.com/zarevielleofficial',
  },
  // ---------------------------------------------------------------
  // 📸 POST 6
  // ---------------------------------------------------------------
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&h=400&fit=crop',
    caption: 'Details matter',
    likes: 0,
    comments: 0,
    permalink: 'https://instagram.com/zarevielleofficial',
  },
];

// Filter out empty posts (ones without imageUrl)
const getValidPosts = () => INSTAGRAM_POSTS.filter(post => post.imageUrl.trim() !== '');

const InstagramFeed: React.FC<InstagramFeedProps> = ({ 
  username = 'zarevielleofficial',
  className 
}) => {
  const posts = getValidPosts();
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);

  // Don't render if no posts are configured
  if (posts.length === 0) {
    return null;
  }

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
                <Instagram size={28} className="text-white" />
                <span className="text-white text-xs font-medium">View on Instagram</span>
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
