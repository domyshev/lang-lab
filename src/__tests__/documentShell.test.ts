import { describe, expect, it } from 'vitest';
import indexHtml from '../../index.html?raw';

describe('document shell', () => {
  it('uses the Language Lab title and cheerful leaf favicon', () => {
    expect(indexHtml).toContain('<title>Language Lab</title>');
    expect(indexHtml).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
  });
});
