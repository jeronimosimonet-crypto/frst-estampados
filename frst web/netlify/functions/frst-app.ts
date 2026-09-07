import nitroHandler from '../../.netlify/functions-internal/server/main.mjs';

export default nitroHandler;

export const config = {
  path: '/*',
  excludedPath: [
    '/api/*',
    '/_next/*',
    '/favicon.svg',
    '/logo-frst.png',
    '/og.png',
  ],
};
