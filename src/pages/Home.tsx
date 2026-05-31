import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import NewsletterSignup from '../components/NewsletterSignup';
import InstagramFeed from '../components/InstagramFeed';
import { Product, mapApiProduct } from '../types';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await fetch('/api/products?pageSize=8');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const result = await response.json();
        const mapped: Product[] = result.data.map(mapApiProduct);
        // Show featured products first, fallback to first 4
        const featured = mapped.filter(p => p.featured);
        setFeaturedProducts(featured.length > 0 ? featured.slice(0, 4) : mapped.slice(0, 4));
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <div className="space-y-32 pb-32">
      <Hero />
      
      {/* Featured Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-baseline mb-16 px-4">
          <div>
            <h2 className="text-5xl md:text-7xl font-serif tracking-tighter">Archive <span className="italic font-light opacity-60">Essentials</span></h2>
          </div>
          <Link to="/collection" className="text-[10px] uppercase tracking-[0.3em] font-bold border-b border-primary/20 pb-2 hover:text-primary hover:border-primary transition-all">
            Browse All
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="font-serif italic text-xl text-red-500/80">Unable to load products</p>
            <p className="text-sm text-black">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Category Grid - Bento Style */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-[900px]">
          <div className="md:col-span-8 relative group overflow-hidden rounded-[48px] border border-border-tan/30 card-shadow bg-surface">
            <img 
              src="https://images.unsplash.com/photo-1590156221122-c4465ce28920?q=80&w=2576&auto=format&fit=crop" 
              className="w-full h-full object-cover grayscale opacity-60 transition-transform duration-1000 group-hover:scale-110"
              alt="The Carryall Edit"
            />
            <div className="absolute inset-x-0 bottom-0 p-16 text-primary">
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Archive 01</span>
              <h3 className="text-6xl font-serif mb-6 tracking-tighter">The Carryall <br /><span className="italic font-light">Perspective</span></h3>
              <Link to="/collection?category=Tote" className="text-[10px] uppercase tracking-[0.3em] font-bold inline-flex items-center gap-4 hover:gap-6 transition-all">
                Discover the Edit <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          
          <div className="md:col-span-4 flex flex-col gap-8">
            <div className="relative group overflow-hidden rounded-[48px] flex-1 border border-border-tan/30 shadow-sm bg-surface">
              <img 
                src="https://images.unsplash.com/photo-1598533023411-ca4e1d2d6afa?q=80&w=2670&auto=format&fit=crop" 
                className="w-full h-full object-cover grayscale opacity-40 transition-transform duration-1000 group-hover:scale-110"
                alt="Minim Clutches"
              />
              <div className="absolute inset-0 p-10 flex flex-col justify-end text-primary">
                <h3 className="text-3xl font-serif mb-4 tracking-tighter italic">Minim Clutches</h3>
                <Link to="/collection?category=Clutch" className="text-[10px] uppercase tracking-[0.3em] font-bold border-b border-primary/20 w-fit pb-1">Shop Collection</Link>
              </div>
            </div>
            
            <div className="relative group overflow-hidden rounded-[48px] flex-1 border border-border-tan/30 shadow-sm bg-surface">
              <img 
                src="https://images.unsplash.com/photo-1566150905458-1bf1fd111c91?q=80&w=2574&auto=format&fit=crop" 
                className="w-full h-full object-cover grayscale opacity-40 transition-transform duration-1000 group-hover:scale-110"
                alt="The Crossbody"
              />
              <div className="absolute inset-0 p-10 flex flex-col justify-end text-primary">
                <h3 className="text-3xl font-serif mb-4 tracking-tighter">The Crossbody</h3>
                <Link to="/collection?category=Crossbody" className="text-[10px] uppercase tracking-[0.3em] font-bold border-b border-primary/20 w-fit pb-1">Shop Collection</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="bg-primary text-white py-40 mx-4 rounded-[60px] overflow-hidden shadow-2xl">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-32 items-center">
          <motion.div 
             initial={{ opacity: 0, x: -50 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="space-y-12"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/40">Our Ethos</span>
            <h2 className="text-6xl md:text-[100px] font-serif leading-[0.8] tracking-tighter">The <span className="italic font-light">Zarevielle</span> Promise</h2>
            <p className="text-xl text-white/50 leading-relaxed italic font-serif">
              "We operate at the intersection of traditional leathercraft and contemporary ethics. Every piece is a testament to the belief that luxury should not come at the cost of our environment."
            </p>
            <div className="grid grid-cols-2 gap-12 pt-8">
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 border-b border-white/10 pb-4">01. Materials</h4>
                <p className="text-[11px] uppercase tracking-widest leading-loose">Sourced from Gold-certified tanneries in Tuscany.</p>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 border-b border-white/10 pb-4">02. Ethics</h4>
                <p className="text-[11px] uppercase tracking-widest leading-loose">Carbon-neutral production and fair living wages.</p>
              </div>
            </div>
          </motion.div>
          
          <div className="relative group">
            <div className="aspect-square rounded-[80px] overflow-hidden border border-white/10 p-16 group-hover:p-14 transition-all duration-700">
               <div className="w-full h-full rounded-[60px] overflow-hidden grayscale">
                  <img src="https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=2670&auto=format&fit=crop" className="w-full h-full object-cover" alt="Artisan at work" />
               </div>
            </div>
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center p-8 text-center text-white card-shadow rotate-12">
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold">Handmade in London</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="max-w-4xl mx-auto px-4">
        <NewsletterSignup variant="inline" />
      </section>

      {/* Instagram Feed Section */}
      <InstagramFeed username="zarevielle" />
    </div>
  );
};

export default Home;

