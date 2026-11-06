# AWKN® — sito statico

Ricostruzione statica del sito [theawkn.com](https://theawkn.com) (AWKN® Korean Apothecary). Layout, tipografia e colori arrivano dal tema Shopify Broadcast (`theme.css` e fogli di sezione). I testi e le foto sono quelli del sito live, salvati in locale.

Non è un clone pixel-perfect al 100%: carrello, checkout, ricerca e iscrizione alla newsletter restano sul sito originale. I pulsanti **Add to Cart** aprono la pagina prodotto su theawkn.com.

## Pagine

| File | Contenuto |
| --- | --- |
| `index.html` | Homepage: hero, press, Night Owl, benefici, recensioni, ingredienti, founder, qualità |
| `shop.html` | Shop / collezione |
| `product.html` | Night Owl 10x |
| `product-30.html` | Night Owl 30x |
| `product-4.html` | Night Owl 4x |
| `product-90.html` | Bundle 3×30 |
| `our-story.html` | Our Story |
| `ingredients.html` | Science / Ingredients |
| `faq.html` | FAQ |
| `contact.html` | Contatti |

## GitHub Pages

1. Apri il repository su GitHub → **Settings** → **Pages**.
2. In **Build and deployment**, scegli **Deploy from a branch**.
3. Branch: `main` (dopo il merge) e cartella **`/ (root)`**.
4. Salva.

Il file `.nojekyll` è già presente, così Pages pubblica anche le cartelle che iniziano con un punto e non passa i file da Jekyll.

L’indirizzo sarà simile a `https://<utente>.github.io/<repository>/`.

In locale:

```bash
python3 -m http.server 8765
```

Poi apri `http://127.0.0.1:8765/`.

## Struttura

- `assets/` — CSS del tema Broadcast più `static.css` / `static.js` (menu mobile, caroselli senza lo JavaScript di Shopify)
- `images/` — foto prodotto, hero, founder e icone
- `scripts/build_static.py` — rigenera le pagine a partire dall’HTML pubblico di theawkn.com
