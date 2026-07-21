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
import { aiLibraryProposalSchema } from '../aiAssistantSchemas';

const validCard = {
  clientRef: 'airport',
  translations: {
    en: 'airport',
    es: 'aeropuerto',
    ru: 'аэропорт',
  },
};

describe('aiLibraryProposalSchema', () => {
  it('accepts cards and create/update card-set changes', () => {
    const result = aiLibraryProposalSchema.safeParse({
      title: 'Travel cards',
      summary: 'Create a multilingual travel set.',
      cards: [validCard],
      cardSetChanges: [
        {
          type: 'create',
          clientRef: 'travel-set',
          names: { en: 'Travel', es: 'Viajes', ru: 'Путешествия' },
          cardRefs: ['airport'],
        },
        {
          type: 'update',
          cardSetId: 'existing-set',
          names: { en: 'Useful travel' },
          addCardRefs: ['airport', 'existing-card'],
          removeCardIds: ['obsolete-card'],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accepts a card with exactly two supported languages', () => {
    expect(
      aiLibraryProposalSchema.safeParse({
        title: 'Two languages',
        summary: 'A valid partial translation card.',
        cards: [
          {
            clientRef: 'friendship',
            translations: { en: 'friendship', ru: 'дружба' },
          },
        ],
      }).success,
    ).toBe(true);
  });

  it('accepts Ukrainian card content and localized set names', () => {
    expect(
      aiLibraryProposalSchema.safeParse({
        title: 'Ukrainian travel',
        summary: 'Create Ukrainian-ready travel cards.',
        cards: [
          {
            clientRef: 'ticket',
            translations: { en: 'ticket', uk: 'квиток' },
            definitions: { uk: 'Документ для поїздки або входу.' },
            examples: {
              uk: [
                {
                  answer: 'квиток',
                  sentence: 'Я купив квиток на потяг.',
                },
              ],
            },
          },
        ],
        cardSetChanges: [
          {
            type: 'create',
            clientRef: 'ukrainian-travel-set',
            names: { uk: 'Подорожі' },
            cardRefs: ['ticket'],
          },
        ],
      }).success,
    ).toBe(true);
  });

  it.each([
    {
      name: 'only one translation',
      value: {
        title: 'Invalid',
        summary: 'Invalid',
        cards: [
          { clientRef: 'airport', translations: { en: 'airport' } },
        ],
      },
    },
    {
      name: 'unsupported language',
      value: {
        title: 'Invalid',
        summary: 'Invalid',
        cards: [
          {
            clientRef: 'airport',
            translations: { de: 'Flughafen', en: 'airport', ru: 'аэропорт' },
          },
        ],
      },
    },
    {
      name: 'duplicate card refs',
      value: {
        title: 'Invalid',
        summary: 'Invalid',
        cards: [validCard, { ...validCard }],
      },
    },
    {
      name: 'duplicate create-set refs',
      value: {
        title: 'Invalid',
        summary: 'Invalid',
        cardSetChanges: [
          {
            type: 'create',
            clientRef: 'set',
            names: { en: 'One' },
            cardRefs: [],
          },
          {
            type: 'create',
            clientRef: 'set',
            names: { en: 'Two' },
            cardRefs: [],
          },
        ],
      },
    },
    {
      name: 'unknown root property',
      value: {
        title: 'Invalid',
        summary: 'Invalid',
        cards: [validCard],
        deleteAllCards: true,
      },
    },
    {
      name: 'archive-shaped set change',
      value: {
        title: 'Invalid',
        summary: 'Invalid',
        cardSetChanges: [
          { type: 'archive', cardSetId: 'set-to-archive' },
        ],
      },
    },
    {
      name: 'empty operation',
      value: { title: 'Empty', summary: 'No changes' },
    },
  ])('rejects $name', ({ value }) => {
    expect(aiLibraryProposalSchema.safeParse(value).success).toBe(false);
  });
});
