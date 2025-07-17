const claudeResponse = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022", // ✅ latest model
  max_tokens: 500,
  messages: [
    {
      role: "user",
      content: `List 10 beauty products for ${category}. 
      Provide JSON format: 
      [{"name": "...", "price": "...", "description": "..."}]`,
    },
  ],
});
