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

import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { PlannedAiOperation } from '../../domain/aiOperations';
import { CardSet } from '../../domain/cardSets';
import { t } from '../../domain/i18n';
import { SupportedLanguage, supportedLanguages } from '../../domain/languages';

const countItems = [
  ['createdCards', 'aiCreatedCards'],
  ['updatedCards', 'aiUpdatedCards'],
  ['pendingDuplicates', 'aiPendingDuplicates'],
  ['createdCardSets', 'aiCreatedCardSets'],
  ['archivedCardSets', 'aiArchivedCardSets'],
  ['renamedCardSets', 'aiRenamedCardSets'],
  ['membershipAdditions', 'aiMembershipAdditions'],
  ['membershipRemovals', 'aiMembershipRemovals'],
] as const;

interface AiOperationPreviewProps {
  blockingError?: string;
  language: SupportedLanguage;
  onApply: (operation: PlannedAiOperation) => void;
  onCancel: () => void;
  operation: PlannedAiOperation;
  status?: 'pending' | 'applied' | 'rejected';
}

type EditableCardSetNameTarget =
  | { kind: 'created'; cardSetId: string; currentName: string }
  | { kind: 'updated'; cardSetId: string; currentName: string };

export function AiOperationPreview({
  blockingError,
  language,
  onApply,
  onCancel,
  operation,
  status = 'pending',
}: AiOperationPreviewProps) {
  const isPending = status === 'pending';
  const editableNameTarget = useMemo(
    () => getEditableCardSetNameTarget(operation, language),
    [language, operation],
  );
  const [cardSetName, setCardSetName] = useState(editableNameTarget?.currentName ?? '');
  const normalizedCardSetName = cardSetName.trim();
  const operationToApply = useMemo(
    () =>
      editableNameTarget && normalizedCardSetName
        ? renameOperationCardSet({
            nextName: normalizedCardSetName,
            operation,
            target: editableNameTarget,
          })
        : operation,
    [editableNameTarget, language, normalizedCardSetName, operation],
  );

  useEffect(() => {
    setCardSetName(editableNameTarget?.currentName ?? '');
  }, [editableNameTarget?.cardSetId, editableNameTarget?.currentName]);

  return (
    <Box
      data-test="ai_operation_preview__panel"
      data-surface="purple-unframed"
      sx={{ bgcolor: '#f5f0ff', borderStyle: 'none', borderRadius: 1, boxShadow: 'none', p: 2 }}
    >
      <Stack data-test="ai_operation_preview__content" spacing={1.5}>
        <div data-test="ai_operation_preview__header">
          <Typography data-test="ai_operation_preview__title" component="h4" variant="subtitle1" fontWeight={900}>
            {operation.title}
          </Typography>
          <Typography data-test="ai_operation_preview__summary" color="text.secondary" variant="body2">
            {operation.summary}
          </Typography>
        </div>

        <Box
          data-test="ai_operation_preview__counts"
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
          }}
        >
          {countItems.map(([key, labelKey]) => (
            <Box
              data-test={`ai_operation_preview__count__${key}`}
              key={key}
              sx={{ borderLeft: '3px solid #6f4fa6', minWidth: 0, pl: 1 }}
            >
              <Typography fontWeight={900}>{operation.previewCounts[key]}</Typography>
              <Typography color="text.secondary" variant="caption">
                {t(language, labelKey)}
              </Typography>
            </Box>
          ))}
        </Box>

        {blockingError && (
          <Alert data-test="ai_operation_preview__blocking_error" severity="error">
            {t(language, 'aiOperationBlocked')}
          </Alert>
        )}

        {editableNameTarget && (
          <TextField
            data-test="ai_operation_preview__card_set_name_input"
            disabled={!isPending}
            fullWidth
            label={t(language, 'aiCardSetNameInputLabel')}
            onChange={(event) => setCardSetName(event.target.value)}
            size="small"
            value={cardSetName}
          />
        )}

        <Stack data-test="ai_operation_preview__actions" direction="row" spacing={1}>
          <Button
            data-test="ai_operation_preview__apply_button"
            disabled={
              !isPending ||
              Boolean(blockingError) ||
              Boolean(editableNameTarget && !normalizedCardSetName)
            }
            onClick={() => onApply(operationToApply)}
            variant="contained"
          >
            {t(language, 'aiApplyChanges')}
          </Button>
          <Button
            data-test="ai_operation_preview__cancel_button"
            disabled={!isPending}
            onClick={onCancel}
            variant="outlined"
          >
            {t(language, 'aiCancelPreview')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

function getEditableCardSetNameTarget(
  operation: PlannedAiOperation,
  language: SupportedLanguage,
): EditableCardSetNameTarget | undefined {
  if (operation.createdCardSets.length === 1) {
    const createdCardSet = operation.createdCardSets[0];
    return {
      kind: 'created',
      cardSetId: createdCardSet.id,
      currentName: getEditableCardSetName(createdCardSet, language),
    };
  }

  const renamedUpdates = operation.updatedCardSets.filter(({ before, after }) =>
    hasCardSetNameChange(before, after),
  );
  if (renamedUpdates.length !== 1) {
    return undefined;
  }

  const renamedCardSet = renamedUpdates[0].after;
  return {
    kind: 'updated',
    cardSetId: renamedCardSet.id,
    currentName: getEditableCardSetName(renamedCardSet, language),
  };
}

function getEditableCardSetName(cardSet: CardSet, language: SupportedLanguage): string {
  return cardSet.names?.[language]?.trim() || cardSet.name;
}

function hasCardSetNameChange(before: CardSet, after: CardSet): boolean {
  if (before.name !== after.name) {
    return true;
  }

  const languages = new Set([
    ...Object.keys(before.names ?? {}),
    ...Object.keys(after.names ?? {}),
  ]);
  return [...languages].some(
    (language) =>
      before.names?.[language as SupportedLanguage] !==
      after.names?.[language as SupportedLanguage],
  );
}

function renameOperationCardSet(input: {
  nextName: string;
  operation: PlannedAiOperation;
  target: EditableCardSetNameTarget;
}): PlannedAiOperation {
  const renameCardSet = (cardSet: CardSet): CardSet => ({
    ...cardSet,
    name: input.nextName,
    names: Object.fromEntries(
      supportedLanguages.map((language) => [language, input.nextName]),
    ),
  });

  if (input.target.kind === 'created') {
    return {
      ...input.operation,
      createdCardSets: input.operation.createdCardSets.map((cardSet) =>
        cardSet.id === input.target.cardSetId ? renameCardSet(cardSet) : cardSet,
      ),
    };
  }

  return {
    ...input.operation,
    updatedCardSets: input.operation.updatedCardSets.map((update) =>
      update.after.id === input.target.cardSetId
        ? { ...update, after: renameCardSet(update.after) }
        : update,
    ),
  };
}
