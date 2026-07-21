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
import type { PlannedAiOperation } from '../../domain/aiOperations';
import {
  aiAssistantReducer,
  cancelStagedAiOperation,
  stageAiOperation,
  stageBlockedAiPreview,
} from '../aiAssistantSlice';

const operation: PlannedAiOperation = {
  id: 'operation-valid',
  title: 'Valid operation',
  summary: 'Adds one valid card.',
  userPrompt: 'Add a card.',
  modelId: 'deepseek/deepseek-v4-flash',
  createdAt: '2026-07-12T00:00:00.000Z',
  createdCards: [],
  updatedCards: [],
  createdCardSets: [],
  updatedCardSets: [],
  duplicateProcessingHistory: [],
  pendingDuplicates: [],
  previewCounts: {
    createdCards: 0,
    updatedCards: 0,
    pendingDuplicates: 0,
    createdCardSets: 0,
    archivedCardSets: 0,
    renamedCardSets: 0,
    membershipAdditions: 0,
    membershipRemovals: 0,
  },
};

const blockedPreview = {
  title: 'Invalid operation',
  summary: 'Needs correction before it can be applied.',
  validationWarnings: ['A card requires translations in at least two languages.'],
};

describe('aiAssistantSlice previews', () => {
  it('keeps blocked and applicable previews mutually exclusive', () => {
    const withBlockedPreview = aiAssistantReducer(
      undefined,
      stageBlockedAiPreview(blockedPreview),
    );

    expect(withBlockedPreview.blockedPreview).toEqual(blockedPreview);
    expect(withBlockedPreview.stagedOperation).toBeUndefined();

    const withValidOperation = aiAssistantReducer(
      withBlockedPreview,
      stageAiOperation(operation),
    );

    expect(withValidOperation.stagedOperation).toEqual(operation);
    expect(withValidOperation.blockedPreview).toBeUndefined();
  });

  it('clears either preview through the shared cancel action', () => {
    const withBlockedPreview = aiAssistantReducer(
      undefined,
      stageBlockedAiPreview(blockedPreview),
    );

    expect(
      aiAssistantReducer(withBlockedPreview, cancelStagedAiOperation()),
    ).toMatchObject({
      blockedPreview: undefined,
      stagedOperation: undefined,
    });
  });
});
