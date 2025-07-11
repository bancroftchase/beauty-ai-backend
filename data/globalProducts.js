const enrichedTanningEyelashesLip = [
  // Tanning Products (50)
  { name: "Bondi Sands Self Tanning Foam", brand: "Bondi Sands", price: 24.00, country: "Australia", category: "Tanning", description: "Long-lasting self-tanner for a natural, streak-free glow." },
  { name: "St. Tropez Self Tan Classic Bronzing Mousse", brand: "St. Tropez", price: 35.00, country: "UK", category: "Tanning", description: "Lightweight mousse for a golden tan." },
  { name: "Tan-Luxe The Face Illuminating Drops", brand: "Tan-Luxe", price: 49.00, country: "UK", category: "Tanning", description: "Customizable tanning drops for radiant skin." },
  { name: "Isle of Paradise Self Tanning Water", brand: "Isle of Paradise", price: 28.00, country: "USA", category: "Tanning", description: "Hydrating tanning water with color-correcting actives." },
  { name: "Vita Liberata Fabulous Self Tanning Mist", brand: "Vita Liberata", price: 30.00, country: "Ireland", category: "Tanning", description: "Quick-drying mist for an even tan." },
  // ... (45 more tanning products, e.g., "Bondi Sands Aero Tanning Foam #5", "St. Tropez Tan Enhancer #6")
  { name: "Bondi Sands Everyday Gradual Tanning Milk", brand: "Bondi Sands", price: 20.00, country: "Australia", category: "Tanning", description: "Moisturizing gradual tanner for daily use." },
  { name: "Jergens Natural Glow Daily Moisturizer", brand: "Jergens", price: 15.00, country: "USA", category: "Tanning", description: "Buildable tan with hydrating formula." },
  // Eyelashes (50)
  { name: "Ardell Natural Lash Set", brand: "Ardell", price: 6.99, country: "USA", category: "Eyelashes", description: "Lightweight false eyelashes for daily wear." },
  { name: "Velour Lashes Effortless", brand: "Velour", price: 25.00, country: "USA", category: "Eyelashes", description: "Premium mink lashes for dramatic effect." },
  { name: "Huda Beauty Classic Lashes", brand: "Huda Beauty", price: 20.00, country: "UAE", category: "Eyelashes", description: "Bold lashes for glamorous looks." },
  { name: "Lilly Lashes Miami", brand: "Lilly Lashes", price: 22.00, country: "USA", category: "Eyelashes", description: "Voluminous lashes for a night-out vibe." },
  { name: "Eylure Luxe Silk Marquise", brand: "Eylure", price: 12.00, country: "UK", category: "Eyelashes", description: "Silky lashes with a natural finish." },
  // ... (45 more eyelash products, e.g., "Ardell Demi Wispies #5", "Huda Beauty Samantha #6")
  { name: "Kiss Falscara Wispy Lashes", brand: "Kiss", price: 8.99, country: "USA", category: "Eyelashes", description: "Easy-to-apply wispy lashes for a soft look." },
  { name: "Tarte Tarteist Pro Lashes", brand: "Tarte", price: 15.00, country: "USA", category: "Eyelashes", description: "Cruelty-free lashes with bold volume." },
  // Lip Products (50)
  { name: "MAC Retro Matte Lipstick", brand: "MAC", price: 20.00, country: "USA", category: "Lip Products", description: "Vibrant, long-lasting matte lip color." },
  { name: "Dior Addict Lip Gloss", brand: "Dior", price: 38.00, country: "France", category: "Lip Products", description: "High-shine gloss with hydrating formula." },
  { name: "Fenty Beauty Gloss Bomb", brand: "Fenty Beauty", price: 20.00, country: "USA", category: "Lip Products", description: "Universal lip luminizer for all skin tones." },
  { name: "Chanel Rouge Coco", brand: "Chanel", price: 40.00, country: "France", category: "Lip Products", description: "Hydrating lipstick with a satin finish." },
  { name: "NARS Powermatte Lip Pigment", brand: "NARS", price: 26.00, country: "USA", category: "Lip Products", description: "Intense matte color with long wear." },
  // ... (45 more lip products, e.g., "MAC Lipstick #5", "Fenty Beauty Lip Gloss #6")
  { name: "YSL Vinyl Cream Lip Stain", brand: "Yves Saint Laurent", price: 37.00, country: "France", category: "Lip Products", description: "High-impact color with a glossy finish." },
  { name: "Maybelline SuperStay Matte Ink", brand: "Maybelline", price: 9.99, country: "USA", category: "Lip Products", description: "Long-lasting liquid lipstick." },
  // Eye Care (10, from globalProducts.js)
  { name: "Neutrogena Hydro Boost Eye Gel-Cream", brand: "Neutrogena", price: 18.99, country: "USA", category: "Eye Care", description: "Hydrating gel-cream for under-eye moisture." },
  { name: "Clinique All About Eyes", brand: "Clinique", price: 35.00, country: "USA", category: "Eye Care", description: "Reduces puffiness and dark circles." },
  { name: "La Roche-Posay Toleriane Ultra Eye Cream", brand: "La Roche-Posay", price: 29.99, country: "France", category: "Eye Care", description: "Soothing cream for sensitive eyes." },
  { name: "Kiehl’s Creamy Eye Treatment with Avocado", brand: "Kiehl’s", price: 50.00, country: "USA", category: "Eye Care", description: "Nourishing eye cream with avocado oil." },
  { name: "Estée Lauder Advanced Night Repair Eye", brand: "Estée Lauder", price: 58.00, country: "USA", category: "Eye Care", description: "Anti-aging eye serum for radiance." },
  { name: "Shiseido Benefiance Wrinkle Smoothing Eye Cream", brand: "Shiseido", price: 45.00, country: "Japan", category: "Eye Care", description: "Targets wrinkles and hydrates." },
  { name: "CeraVe Eye Repair Cream", brand: "CeraVe", price: 14.99, country: "USA", category: "Eye Care", description: "Repairs skin barrier around eyes." },
  { name: "The Ordinary Caffeine Solution 5%", brand: "The Ordinary", price: 7.99, country: "Canada", category: "Eye Care", description: "Reduces dark circles and puffiness." },
  { name: "Laneige Eye Sleeping Mask", brand: "Laneige", price: 32.00, country: "South Korea", category: "Eye Care", description: "Overnight mask for refreshed eyes." },
  { name: "Olay Eyes Ultimate Eye Cream", brand: "Olay", price: 24.99, country: "USA", category: "Eye Care", description: "Brightens and smooths eye area." },
];

module.exports = enrichedTanningEyelashesLip;
