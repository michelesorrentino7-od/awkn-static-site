import pack4 from "../../images/awkn-4pk-front-transparent_a49b3e21-3927-4202-a966-adfc80559c05-3381e837.png?url";
import pack10 from "../../images/awkn-10pk-front-transparent_da3c33f0-299c-4936-b9f3-289120b15d55-5dceca9f.png?url";
import pack30 from "../../images/awkn-30pk-front-transparent_ecee0280-ebff-4655-8886-f42425ad2805-3ae80405.png?url";
import pack90 from "../../images/awkn-bundle-30pk-front-transparent-133e248b.jpg?url";
import pear from "../../images/awkn_korean_hangover_cure_natural_ingredients_gut_pear_6d68b135-fcb0-452e-a2d6-e-a5646313.jpg?url";
import ginseng from "../../images/awkn-website-red-korean-ginseng-ingredient-aa2c2973.jpg?url";
import curcumin from "../../images/awkn-website-korean-curcumin-ingredient-0adde0ae.jpg?url";
import ginger from "../../images/awkn-website-ginger-ingredient-90bfa173.jpg?url";
import reishi from "../../images/awkn-website-reishi-mushroom-ingredient-530736c2.png?url";
import vitaminB6 from "../../images/awkn-website-vitaminb6-paprica-ingredient-97e4424f.jpg?url";
import vitaminC from "../../images/awkn-website-vitaminc-ingredient-e738d090.jpg?url";
import artichoke from "../../images/awkn-website-artichoke-ingredient-f096eaf8.jpg?url";
import logo from "../../images/awkn_logo_black_height1000px_2230520a-8e19-4292-891f-c10ebce7b37e-1b4d98f1.png?url";
import favicon from "../../images/favicon.png?url";
import heroStill from "../../images/awkn-website-3-kbeauty-recovery-fb1539b8.jpg?url";
import founders from "../../images/awkn_founders_soom_tess_teamphoto-215947bf.jpg?url";
import storyArt from "../../images/awkn-sisters-founders-leo-story-773483f6.png?url";
import tess from "../../images/awkn_tess_cofounder_sisters_a-284cf92e.jpg?url";
import soom from "../../images/awkn_soom_cofounder_sisters_a-f9172085.jpg?url";
import lab from "../../images/awkn-website-science-lab-formulation-15a8695c.jpg?url";
import contactStill from "../../images/awkn-ladning-page-banner-our-story-mobile-410616e5.jpg?url";

export const photos = {
  logo,
  favicon,
  pack4,
  pack10,
  pack30,
  pack90,
  heroStill,
  founders,
  storyArt,
  tess,
  soom,
  lab,
  contactStill,
};

export type Product = {
  file: string;
  name: string;
  size: string;
  price: string;
  compare?: string;
  unit: string;
  image: string;
  buy: string;
  note: string;
};

export const products: Product[] = [
  {
    file: "product-4.html",
    name: "Night Owl",
    size: "4 shots",
    price: "£18.99",
    unit: "£4.75 per shot",
    image: pack4,
    buy: "https://theawkn.com/products/night-owl-alcohol-recovery-4-shots",
    note: "A pocket pack for the night that was not on the calendar.",
  },
  {
    file: "product.html",
    name: "Night Owl",
    size: "10 shots",
    price: "£39.99",
    unit: "£4.00 per shot",
    image: pack10,
    buy: "https://theawkn.com/products/night-owl-alcohol-recovery-10-shots",
    note: "The everyday box. One shot before the evening, another before bed if the night runs long.",
  },
  {
    file: "product-30.html",
    name: "Night Owl",
    size: "30 shots",
    price: "£89.99",
    compare: "£119.99",
    unit: "£3.00 per shot",
    image: pack30,
    buy: "https://theawkn.com/products/night-owl-alcohol-recovery-30-shots",
    note: "A month of being ready. The best price per shot in the single boxes.",
  },
  {
    file: "product-90.html",
    name: "Night Owl",
    size: "3 × 30 shots",
    price: "Bundle",
    unit: "Three boxes, kept for the season",
    image: pack90,
    buy: "https://theawkn.com/products/night-owl-alcohol-recovery-90-shots",
    note: "The set of three 30-shot boxes, for the house that hosts.",
  },
];

export const reviews = [
  {
    name: "Maddy",
    text: "Definitely works, feel loads better than I normally would the morning after. Really tasty as well. My go to every time.",
  },
  {
    name: "Beth",
    text: "I tried this for the first time on my hen-do weekend and they were great. I found energy throughout the evening and I was able to show up the next day.",
  },
  {
    name: "Toby",
    text: "Definitely noticed a big difference in how I felt the next day, when I bookended the previous night’s drinking with two AWKN sachets.",
  },
  {
    name: "Grace",
    text: "Felt brighter and less groggy the next day. This made a real difference.",
  },
  {
    name: "Hunter",
    text: "It works and I’ll always have some ready when I’m going out for drinks. It’s refreshing not waking up completely useless.",
  },
];

export const ingredients = [
  { name: "Korean pear", image: pear },
  { name: "Red ginseng", image: ginseng },
  { name: "Curcumin", image: curcumin },
  { name: "Ginger", image: ginger },
  { name: "Reishi", image: reishi },
  { name: "Vitamin B6", image: vitaminB6 },
  { name: "Vitamin C", image: vitaminC },
  { name: "Artichoke", image: artichoke },
];

export const faqs = [
  {
    q: "How do I take it?",
    a: "Take one shot towards the start of the evening. If the night runs long, take another before bed. AWKN can be taken up to twice a day. Do not exceed five sachets within the guidance on the pack.",
  },
  {
    q: "What does it taste like?",
    a: "A bold pear taste with subtle fruity notes and a refreshing finish. It is a naturally flavoured herbal blend, not a sweet mixer.",
  },
  {
    q: "What is actually in it?",
    a: "Eleven natural extracts, botanicals, and nutrients chosen from Korean apothecary and formulated for a modern night out. Antioxidant-rich fruit, adaptogens, and probiotics sit in one deliberate formula.",
  },
  {
    q: "Where is it made?",
    a: "In South Korea, with a trusted manufacturing partner, under HACCP and GMP standards.",
  },
  {
    q: "Is this a hangover cure?",
    a: "No. AWKN is a food supplement. It does not prevent intoxication, diagnose, treat, cure, or prevent any disease, and it is not a substitute for a varied diet, water, or a good night of sleep.",
  },
  {
    q: "How do I order?",
    a: "This preview has no cart. Orders, shipping, and returns stay on theawkn.com. Questions about an existing order go to orders@theawkn.com.",
  },
];

export const nav = [
  { href: "shop.html", label: "Shop" },
  { href: "our-story.html", label: "Our Story" },
  { href: "ingredients.html", label: "Science" },
  { href: "faq.html", label: "FAQ" },
  { href: "contact.html", label: "Contact" },
];
