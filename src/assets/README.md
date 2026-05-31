# Assets Folder

Place your brand images here. Replace the Unsplash placeholder URLs in the code with local imports.

## Folder Structure

```
assets/
├── hero/           — Hero banner images
├── categories/     — Category section images (tote, clutch, crossbody)
├── brand/          — Logo, og-image, about page photos
└── README.md
```

## Images Currently Used (Unsplash placeholders to replace)

| Location | Current URL | Replace With |
|----------|-------------|--------------|
| Hero.tsx | photo-1548036657-3f744421b203 | hero/hero-banner.jpg |
| Home.tsx (Carryall) | photo-1590156221122-c4465ce28920 | categories/carryall.jpg |
| Home.tsx (Clutches) | photo-1598533023411-ca4e1d2d6afa | categories/clutches.jpg |
| Home.tsx (Crossbody) | photo-1566150905458-1bf1fd111c91 | categories/crossbody.jpg |
| Home.tsx (Artisan) | photo-1547949003-9792a18a2601 | brand/artisan.jpg |

## How to Use

```tsx
import heroBanner from '../assets/hero/hero-banner.jpg';
// Then use: <img src={heroBanner} />
```
