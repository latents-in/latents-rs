// Simple mock of the AI function imported in Home.jsx
export async function generateChatResponse(prompt, options = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`[Mock AI Response to]: ${prompt.substring(0, 50)}...`);
    }, options.isFast ? 800 : 1500);
  });
}
