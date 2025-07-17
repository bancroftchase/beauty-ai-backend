const claudeResponse = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1000,
  messages: [
    {
      role: "user",
      content: `Provide exactly 10 beauty products for category: ${category}.
Respond in strict JSON format:
[{"name":"Product Name","price":"$XX","description":"Short description","link":"https://example.com"}].
Ensure all entries are realistic and beauty-related.`
    }
  ]
});
