import { describe, expect, it } from 'vitest';
import indexHtml from '../../index.html?raw';
import faviconSvg from '../../public/favicon.svg?raw';

describe('document shell', () => {
  it('uses the Language Lab title and static favicon asset', () => {
    expect(indexHtml).toContain('<title>Language Lab</title>');
    expect(indexHtml).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
  });

  it('keeps the favicon forest-themed regardless of the selected app world', () => {
    expect(faviconSvg).toContain('data-favicon-theme="forest"');
    expect(faviconSvg).toContain('data-test="favicon__forest_leaf"');
    expect(faviconSvg).toContain('#4f8e5b');
    expect(faviconSvg).not.toContain('#c60b1e');
  });
});
