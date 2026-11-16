import { useEffect } from 'react';

export interface PageMetaOptions {
  title: string;
  description: string;
  ogType?: 'website' | 'article' | 'profile';
  ogUrl?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export const DEFAULT_TITLE = 'DataPath — Belajar Analisis Data dari Excel hingga Big Data';
export const DEFAULT_DESCRIPTION =
  'Platform belajar mandiri analisis data berbahasa Indonesia: mulai dari Excel, SQL, Python, pandas, statistik, machine learning, hingga big data dengan latihan interaktif.';
export const DEFAULT_OG_IMAGE_PATH = '/og-default.svg';

export function buildCanonicalUrl(origin: string, pathname: string): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (cleanPath === '/') return `${cleanOrigin}/`;
  return `${cleanOrigin}${cleanPath.replace(/\/+$/, '')}`;
}

export function buildOgImageUrl(origin: string, imagePath?: string): string {
  const candidate = (imagePath ?? '').trim() || DEFAULT_OG_IMAGE_PATH;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanPath = candidate.startsWith('/') ? candidate : `/${candidate}`;
  return `${cleanOrigin}${cleanPath}`;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function usePageMeta({
  title,
  description,
  ogType = 'website',
  ogUrl,
  ogImage,
  noIndex = false,
}: PageMetaOptions) {
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    const resolvedUrl = ogUrl || (origin ? buildCanonicalUrl(origin, pathname) : '');
    const resolvedImage = origin ? buildOgImageUrl(origin, ogImage) : DEFAULT_OG_IMAGE_PATH;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    if (resolvedUrl) {
      upsertCanonical(resolvedUrl);
      upsertMeta('property', 'og:url', resolvedUrl);
    }
    upsertMeta('property', 'og:site_name', 'DataPath');
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', resolvedImage);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', resolvedImage);

    return () => {
      document.title = DEFAULT_TITLE;
      upsertMeta('name', 'description', DEFAULT_DESCRIPTION);
      upsertMeta('name', 'robots', 'index, follow');
      upsertMeta('property', 'og:type', 'website');
      upsertMeta('property', 'og:title', DEFAULT_TITLE);
      upsertMeta('property', 'og:description', DEFAULT_DESCRIPTION);
      upsertMeta('name', 'twitter:title', DEFAULT_TITLE);
      upsertMeta('name', 'twitter:description', DEFAULT_DESCRIPTION);
    };
  }, [title, description, ogType, ogUrl, ogImage, noIndex]);
}
