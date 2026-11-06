#!/usr/bin/env python3
"""Build a static AWKN site from the live Shopify theme HTML.

The local crawlee-awkn scrape was not available in this environment, so the
pages are captured from https://theawkn.com and rewritten to use the original
Broadcast theme CSS, with images saved under images/.
"""

from __future__ import annotations

import hashlib
import os
import re
import ssl
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup, NavigableString

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path("/tmp/awkn-live/pages")
ASSET_DIR = ROOT / "assets"
IMAGE_DIR = ROOT / "images"
UA = "Mozilla/5.0 (compatible; AWKNStatic/1.0)"
ORIGIN = "https://theawkn.com"

PAGES = [
    ("index.html", f"{ORIGIN}/", "home"),
    ("shop.html", f"{ORIGIN}/collections/korean-alcohol-recovery-all-products-awkn", "collection"),
    ("product.html", f"{ORIGIN}/products/night-owl-alcohol-recovery-10-shots", "product"),
    ("product-30.html", f"{ORIGIN}/products/night-owl-alcohol-recovery-30-shots", "product"),
    ("product-4.html", f"{ORIGIN}/products/night-owl-alcohol-recovery-4-shots", "product"),
    ("product-90.html", f"{ORIGIN}/products/night-owl-alcohol-recovery-90-shots", "product"),
    ("our-story.html", f"{ORIGIN}/pages/our-story", "page"),
    ("ingredients.html", f"{ORIGIN}/pages/our-ingredients", "page"),
    ("contact.html", f"{ORIGIN}/pages/contact", "page"),
    ("faq.html", f"{ORIGIN}/pages/faqs", "page"),
]

EXACT_LINKS = {
    "/": "index.html",
    "/collections/korean-alcohol-recovery-all-products-awkn": "shop.html",
    "/products/night-owl-alcohol-recovery-10-shots": "product.html",
    "/products/night-owl-alcohol-recovery-30-shots": "product-30.html",
    "/products/night-owl-alcohol-recovery-4-shots": "product-4.html",
    "/products/night-owl-alcohol-recovery-90-shots": "product-90.html",
    "/pages/our-story": "our-story.html",
    "/pages/our-ingredients": "ingredients.html",
    "/pages/contact": "contact.html",
    "/pages/faqs": "faq.html",
}

CSS_KEEP = {
    "theme.css",
    "footer.css",
    "columns.css",
    "custom-content.css",
    "tabs.css",
    "newsletter.css",
    "search.css",
    "predictive-search.css",
    "header-search-popdown.css",
    "header-dropdown.css",
    "free-shipping.css",
    "swatches.css",
    "awkn-seal-subscriptions.css",
}

CTX = ssl.create_default_context()


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, context=CTX, timeout=60) as response:
        return response.read()


def ensure_page(name: str, url: str) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    dest = CACHE / name
    if not dest.exists() or dest.stat().st_size < 1000:
        print(f"fetch {url}")
        dest.write_bytes(fetch(url))
    return dest


def abs_url(value: str) -> str:
    if not value:
        return ""
    value = value.strip()
    if value.startswith("//"):
        return "https:" + value
    if value.startswith("/"):
        return ORIGIN + value
    return value


def local_href(href: str) -> str:
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
        return href
    raw = href
    if raw.startswith(ORIGIN):
        raw = raw[len(ORIGIN) :] or "/"
    if raw.startswith("//"):
        return "https:" + href
    if not raw.startswith("/"):
        return href
    path = raw.split("?")[0].split("#")[0]
    anchor = ""
    if "#" in raw:
        anchor = "#" + raw.split("#", 1)[1].split("?")[0]
    if path in EXACT_LINKS:
        return EXACT_LINKS[path] + anchor
    if path == "":
        return "index.html"
    return ORIGIN + raw


