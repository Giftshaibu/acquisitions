import arcjet, { createRemoteClient, detectBot, shield } from '@arcjet/node';

const aj = arcjet({
  // Get your site key from https://app.arcjet.com and set it as an environment
  // variable rather than hard coding.
  key: process.env.ARCJET_KEY,
  client: createRemoteClient({
    timeout: 5000,
  }),
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: 'LIVE' }),
    detectBot({
      mode: 'LIVE', // Blocks requests. Use 'DRY_RUN' to log only
      // Block all bots except the following
      allow: [
        'CATEGORY:SEARCH_ENGINE',
        'CATEGORY:PREVIEW',
      ],
    }),
  ],
});

export default aj;
