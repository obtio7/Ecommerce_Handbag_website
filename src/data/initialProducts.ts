/**
 * Legacy initial products data.
 * The seed script now uses inline variant-based product data.
 * This file is kept for backward compatibility but is no longer used for seeding.
 */
export const INITIAL_PRODUCTS = [
  {
    id: 'bag-1',
    name: 'Bordeaux Structured Tote',
    description: 'A sophisticated daily companion in premium calfskin leather. Features a structured silhouette with multiple internal compartments for optimal organization.',
    price: 3200,
    category: 'Tote',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3',
    stock: 5,
    featured: true
  },
  {
    id: 'bag-2',
    name: 'Elysian Gold Clutch',
    description: 'An exquisite evening clutch intricately embroidered with silk and gold thread. Finished with a delicate detachable chain strap.',
    price: 1850,
    category: 'Clutch',
    imageUrl: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c',
    stock: 3,
    featured: true
  },
  {
    id: 'bag-3',
    name: 'Teal Minimalist Crossbody',
    description: 'Vibrant and versatile for any urban adventure. This sleek design features silver hardware and an adjustable strap for maximum comfort.',
    price: 1250,
    category: 'Crossbody',
    imageUrl: 'https://images.unsplash.com/photo-1591561954557-26941169b49e',
    stock: 10,
    featured: true
  },
  {
    id: 'bag-4',
    name: 'Artisan Travel Satchel',
    description: 'Durable heavyweight canvas with hand-finished leather trim. The perfect companion for week-long journeys and weekend escapes.',
    price: 2600,
    category: 'Satchel',
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7',
    stock: 7,
    featured: true
  }
];
