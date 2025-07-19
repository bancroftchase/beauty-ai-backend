const claudeResponse = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1000,
  messages: [
    {
      role: "user",
      content: `
      Find up to 50 beauty products based on this user request: "${category}".
      
      Search across:
      - Product types (lipstick, moisturizer, etc.)
      - Country-specific collections (K-Beauty = Korean brands, Italian skincare, etc.)
      - Popular brands
      - Price ranges if mentioned
      - Natural or luxury products if mentioned

      Respond ONLY in JSON format:
      [{"name":"Product Name","price":"$XX","description":"Brief description","country":"Country"}]
      `
    }
  ]
});
