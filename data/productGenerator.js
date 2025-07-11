const generateProducts = (count, category) => {
  const brands = [
    "Bondi Sands", "St. Tropez", "Tan-Luxe", "Isle of Paradise", "Vita Liberata", // Tanning
    "Ardell", "Velour", "Huda Beauty", "Lilly Lashes", "Eylure", "Kiss", "Tarte", // Eyelashes
    "MAC", "Dior", "Fenty Beauty", "Chanel", "NARS", "Yves Saint Laurent", "Maybelline", // Lip Products
    "Neutrogena", "Clinique", "La Roche-Posay", "Kiehl’s", "Estée Lauder", "Shiseido", "CeraVe", "The Ordinary", "Laneige", "Olay" // Eye Care
  ];
  const countries = ["USA", "UK", "Australia", "France", "Japan", "South Korea", "Canada", "Ireland", "UAE"];
  const descriptions = {
    Tanning: [
      "Long-lasting self-tanner for a natural glow.",
      "Lightweight mousse for a streak-free tan.",
      "Hydrating tanning water with color-correcting actives.",
      "Customizable tanning drops for radiant skin.",
      "Moisturizing gradual tanner for daily use."
    ],
    Eyelashes: [
      "Lightweight false eyelashes for daily wear.",
      "Premium mink lashes for dramatic effect.",
      "Bold lashes for glamorous looks.",
      "Easy-to-apply wispy lashes for a soft look.",
      "Cruelty-free lashes with bold volume."
    ],
    "Lip Products": [
      "Vibrant, long-lasting matte lip color.",
      "High-shine gloss with hydrating formula.",
      "Universal lip luminizer for all skin tones.",
      "Hydrating lipstick with a satin finish.",
      "Intense matte color with long wear."
    ],
    "Eye Care": [
      "Hydrating gel-cream for under-eye moisture.",
      "Reduces puffiness and dark circles.",
      "Soothing cream for sensitive eyes.",
      "Nourishing eye cream with avocado oil.",
      "Anti-aging eye serum for radiance."
    ]
  };
  const priceRanges = {
    Tanning: [15, 50],
    Eyelashes: [5, 25],
    "Lip Products": [10, 40],
    "Eye Care": [10, 60]
  };

  const products = [];
  for (let i = 1; i <= count; i++) {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const price = Number((Math.random() * (priceRanges[category][1] - priceRanges[category][0]) + priceRanges[category][0]).toFixed(2));
    const country = countries[Math.floor(Math.random() * countries.length)];
    const description = descriptions[category][Math.floor(Math.random() * descriptions[category].length)];
    const name = `${brand} ${category} #${i}`;
    products.push({
      name,
      brand,
      price,
      country,
      category,
      description
    });
  }
  return products;
};

module.exports = { generateProducts };
