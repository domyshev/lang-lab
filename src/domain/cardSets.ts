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

import { SupportedLanguage } from './languages';

export const ALL_CARDS_CARD_SET_ID = 'all-cards';

export interface CardSet {
  id: string;
  name: string;
  names?: Partial<Record<SupportedLanguage, string>>;
  cardIds: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export function getCardSetName(
  cardSet: Pick<CardSet, 'name' | 'names'>,
  language: SupportedLanguage,
): string {
  return cardSet.names?.[language]?.trim() || cardSet.name;
}

export function isArchivedCardSet(
  cardSet: Pick<CardSet, 'archivedAt'>,
): boolean {
  return Boolean(cardSet.archivedAt);
}

export function normalizeCardSetName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function getCardSetSearchValues(
  cardSet: Pick<CardSet, 'name' | 'names'>,
): string[] {
  return [cardSet.name, ...Object.values(cardSet.names ?? {})]
    .map((value) => normalizeCardSetName(value ?? ''))
    .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index);
}

export function findActiveCardSetNameConflict(input: {
  cardSets: CardSet[];
  name?: string;
  names: Partial<Record<SupportedLanguage, string>>;
  excludeCardSetId?: string;
}): CardSet | undefined {
  const proposedNames = getCardSetSearchValues({
    name: input.name ?? '',
    names: input.names,
  });

  if (proposedNames.length === 0) {
    return undefined;
  }

  return input.cardSets.find((cardSet) => {
    if (
      cardSet.id === ALL_CARDS_CARD_SET_ID ||
      cardSet.id === input.excludeCardSetId ||
      isArchivedCardSet(cardSet)
    ) {
      return false;
    }
    const existingNames = new Set(getCardSetSearchValues(cardSet));
    return proposedNames.some((name) => existingNames.has(name));
  });
}
