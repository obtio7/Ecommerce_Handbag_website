import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import NewsletterSignup from '../components/NewsletterSignup';
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
    </div>
  );
};

export default Home;