def clean_title(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    text = text.replace("–", "–")
    return text


def rewrite_links(soup: BeautifulSoup) -> None:
    for tag in soup.find_all(["a", "form"]):
        if tag.get("data-keep-external"):
            continue
        attr = "href" if tag.name == "a" else "action"
        value = tag.get(attr)
        if not value:
            continue
        tag[attr] = local_href(value)


def product_target(form, fallback: str) -> str:
    link = form.select_one("a[href*='/products/']")
    if link and link.get("href"):
        return abs_url(link["href"])
    node = form
    for _ in range(6):
        node = getattr(node, "parent", None)
        if node is None or not getattr(node, "get", None):
            break
        classes = " ".join(node.get("class") or [])
        for key in ("data-product-url", "data-url"):
            value = node.get(key) or ""
            if "/products/" in value:
                return abs_url(value)
        if any(token in classes for token in ("product-item", "product__form", "product-form", "shopify-product-form")):
            found = node.select_one("a[href*='/products/']")
            if found and found.get("href"):
                return abs_url(found["href"])
            break
    return fallback


def is_newsletter(form) -> bool:
    if form.find_parent("footer"):
        return True
    classes = " ".join(form.get("class") or [])
    if "newsletter" in classes:
        return True
    button = form.find("button")
    label = " ".join(button.get_text(" ", strip=True).split()).lower() if button else ""
    return "join" in label or "subscribe" in label


def convert_forms(soup: BeautifulSoup, page_url: str) -> None:
    fallback = page_url if "/products/" in page_url else f"{ORIGIN}/collections/korean-alcohol-recovery-all-products-awkn"
    for form in list(soup.find_all("form")):
        action = form.get("action") or ""
        email = form.find("input", attrs={"name": "contact[email]"})
        if "/cart/add" in action:
            target = product_target(form, fallback)
            for button in form.find_all("button"):
                label = " ".join(button.get_text(" ", strip=True).split()) or "Add to Cart"
                anchor = soup.new_tag("a", href=target)
                classes = list(button.get("class") or [])
                if "btn" not in classes:
                    classes.append("btn")
                anchor["class"] = classes
                anchor["data-keep-external"] = "true"
                anchor.string = label
                button.replace_with(anchor)
            form.name = "div"
            form.attrs.pop("action", None)
            form.attrs.pop("method", None)
            form.attrs.pop("id", None)
        elif is_newsletter(form):
            block = soup.new_tag("div")
            block["class"] = form.get("class") or []
            heading = form.find(["h2", "h3", "p", "label"])
            if heading:
                block.append(heading.extract())
            anchor = soup.new_tag("a", href=f"{ORIGIN}/")
            anchor["class"] = ["btn", "btn--solid", "btn--primary", "static-join"]
            anchor.string = "Join on theawkn.com"
            block.append(anchor)
            form.replace_with(block)
        elif action.endswith("/search") or action == "/search" or action.startswith("/search?"):
            form["action"] = f"{ORIGIN}/search"


def convert_quick_add(soup: BeautifulSoup, page_url: str) -> None:
    fallback = page_url if "/products/" in page_url else f"{ORIGIN}/collections/korean-alcohol-recovery-all-products-awkn"
    for button in list(soup.select("button.quick-add__button, button[data-add-to-cart], button[name='add']")):
        handle = button.get("data-quick-add-modal-handle") or ""
        target = f"{ORIGIN}/products/{handle}" if handle else ""
        if not target:
            card = button.find_parent(class_="product-item")
            if card:
                link = card.select_one("a[href*='/products/'], a[href*='product']")
                if link and link.get("href"):
                    href = link["href"]
                    target = href if href.startswith("http") else abs_url(href) if href.startswith("/") else fallback
            holder = button.find_parent(attrs={"data-quick-add-holder": True})
            if not target and holder:
                form = holder.find(attrs={"data-product-url": True})
                if form and form.get("data-product-url"):
                    target = abs_url(form.get("data-product-url"))
        if not target:
            target = fallback
        anchor = soup.new_tag("a", href=target)
        classes = [c for c in (button.get("class") or []) if c != "is-loading"]
        if "btn" not in classes:
            classes.append("btn")
        anchor["class"] = classes
        anchor["data-keep-external"] = "true"
        label = " ".join(button.get_text(" ", strip=True).split()) or "Add to Cart"
        anchor.string = label
        button.replace_with(anchor)


def strip_noise(soup: BeautifulSoup) -> None:
    for tag in soup.find_all(["script", "noscript", "iframe"]):
        src = (tag.get("src") or "") if tag.name == "iframe" else ""
        if tag.name == "iframe" and "youtube" in src:
            tag["src"] = abs_url(src)
            continue
        tag.decompose()
    for tag in soup.find_all(["shopify-chat", "shopify-store", "shopify-payment-terms"]):
        tag.decompose()
    for tag in soup.select(".shopify-payment-button, .h-captcha, .pswp, shopify-accelerated-checkout"):
        tag.decompose()
    for tag in soup.find_all(class_=True):
        classes = [c for c in tag.get("class") if c != "is-loading"]
        if classes:
            tag["class"] = classes
        else:
            del tag["class"]
    for link in soup.find_all("link"):
        rel = " ".join(link.get("rel") or [])
        if link.get("as") == "style" or "preload" in rel and "style" in (link.get("href") or ""):
            if (link.get("href") or "").endswith(".css") or ".css?" in (link.get("href") or ""):
                link["rel"] = ["stylesheet"]
                link.attrs.pop("as", None)
                link.attrs.pop("onload", None)


def dedupe_videos(soup: BeautifulSoup) -> None:
    for wrapper in soup.select(".swiper-wrapper"):
        seen = set()
        for slide in wrapper.find_all(class_="swiper-slide", recursive=False):
            video = slide.find("video")
            source = slide.find("source")
            key = ""
            if video and video.get("src"):
                key = video.get("src")
            elif source and source.get("src"):
                key = source.get("src")
            else:
                key = " ".join(slide.get_text(" ", strip=True).split())[:80]
            if key in seen:
                slide.decompose()
            else:
                seen.add(key)


def protocol_fix(html: str) -> str:
    html = html.replace("url(//", "url(https://")
    html = html.replace("url('//", "url('https://")
    html = html.replace('url("//', 'url("https://')
    html = html.replace("href=\"//", "href=\"https://")
    html = html.replace("src=\"//", "src=\"https://")
    html = html.replace("poster=\"//", "poster=\"https://")
    return html


def collect_css(soup: BeautifulSoup, bucket: dict[str, str]) -> None:
    for link in soup.find_all("link"):
        href = link.get("href") or ""
        if ".css" not in href:
            continue
        full = abs_url(href)
        name = Path(urlparse(full).path).name
        if name in CSS_KEEP and name not in bucket:
            bucket[name] = full.split("?")[0] if "?" in full else full
            # keep versioned URL for fetch
            bucket[name] = full


def head_styles(soup: BeautifulSoup) -> str:
    chunks = []
    if not soup.head:
        return ""
    for style in soup.head.find_all("style"):
        text = style.get_text()
        if not text.strip():
            continue
        if "shopify-accelerated" in text or "portable-wallets" in text:
            continue
        chunks.append(text)
    return "\n".join(chunks)


def font_style(soup: BeautifulSoup) -> str:
    for style in soup.body.find_all("style", recursive=False):
        text = style.get_text()
        if "NightOwl-Black" in text or "@font-face" in text:
            return text
    return ""


def body_classes(soup: BeautifulSoup) -> list[str]:
    classes = [c for c in (soup.body.get("class") or []) if c != "aos-initialized"]
    return classes or ["grid-classic"]


def build_document(main_html: str, chrome: dict, page_soup: BeautifulSoup, original_url: str) -> str:
    title = clean_title(page_soup.title.get_text() if page_soup.title else "AWKN® Korean Apothecary")
    description = ""
    if page_soup.head:
        meta = page_soup.head.find("meta", attrs={"name": "description"})
        if meta and meta.get("content"):
            description = meta["content"]
    styles = head_styles(page_soup)
    classes = " ".join(body_classes(page_soup))
    css_links = [
        "assets/theme.css",
        "assets/footer.css",
        "assets/columns.css",
        "assets/custom-content.css",
        "assets/tabs.css",
        "assets/newsletter.css",
        "assets/swatches.css",
        "assets/search.css",
        "assets/predictive-search.css",
        "assets/header-search-popdown.css",
        "assets/header-dropdown.css",
        "assets/free-shipping.css",
        "assets/awkn-seal-subscriptions.css",
        "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css",
        "https://cdn.shopify.com/extensions/01a1b026-3afe-7d47-9926-779602cea877/judgeme-849/assets/shopify_v2.css",
        "assets/static.css",
    ]
    links = "\n".join(f'  <link rel="stylesheet" href="{href}">' for href in css_links)
    desc_tag = f'\n  <meta name="description" content="{description}">' if description else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>{desc_tag}
  <link rel="icon" href="images/favicon.png">
{links}
  <style>
{chrome['fonts']}
{styles}
  </style>
</head>
<body class="{classes}">
  <!-- Static reconstruction of {original_url}. Checkout stays on theawkn.com. -->
  <a class="in-page-link visually-hidden skip-link" href="#MainContent">Skip to content</a>
  <div class="container">
{chrome['header']}
    <main id="MainContent" class="main-content" role="main">
{main_html}
    </main>
  </div>
{chrome['footer']}
  <script src="assets/static.js"></script>
</body>
</html>
"""


def is_downloadable_asset(url: str) -> bool:
    path = urlparse(url).path.lower()
    if path.endswith((".mp4", ".webm", ".mov", ".m3u8", ".css", ".js")):
        return False
    return True


def image_urls(html: str) -> set[str]:
    found = set()
    for match in re.finditer(r'(?:src|poster)=["\']([^"\']+)', html):
        url = abs_url(match.group(1))
        if url.startswith("http") and is_downloadable_asset(url):
            found.add(url.split(" ")[0])
    for match in re.finditer(r'url\((["\']?)(https?:[^)\'"]+)', html):
        url = match.group(2)
        if is_downloadable_asset(url):
            found.add(url)
    return found


def image_name(url: str) -> str:
    path = urlparse(url).path
    base = Path(path).name or "image"
    base = re.sub(r"[^A-Za-z0-9._-]", "-", base)
    if "." not in base:
        base += ".img"
    # Query changes crop/size. Keep one file per path; the src URL is what we show.
    digest = hashlib.sha1(url.encode()).hexdigest()[:8]
    stem = Path(base).stem[:80]
    suffix = Path(base).suffix[:8] or ".img"
    return f"{stem}-{digest}{suffix}"


def download_images(urls: set[str]) -> dict[str, str]:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    mapping = {}

    def one(url: str):
        name = image_name(url)
        dest = IMAGE_DIR / name
        if not dest.exists() or dest.stat().st_size < 40:
            try:
                dest.write_bytes(fetch(url))
            except Exception as error:  # noqa: BLE001
                print(f"image fail {url[:100]} {error}")
                return url, None
        return url, f"images/{name}"

    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = [pool.submit(one, url) for url in urls]
        for future in as_completed(futures):
            url, local = future.result()
            if local:
                mapping[url] = local
    return mapping


def apply_images(html: str, mapping: dict[str, str]) -> str:
    def repl_attr(match: re.Match) -> str:
        attr, quote, url = match.group(1), match.group(2), match.group(3)
        full = abs_url(url)
        local = mapping.get(full)
        if not local:
            return match.group(0)
        return f"{attr}={quote}{local}{quote}"

    html = re.sub(r'(src|poster)=(["\'])([^"\']+)\2', repl_attr, html)
    # Drop srcset so the browser does not request the Shopify CDN.
    html = re.sub(r'\s(?:srcset|data-srcset|data-src)=["\'][^"\']*["\']', "", html)

    def repl_url(match: re.Match) -> str:
        url = match.group(2)
        local = mapping.get(url)
        if not local:
            return match.group(0)
        return f"url({match.group(1)}{local}{match.group(1)})"

    html = re.sub(r'url\((["\']?)(https?:[^)\'"]+)\1', repl_url, html)
    return html


def prepare_fragment(fragment_html: str, page_url: str) -> str:
    # Product sections embed a second HTML document (promo app). Strip the
    # document shell so BeautifulSoup does not throw the rest of the page away.
    fragment_html = re.sub(r"<!doctype[^>]*>", "", fragment_html, flags=re.I)
    fragment_html = re.sub(r"<title[\s\S]*?</title>", "", fragment_html, flags=re.I)
    fragment_html = re.sub(r"</?(?:html|head|body)(?:\s[^>]*)?>", "", fragment_html, flags=re.I)
    soup = BeautifulSoup(fragment_html, "html.parser")
    strip_noise(soup)
    dedupe_videos(soup)
    convert_forms(soup, page_url)
    convert_quick_add(soup, page_url)
    rewrite_links(soup)
    body = soup.body or soup
    return "".join(str(child) for child in body.contents)


def main() -> None:
    pages = {}
    css_bucket: dict[str, str] = {}
    for filename, url, kind in PAGES:
        path = ensure_page(filename, url)
        soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="replace"), "html.parser")
        pages[filename] = (url, kind, soup)
        collect_css(soup, css_bucket)

    home_url, _, home = pages["index.html"]
    header = home.select_one(".header-sections")
    footer = home.select_one("footer.footer-sections")
    if header is None or footer is None:
        raise SystemExit("homepage chrome not found")
    # Drop the cart drawer if it was nested (it is a sibling, not a child).
    for cart in header.select("[id*='cart-drawer']"):
        cart.decompose()
    chrome = {
        "header": prepare_fragment(str(header), home_url),
        "footer": prepare_fragment(str(footer), home_url),
        "fonts": font_style(home),
    }

    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    css_bucket.setdefault(
        "swatches.css",
        f"{ORIGIN}/cdn/shop/t/17/assets/swatches.css",
    )
    for name, url in sorted(css_bucket.items()):
        dest = ASSET_DIR / name
        if not dest.exists() or dest.stat().st_size < 50:
            print(f"css {name}")
            text = fetch(url).decode("utf-8", errors="replace")
            text = protocol_fix(text)
            dest.write_text(text, encoding="utf-8")

    # Favicon
    favicon_url = f"{ORIGIN}/cdn/shop/files/awkn_logo_black_height1000px_2230520a-8e19-4292-891f-c10ebce7b37e.png?width=64"
    favicon = IMAGE_DIR / "favicon.png"
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    if not favicon.exists():
        try:
            favicon.write_bytes(fetch(favicon_url))
        except Exception as error:  # noqa: BLE001
            print("favicon", error)

    documents = {}
    all_images: set[str] = set()
    for filename, (url, _kind, soup) in pages.items():
        main = soup.select_one("main#MainContent") or soup.select_one("main")
        if main is None:
            raise SystemExit(f"no main in {filename}")
        main_html = prepare_fragment("".join(str(child) for child in main.contents), url)
        html = build_document(main_html, chrome, soup, url)
        html = protocol_fix(html)
        documents[filename] = html
        all_images |= image_urls(html)

    # Fonts referenced from the head style.
    for font_url in list(all_images):
        if font_url.endswith(".woff2") or ".woff" in font_url:
            pass
    print(f"images to fetch: {len(all_images)}")
    mapping = download_images(all_images)
    print(f"images saved: {len(mapping)}")

    for filename, html in documents.items():
        html = apply_images(html, mapping)
        (ROOT / filename).write_text(html, encoding="utf-8")
        print(f"wrote {filename} ({len(html)} bytes)")


if __name__ == "__main__":
    main()
