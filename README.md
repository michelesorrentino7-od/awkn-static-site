# AWKN®

A modern static rebuild of the AWKN Korean Apothecary site. The pages are [Astro](https://astro.build) components. The published files at the root are the build, so GitHub Pages can serve them directly.

Orders and checkout stay on [theawkn.com](https://theawkn.com). This version has no cart.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `shop.html` | Shop |
| `product-4.html` | Night Owl 4 shots |
| `product.html` | Night Owl 10 shots |
| `product-30.html` | Night Owl 30 shots |
| `product-90.html` | 3 × 30 bundle |
| `our-story.html` | Founders |
| `ingredients.html` | Science |
| `faq.html` | FAQ |
| `contact.html` | Contact |

The previous Shopify-theme copy is in `legacy/`.

## Develop

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:4321/`.

```bash
npm run build
```

That writes `dist/` and copies the pages back to the repository root, next to `images/`.

## GitHub Pages

Pages is already set to this repository, folder `/`. After a build is committed on the branch Pages publishes, the site is:

https://michelesorrentino7-od.github.io/awkn-static-site/
