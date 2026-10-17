/**
 * DIFFERENTIAL BRAND & ASSETS CONFIGURATION
 * 
 * Central registry for replaceable brand assets, corporate identity,
 * default photographic imagery, editorial copy, and contact information.
 * Any rebranding or asset replacement can be conducted directly in this file.
 */

export interface BrandConfig {
  name: string;
  tagline: string;
  subheading: string;
  heroCTA: string;
  logoSvg: string;
  businessAddress: {
    companyName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    conciergeEmail: string;
    mailToEmail?: string;
  };
  sampleImages: {
    heroAtmosphere: string;
    curationSample1: string;
    curationSample2: string;
    curationSample3: string;
    defaultAvatar: string;
    defaultBanner: string;
    ogImage: string;
  };
  editorialInterests: string[];
  bespokeStickers: Array<{
    id: string;
    title: string;
    emoji: string;
    url?: string;
  }>;
}

export const brandConfig: BrandConfig = {
  name: "Differential",
  tagline: "The Sovereign Sanctuary for Meaningful Connection",
  subheading: "A peer-to-peer, zero-knowledge network crafted for discerning minds, curated imagery, and end-to-end encrypted dialogues. No algorithms. No surveillance. No noise.",
  heroCTA: "Meet your next meaningful connection.",
  
  logoSvg: `
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-8 h-8">
      <rect width="40" height="40" rx="8" fill="#12151D" stroke="#D4AF37" stroke-opacity="0.3" stroke-width="1.5"/>
      <path d="M20 8L31 28H9L20 8Z" stroke="#6366F1" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="20" cy="21" r="4.5" fill="#D4AF37" fill-opacity="0.9"/>
      <line x1="20" y1="12" x2="20" y2="28" stroke="#D4AF37" stroke-width="1" stroke-dasharray="1 2"/>
    </svg>
  `,

  businessAddress: {
    companyName: "Differential Privacy Technologies Inc.",
    line1: "3-3 Golf Green",
    line2: "Kolkata, West Bengal",
    city: "Kolkata",
    state: "West Bengal",
    postalCode: "700033",
    country: "India",
    conciergeEmail: "concierge@differential.network",
    mailToEmail: "ranit.das.1321@gmail.com"
  },

  sampleImages: {
    heroAtmosphere: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=85",
    curationSample1: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    curationSample2: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85",
    curationSample3: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85",
    defaultAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    defaultBanner: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80",
    ogImage: "/og-image.png"
  },

  editorialInterests: [
    "Architectural Brutalism",
    "Medium Format Film",
    "Modular Synthesizers",
    "Zero-Knowledge Cryptography",
    "Monochrome Photography",
    "Bioacoustics",
    "Kyoto Aesthetics",
    "Philosophy of Mind",
    "Astrophotography",
    "Deep Sky Survey",
    "Geometric Sculpture",
    "Dark Ambient Soundscapes",
    "Letterpress Typography",
    "Ceramic Stoneware",
    "Decentralized Systems"
  ],

  bespokeStickers: [
    { id: "monolith", title: "Obsidian Monolith", emoji: "⬛" },
    { id: "leica", title: "Silver Rangefinder", emoji: "📷" },
    { id: "eclipse", title: "Solar Corona", emoji: "🌘" },
    { id: "golden_ratio", title: "Golden Spiral", emoji: "🌀" },
    { id: "kyoto_moss", title: "Zen Garden Stone", emoji: "🪨" },
    { id: "cipher_key", title: "Cryptographic Seal", emoji: "🗝️" },
    { id: "candle", title: "Sanctuary Flame", emoji: "🕯️" },
    { id: "hourglass", title: "Timeless Dune", emoji: "⏳" },
    { id: "prism", title: "Refracted Light", emoji: "💎" },
    { id: "scroll", title: "Unbroken Parchment", emoji: "📜" }
  ]
};
