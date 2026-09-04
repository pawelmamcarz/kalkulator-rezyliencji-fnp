import { createServer } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import React from 'react';
import { renderToString } from 'react-dom/server';

// Render the same React tree into the initial HTML for users and crawlers.
// Vite resolves JSX and the build constants from the existing project config.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const html = await readFile('dist/index.html', 'utf8');
  const marker = '<div id="root"></div>';
  if (!html.includes(marker)) throw new Error('Missing root placeholder');
  const rendered = renderToString(React.createElement(App));
  if (!rendered.includes('efekt-mrozenia')) throw new Error('Missing methodology in static HTML');
  await writeFile('dist/index.html', html.replace(marker, `<div id="root">${rendered}</div>`));
  console.log('Prerender: calculator and methodology included in HTML.');
} finally {
  await server.close();
}
