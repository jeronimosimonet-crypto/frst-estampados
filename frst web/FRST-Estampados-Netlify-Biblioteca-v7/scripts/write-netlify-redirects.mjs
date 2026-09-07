import { mkdirSync, writeFileSync } from 'node:fs';

const rules = [
  '/api/state /.netlify/functions/frst-state 200!',
  '/api/login /.netlify/functions/frst-login 200!',
  '/api/files /.netlify/functions/frst-files 200!',
  '/api/approval/* /.netlify/functions/frst-approval?token=:splat 200!',
  '/* /.netlify/functions/frst-app 200',
  '',
].join('\n');

mkdirSync('dist', { recursive: true });
writeFileSync('dist/_redirects', rules, 'utf8');

console.log('Netlify redirects written to dist/_redirects');
