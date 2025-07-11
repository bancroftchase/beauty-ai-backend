const globalProducts = [
  // Makeup (20 products)
  { name: "Maybelline SuperStay Matte Ink Lipstick", brand: "Maybelline", price: 9.99, country: "USA", category: "Lip Products", description: "Long-lasting liquid lipstick with vibrant color." },
  { name: "L'Oréal Voluminous Lash Paradise Mascara", brand: "L'Oréal", price: 12.99, country: "France", category: "Eyelashes", description: "Volumizing mascara for bold lashes." },
  { name: "NARS Radiant Creamy Concealer", brand: "NARS", price: 30.00, country: "USA", category: "Makeup", description: "Creamy concealer for flawless coverage." },
  { name: "Fenty Beauty Pro Filt'r Foundation", brand: "Fenty Beauty", price: 38.00, country: "USA", category: "Makeup", description: "Long-wear foundation with a matte finish." },
  { name: "Huda Beauty Desert Dusk Eyeshadow Palette", brand: "Huda Beauty", price: 65.00, country: "UAE", category: "Makeup", description: "Vibrant eyeshadow palette for bold looks." },
  // ... (15 more makeup products, e.g., "MAC Powder Kiss Lipstick #6" to "#20")

  // Skincare (20 products)
  { name: "CeraVe Hydrating Facial Cleanser", brand: "CeraVe", price: 14.99, country: "USA", category: "Skincare", description: "Gentle cleanser for normal to dry skin." },
  { name: "The Ordinary Niacinamide 10% + Zinc 1%", brand: "The Ordinary", price: 6.99, country: "Canada", category: "Skincare", description: "Reduces blemishes and balances oil." },
  { name: "La Roche-Posay Effaclar Duo", brand: "La Roche-Posay", price: 29.99, country: "France", category: "Skincare", description: "Targets acne and clogged pores." },
  { name: "Shiseido Ultimune Power Infusing Concentrate", brand: "Shiseido", price: 98.00, country: "Japan", category: "Skincare", description: "Boosts skin's natural defenses." },
  { name: "Laneige Water Sleeping Mask", brand: "Laneige", price: 25.00, country: "South Korea", category: "Skincare", description: "Overnight mask for hydrated skin." },
  // ... (15 more skincare products, e.g., "Neutrogena Hydro Boost Gel #6" to "#20")

  // Eye Care (10 products, as in enrichedTanningEyelashesLip.js)
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

  // Haircare (20 products)
  { name: "Moroccanoil Treatment", brand: "Moroccanoil", price: 34.00, country: "Israel", category: "Haircare", description: "Nourishing oil for shiny hair." },
  { name: "Olaplex No.3 Hair Perfector", brand: "Olaplex", price: 28.00, country: "USA", category: "Haircare", description: "Repairs damaged hair bonds." },
  { name: "Kérastase Elixir Ultime Oil", brand: "Kérastase", price: 45.00, country: "France", category: "Haircare", description: "Luxurious oil for smooth hair." },
  { name: "Aveda Damage Remedy Shampoo", brand: "Aveda", price: 29.00, country: "USA", category: "Haircare", description: "Gentle shampoo for damaged hair." },
  { name: "Briogeo Don’t Despair, Repair! Mask", brand: "Briogeo", price: 36.00, country: "USA", category: "Haircare", description: "Deep conditioning for dry hair." },
  // ... (15 more haircare products, e.g., "Moroccanoil Shampoo #6" to "#20")

  // Other Categories (30 products: Clean Beauty, Luxury Skincare, Fragrances, etc.)
  { name: "Drunk Elephant C-Firma Day Serum", brand: "Drunk Elephant", price: 80.00, country: "USA", category: "Clean Beauty", description: "Vitamin C serum for brightening." },
  { name: "La Mer Crème de la Mer", brand: "La Mer", price: 190.00, country: "USA", category: "Luxury Skincare", description: "Luxurious moisturizer for radiant skin." },
  { name: "Jo Malone Peony & Blush Suede Cologne", brand: "Jo Malone", price: 75.00, country: "UK", category: "Fragrances", description: "Floral fragrance with a fruity twist." },
  { name: "Tatcha The Dewy Skin Cream", brand: "Tatcha", price: 68.00, country: "Japan", category: "Luxury Skincare", description: "Hydrating cream for a dewy glow." },
  { name: "Herbivore Lapis Blue Tansy Face Oil", brand: "Herbivore", price: 72.00, country: "USA", category: "Clean Beauty", description: "Calming face oil for sensitive skin." },
  // ... (25 more products across Clean Beauty, Luxury Skincare, Fragrances, etc.)
];

module.exports = { globalProducts };
