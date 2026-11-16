import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_OG_IMAGE_PATH,
  buildCanonicalUrl,
  buildOgImageUrl,
} from './seo';

test('buildCanonicalUrl menormalkan trailing slash secara konsisten', () => {
  assert.equal(buildCanonicalUrl('https://datapath.id/', '/'), 'https://datapath.id/');
  assert.equal(
    buildCanonicalUrl('https://datapath.id', '/roadmap/'),
    'https://datapath.id/roadmap'
  );
  assert.equal(
    buildCanonicalUrl('https://datapath.id', 'portofolio/raka'),
    'https://datapath.id/portofolio/raka'
  );
});

test('buildOgImageUrl memakai fallback solid SVG bila tidak ada gambar kustom', () => {
  assert.equal(
    buildOgImageUrl('https://datapath.id'),
    `https://datapath.id${DEFAULT_OG_IMAGE_PATH}`
  );
  assert.equal(
    buildOgImageUrl('https://datapath.id', 'https://cdn.example.com/custom.png'),
    'https://cdn.example.com/custom.png'
  );
});
