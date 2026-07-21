// lang-lab — a language learning laboratory
// Copyright (C) 2026  Ilia Domyshev <ilia@domyshev.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
