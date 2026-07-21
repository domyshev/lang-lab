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

import { z } from 'zod';

const nonEmptyStringSchema = z.string().trim().min(1);
const supportedLanguageMapSchema = z
  .object({
    en: nonEmptyStringSchema.optional(),
    es: nonEmptyStringSchema.optional(),
    ru: nonEmptyStringSchema.optional(),
    uk: nonEmptyStringSchema.optional(),
  })
  .strict();

const translationsSchema = supportedLanguageMapSchema.superRefine(
  (translations, context) => {
    if (Object.values(translations).filter(Boolean).length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A card requires translations in at least two languages.',
      });
    }
  },
);

const cardSetNamesSchema = supportedLanguageMapSchema.superRefine(
  (names, context) => {
    if (Object.values(names).filter(Boolean).length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A card set requires at least one localized name.',
      });
    }
  },
);

const exampleSchema = z
  .object({
    answer: nonEmptyStringSchema,
    sentence: nonEmptyStringSchema,
  })
  .strict();

const examplesSchema = z
  .object({
    en: z.array(exampleSchema).min(1).optional(),
    es: z.array(exampleSchema).min(1).optional(),
    ru: z.array(exampleSchema).min(1).optional(),
    uk: z.array(exampleSchema).min(1).optional(),
  })
  .strict();

const uniqueStringsSchema = z
  .array(nonEmptyStringSchema)
  .superRefine((values, context) => {
    if (new Set(values).size !== values.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Values must be unique.',
      });
    }
  });

export const aiProposalCardSchema = z
  .object({
    clientRef: nonEmptyStringSchema,
    definitions: supportedLanguageMapSchema.optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    examples: examplesSchema.optional(),
    tags: uniqueStringsSchema.optional(),
    translations: translationsSchema,
  })
  .strict();

const createCardSetChangeSchema = z
  .object({
    cardRefs: uniqueStringsSchema,
    clientRef: nonEmptyStringSchema,
    names: cardSetNamesSchema,
    type: z.literal('create'),
  })
  .strict();

const updateCardSetChangeSchema = z
  .object({
    addCardRefs: uniqueStringsSchema.optional(),
    archive: z.literal(true).optional(),
    cardSetId: nonEmptyStringSchema,
    names: cardSetNamesSchema.optional(),
    removeCardIds: uniqueStringsSchema.optional(),
    type: z.literal('update'),
  })
  .strict()
  .superRefine((change, context) => {
    if (
      !change.archive &&
      !change.names &&
      (change.addCardRefs?.length ?? 0) === 0 &&
      (change.removeCardIds?.length ?? 0) === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A card-set update must contain at least one change.',
      });
    }
  });

export const aiCardSetChangeSchema = z.union([
  createCardSetChangeSchema,
  updateCardSetChangeSchema,
]);

export const aiLibraryProposalSchema = z
  .object({
    cards: z.array(aiProposalCardSchema).optional(),
    cardSetChanges: z.array(aiCardSetChangeSchema).optional(),
    summary: nonEmptyStringSchema,
    title: nonEmptyStringSchema,
  })
  .strict()
  .superRefine((proposal, context) => {
    if (
      (proposal.cards?.length ?? 0) === 0 &&
      (proposal.cardSetChanges?.length ?? 0) === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'An operation must contain at least one change.',
      });
    }

    addDuplicateRefIssue(
      proposal.cards?.map((card) => card.clientRef) ?? [],
      ['cards'],
      context,
    );
    addDuplicateRefIssue(
      proposal.cardSetChanges?.flatMap((change) =>
        change.type === 'create' ? [change.clientRef] : [],
      ) ?? [],
      ['cardSetChanges'],
      context,
    );
  });

function addDuplicateRefIssue(
  refs: string[],
  path: Array<string | number>,
  context: z.RefinementCtx,
) {
  if (new Set(refs).size === refs.length) {
    return;
  }

  context.addIssue({
    code: z.ZodIssueCode.custom,
    message: 'Client references must be unique.',
    path,
  });
}

export type AiProposalCard = z.infer<typeof aiProposalCardSchema>;
export type AiCardSetChange = z.infer<typeof aiCardSetChangeSchema>;
export type AiLibraryProposal = z.infer<typeof aiLibraryProposalSchema>;
