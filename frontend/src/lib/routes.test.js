import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { matchRoutes } from 'react-router';

const app = await readFile(new URL('../App.jsx', import.meta.url), 'utf8');
const sidebar = await readFile(new URL('../components/sidebar.jsx', import.meta.url), 'utf8');
const home = await readFile(new URL('../pages/admin/home.jsx', import.meta.url), 'utf8');
const routes = [...app.matchAll(/<Route\s+path\s*=\s*["']([^"']+)["']/g)].map(match => ({ path: match[1] }));
const explicitRoutes = routes.filter(route => route.path !== '*');
const destinations = [...new Set([
  ...[...sidebar.matchAll(/url:\s*["']([^"']+)["']/g)].map(match => match[1]),
  ...[...home.matchAll(/path:\s*["']([^"']+)["']/g)].map(match => match[1]),
])].filter(path => path.startsWith('/'));

test('every sidebar and admin home link resolves to a registered page', () => {
  for (const destination of destinations) {
    assert.ok(matchRoutes(explicitRoutes, destination), `No registered page for ${destination}`);
  }
});

test('academic edit URLs resolve to a page instead of the fallback', () => {
  for (const resource of ['departments', 'majors']) {
    assert.ok(matchRoutes(explicitRoutes, `/admin/view-${resource}/507f1f77bcf86cd799439011`));
  }
});

test('unknown URLs have a fallback page', () => {
  const matches = matchRoutes(routes, '/this-page-does-not-exist');
  assert.equal(matches?.at(-1)?.route.path, '*');
});
