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
import {
  findActiveCardSetNameConflict,
  getCardSetSearchValues,
  isArchivedCardSet,
  normalizeCardSetName,
} from '../cardSets';
import type { CardSet } from '../cardSets';

const baseSet: CardSet = {
  id: 'set-active',
  name: 'Love',
  names: { en: 'Love', ru: 'Любовь', es: 'Amor' },
  cardIds: [],
  createdAt: '2026-07-12T10:00:00.000Z',
  updatedAt: '2026-07-12T10:00:00.000Z',
};

describe('card set archive helpers', () => {
  it('detects archived card sets through archivedAt', () => {
    expect(isArchivedCardSet(baseSet)).toBe(false);
    expect(
      isArchivedCardSet({
        ...baseSet,
        archivedAt: '2026-07-12T12:00:00.000Z',
      }),
    ).toBe(true);
  });

  it('normalizes localized names for search and duplicate checks', () => {
    expect(normalizeCardSetName('  Любовь   Большая  ')).toBe('любовь большая');
    expect(getCardSetSearchValues(baseSet)).toEqual(['love', 'любовь', 'amor']);
  });

  it('finds duplicates only among active card sets across all localized names', () => {
    const archived: CardSet = {
      ...baseSet,
      id: 'set-archived-love',
      archivedAt: '2026-07-12T12:00:00.000Z',
    };
    const active: CardSet = {
      ...baseSet,
      id: 'set-family',
      name: 'Family',
      names: { en: 'Family', ru: 'Семья', es: 'Familia' },
    };

    expect(
      findActiveCardSetNameConflict({
        cardSets: [archived, active],
        names: { en: 'Love' },
      }),
    ).toBeUndefined();
    expect(
      findActiveCardSetNameConflict({
        cardSets: [archived, active],
        names: { es: 'familia' },
      }),
    ).toEqual(active);
    expect(
      findActiveCardSetNameConflict({
        cardSets: [active],
        names: { ru: 'Семья' },
        excludeCardSetId: 'set-family',
      }),
    ).toBeUndefined();
  });
});
