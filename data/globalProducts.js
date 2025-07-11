const globalProducts = [
  // K-Beauty (30 products)
  { name: "Sulwhasoo Concentrated Ginseng Renewing Cream EX", brand: "Sulwhasoo", price: 150.00, country: "South Korea", category: "Anti-Aging", description: "Luxury cream with ginseng to improve elasticity and reduce wrinkles." }, //[](https://www.databridgemarketresearch.com/whitepaper/innovative-solutions-in-korean-beauty-products-a-comprehensive)
  { name: "Laneige Water Sleeping Mask", brand: "Laneige", price: 25.00, country: "South Korea", category: "Skincare", description: "Overnight mask for intense hydration and elasticity." }, //[](https://www.databridgemarketresearch.com/whitepaper/innovative-solutions-in-korean-beauty-products-a-comprehensive)
  { name: "COSRX Advanced Snail 96 Mucin Power Essence", brand: "COSRX", price: 21.00, country: "South Korea", category: "Anti-Aging", description: "Hydrates, fades scars, and improves skin texture with snail mucin." }, //[](https://www.databridgemarketresearch.com/whitepaper/innovative-solutions-in-korean-beauty-products-a-comprehensive)
  { name: "Innisfree Green Tea Seed Serum", brand: "Innisfree", price: 27.00, country: "South Korea", category: "Skincare", description: "Hydrating serum with Jeju green tea antioxidants." }, //[](https://www.databridgemarketresearch.com/whitepaper/innovative-solutions-in-korean-beauty-products-a-comprehensive)
  { name: "Dr. Jart+ Cicapair Tiger Grass Cream", brand: "Dr. Jart+", price: 48.00, country: "South Korea", category: "Skincare", description: "Soothes and heals sensitive skin with centella asiatica." }, //[](https://www.futuremarketinsights.com/reports/k-beauty-product-market)
  { name: "HaruHaru Black Rice Hyaluronic Cream", brand: "HaruHaru", price: 32.00, country: "South Korea", category: "Anti-Aging", description: "Moisturizing cream with fermented black rice for anti-aging." }, //[](https://awellstyledlife.com/the-best-affordable-korean-skincare-for-aging-skin/)
  { name: "Beauty of Joseon Dynasty Cream", brand: "Beauty of Joseon", price: 24.00, country: "South Korea", category: "Anti-Aging", description: "Hydrates and firms with rice water and ginseng." }, //[](https://www.glamour.com/story/best-korean-skin-care-products)
  // ... (23 more K-Beauty products, e.g., "Etude House Moistfull Collagen Cream #8" to "#30")

  // Anti-Aging (20 products, including K-Beauty and global)
  { name: "Estée Lauder Advanced Night Repair Serum", brand: "Estée Lauder", price: 85.00, country: "USA", category: "Anti-Aging", description: "Reduces fine lines and boosts radiance." },
  { name: "SK-II Facial Treatment Essence", brand: "SK-II", price: 99.00, country: "Japan", category: "Anti-Aging", description: "Antioxidant-infused essence for smoother skin." }, //[](https://www.newbeauty.com/the-best-korean-beauty-products-for-mature-skin/)
  { name: "Iope Retinol Super Bounce Serum", brand: "Iope", price: 60.00, country: "South Korea", category: "Anti-Aging", description: "Gentle retinol serum to reduce wrinkles." }, //[](https://www.newbeauty.com/the-best-korean-beauty-products-for-mature-skin/)
  { name: "Aestura Atobarrier 365 Cream", brand: "Aestura", price: 35.00, country: "South Korea", category: "Anti-Aging", description: "Hydrates and strengthens skin barrier with ceramides." }, //[](https://www.cosmopolitan.com/style-beauty/beauty/g64688861/tariff-impacts-on-kbeauty/)
  // ... (16 more anti-aging products, e.g., "Shiseido Benefiance Wrinkle Cream #5" to "#20")

  // Makeup (20 products)
  { name: "Maybelline SuperStay Matte Ink Lipstick", brand: "Maybelline", price: 9.99, country: "USA", category: "Lip Products", description: "Long-lasting liquid lipstick with vibrant color." },
  { name: "L'Oréal Voluminous Lash Paradise Mascara", brand: "L'Oréal", price: 12.99, country: "France", category: "Eyelashes", description: "Volumizing mascara for bold lashes." },
  // ... (18 more makeup products, e.g., "Fenty Beauty Pro Filt'r Foundation #3" to "#20")

  // Skincare (20 products)
  { name: "CeraVe Hydrating Facial Cleanser", brand: "CeraVe", price: 14.99, country: "USA", category: "Skincare", description: "Gentle cleanser for normal to dry skin." },
  { name: "The Ordinary Niacinamide 10% + Zinc 1%", brand: "The Ordinary", price: 6.99, country: "Canada", category: "Skincare", description: "Reduces blemishes and balances oil." },
  // ... (18 more skincare products, e.g., "La Roche-Posay Effaclar Duo #3" to "#20")

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
  { name: "Olay Eyes Ultimate Eye Cream", brand: "Olay", price: 24.99, country: "USA", category: "Eye Care", description: "Brightens and smooths eye area." }
];

module.exports = { globalProducts };
