import {
  AiLibraryProposal,
  aiLibraryProposalSchema,
} from './aiAssistantSchemas';
import {
  ALL_CARDS_CARD_SET_ID,
  CardSet,
  findActiveCardSetNameConflict,
  isArchivedCardSet,
} from './cardSets';
import { LanguageCard } from './cards';
import {
  DuplicateProcessingEntry,
  NormalizedIncomingCard,
  PendingDuplicate,
  importLanguageCards,
} from './importCards';
import { SupportedLanguage } from './languages';

export interface EntityUpdate<T> {
  before: T;
  after: T;
}

export interface AiOperationPreviewCounts {
  createdCards: number;
  updatedCards: number;
  pendingDuplicates: number;
  createdCardSets: number;
  archivedCardSets: number;
  renamedCardSets: number;
  membershipAdditions: number;
  membershipRemovals: number;
}

export interface PlannedAiOperation {
  id: string;
  title: string;
  summary: string;
  userPrompt: string;
  modelId: string;
  createdAt: string;
  createdCards: LanguageCard[];
  updatedCards: Array<EntityUpdate<LanguageCard>>;
  createdCardSets: CardSet[];
  updatedCardSets: Array<EntityUpdate<CardSet>>;
  duplicateProcessingHistory: DuplicateProcessingEntry[];
  pendingDuplicates: PendingDuplicate[];
  previewCounts: AiOperationPreviewCounts;
}

export interface AppliedAiOperation extends PlannedAiOperation {
  appliedAt: string;
  status: 'applied' | 'reverted';
  revertedAt?: string;
}

export interface AiRollbackConflict {
  entityType: 'card' | 'cardSet';
  entityId: string;
  laterOperation?: Pick<AppliedAiOperation, 'id' | 'title'>;
}

export type PlanAiOperationResult =
  | { ok: true; operation: PlannedAiOperation }
  | { ok: false; errors: string[] };

export function planAiOperation(input: {
  cards: LanguageCard[];
  cardSets: CardSet[];
  proposal: AiLibraryProposal;
  modelId: string;
  now: string;
  userPrompt: string;
  idFactory?: (prefix: string) => string;
}): PlanAiOperationResult {
  const parsedProposal = aiLibraryProposalSchema.safeParse(input.proposal);
  if (!parsedProposal.success) {
    return {
      ok: false,
      errors: unique(parsedProposal.error.issues.map((issue) => issue.message)),
    };
  }

  const proposal = parsedProposal.data;
  const validationErrors = validateReferences({
    cards: input.cards,
    cardSets: input.cardSets,
    proposal,
  });
  if (validationErrors.length > 0) {
    return { ok: false, errors: validationErrors };
  }

  const idFactory = input.idFactory ?? createId;
  const operationId = idFactory('ai-operation');
  const proposalCards = proposal.cards ?? [];
  const importResult = importLanguageCards({
    existingCards: input.cards,
    pastedJson: JSON.stringify(
      proposalCards.map(({ clientRef: _clientRef, ...incomingCard }) => incomingCard),
    ),
    now: input.now,
    idFactory,
  });

  const resolvedRefs = new Map<string, string>();
  proposalCards.forEach((proposalCard, index) => {
    const resolvedId = importResult.resolvedCardIds[index];
    if (resolvedId) {
      resolvedRefs.set(proposalCard.clientRef, resolvedId);
    }
  });

  const existingCardIds = new Set(input.cards.map((card) => card.id));
  const importedCardsById = new Map(
    importResult.cards.map((importedCard) => [importedCard.id, importedCard]),
  );
  const createdCards = importResult.cards
    .filter((importedCard) => !existingCardIds.has(importedCard.id))
    .map(cloneCard);
  const updatedCards = input.cards.flatMap((existingCard) => {
    const importedCard = importedCardsById.get(existingCard.id);
    if (!importedCard || entitiesEqual(existingCard, importedCard)) {
      return [];
    }
    return [{ before: cloneCard(existingCard), after: cloneCard(importedCard) }];
  });

  const existingSetsById = new Map(
    input.cardSets.map((set) => [set.id, cloneCardSet(set)]),
  );
  const workingSetsById = new Map(existingSetsById);
  const createdCardSets: CardSet[] = [];

  for (const change of proposal.cardSetChanges ?? []) {
    if (change.type === 'create') {
      const createdSet: CardSet = {
        id: idFactory('card-set'),
        name: deriveCanonicalName(change.names),
        names: { ...change.names },
        cardIds: unique(
          change.cardRefs.map((ref) => resolveCardRef(ref, resolvedRefs)),
        ),
        createdAt: input.now,
        updatedAt: input.now,
      };
      createdCardSets.push(createdSet);
      workingSetsById.set(createdSet.id, createdSet);
      continue;
    }

    const current = workingSetsById.get(change.cardSetId);
    if (!current) {
      continue;
    }
    const names = change.names
      ? { ...(current.names ?? {}), ...change.names }
      : current.names
        ? { ...current.names }
        : undefined;
    const removeIds = new Set(change.removeCardIds ?? []);
    const remainingIds = current.cardIds.filter((id) => !removeIds.has(id));
    const addedIds = (change.addCardRefs ?? []).map((ref) =>
      resolveCardRef(ref, resolvedRefs),
    );
    const after: CardSet = {
      ...current,
      name: deriveCanonicalName(names, current.name),
      names,
      cardIds: unique([...remainingIds, ...addedIds]),
      ...(change.archive ? { archivedAt: input.now } : {}),
      updatedAt: input.now,
    };
    workingSetsById.set(after.id, after);
  }

  const finalCardSets = [...workingSetsById.values()];
  const conflictingCardSet = finalCardSets.find((cardSet) =>
    !isArchivedCardSet(cardSet) &&
    cardSet.id !== ALL_CARDS_CARD_SET_ID &&
    findActiveCardSetNameConflict({
      cardSets: finalCardSets,
      name: cardSet.name,
      names: cardSet.names ?? {},
      excludeCardSetId: cardSet.id,
    }),
  );
  if (conflictingCardSet) {
    return {
      ok: false,
      errors: [
        `Card set name conflicts with active card set: ${conflictingCardSet.name}.`,
      ],
    };
  }

  const updatedCardSets = input.cardSets.flatMap((existingSet) => {
    const finalSet = workingSetsById.get(existingSet.id);
    if (!finalSet || entitiesEqual(existingSet, finalSet)) {
      return [];
    }
    return [{ before: cloneCardSet(existingSet), after: cloneCardSet(finalSet) }];
  });

  if (
    createdCards.length === 0 &&
    updatedCards.length === 0 &&
    importResult.pendingDuplicates.length === 0 &&
    createdCardSets.length === 0 &&
    updatedCardSets.length === 0
  ) {
    return {
      ok: false,
      errors: ['An operation must contain at least one change.'],
    };
  }

  const previewCounts = buildPreviewCounts({
    createdCards,
    updatedCards,
    createdCardSets,
    updatedCardSets,
    pendingDuplicates: importResult.pendingDuplicates,
  });

  return {
    ok: true,
    operation: {
      id: operationId,
      title: proposal.title,
      summary: proposal.summary,
      userPrompt: input.userPrompt,
      modelId: input.modelId,
      createdAt: input.now,
      createdCards,
      updatedCards,
      createdCardSets: createdCardSets.map(cloneCardSet),
      updatedCardSets,
      duplicateProcessingHistory: importResult.duplicateProcessingHistory.map(
        cloneDuplicateProcessingEntry,
      ),
      pendingDuplicates: importResult.pendingDuplicates.map(clonePendingDuplicate),
      previewCounts,
    },
  };
}

export function findAiRollbackConflict(input: {
  operation: AppliedAiOperation;
  cards: LanguageCard[];
  cardSets: CardSet[];
  laterOperations: AppliedAiOperation[];
}): AiRollbackConflict | null {
  const cardsById = new Map(input.cards.map((card) => [card.id, card]));
  const setsById = new Map(input.cardSets.map((set) => [set.id, set]));
  const affectedCards = [
    ...input.operation.createdCards,
    ...input.operation.updatedCards.map((update) => update.after),
  ];
  const affectedSets = [
    ...input.operation.createdCardSets,
    ...input.operation.updatedCardSets.map((update) => update.after),
  ];
  const createdCardIds = new Set(
    input.operation.createdCards.map(({ id }) => id),
  );
  const affectedSetIds = new Set(affectedSets.map(({ id }) => id));

  for (const after of affectedCards) {
    if (!entitiesEqual(cardsById.get(after.id), after)) {
      return rollbackConflict('card', after.id, input.laterOperations);
    }
  }
  for (const cardSet of input.cardSets) {
    if (affectedSetIds.has(cardSet.id)) {
      continue;
    }
    const dependentCardId = cardSet.cardIds.find((cardId) =>
      createdCardIds.has(cardId),
    );
    if (dependentCardId) {
      return rollbackConflict('card', dependentCardId, input.laterOperations);
    }
  }
  for (const after of affectedSets) {
    if (!entitiesEqual(setsById.get(after.id), after)) {
      return rollbackConflict('cardSet', after.id, input.laterOperations);
    }
  }
  return null;
}

function validateReferences(input: {
  cards: LanguageCard[];
  cardSets: CardSet[];
  proposal: AiLibraryProposal;
}): string[] {
  const errors: string[] = [];
  const cardIds = new Set(input.cards.map((card) => card.id));
  const cardRefs = new Set(input.proposal.cards?.map((card) => card.clientRef) ?? []);
  const setsById = new Map(input.cardSets.map((set) => [set.id, set]));

  const isKnownCardRef = (ref: string) => cardIds.has(ref) || cardRefs.has(ref);

  for (const change of input.proposal.cardSetChanges ?? []) {
    if (change.type === 'create') {
      change.cardRefs.forEach((ref) => {
        if (!isKnownCardRef(ref)) {
          errors.push(`Unknown card reference: ${ref}.`);
        }
      });
      continue;
    }

    if (change.cardSetId === ALL_CARDS_CARD_SET_ID) {
      errors.push('The all-cards set cannot be updated.');
      continue;
    }
    const cardSet = setsById.get(change.cardSetId);
    if (!cardSet) {
      errors.push(`Unknown card set: ${change.cardSetId}.`);
      continue;
    }
    if (cardSet.archivedAt) {
      errors.push(`Card set ${cardSet.id} is already archived.`);
      continue;
    }
    change.addCardRefs?.forEach((ref) => {
      if (!isKnownCardRef(ref)) {
        errors.push(`Unknown card reference: ${ref}.`);
      }
    });
    change.removeCardIds?.forEach((cardId) => {
      if (!cardIds.has(cardId)) {
        errors.push(`Unknown card id: ${cardId}.`);
      } else if (!cardSet.cardIds.includes(cardId)) {
        errors.push(`Card ${cardId} is not a member of card set ${cardSet.id}.`);
      }
    });
  }

  return unique(errors);
}

function buildPreviewCounts(input: {
  createdCards: LanguageCard[];
  updatedCards: Array<EntityUpdate<LanguageCard>>;
  createdCardSets: CardSet[];
  updatedCardSets: Array<EntityUpdate<CardSet>>;
  pendingDuplicates: PendingDuplicate[];
}): AiOperationPreviewCounts {
  let membershipAdditions = input.createdCardSets.reduce(
    (total, set) => total + set.cardIds.length,
    0,
  );
  let membershipRemovals = 0;
  let archivedCardSets = 0;
  let renamedCardSets = 0;

  input.updatedCardSets.forEach(({ before, after }) => {
    const beforeIds = new Set(before.cardIds);
    const afterIds = new Set(after.cardIds);
    membershipAdditions += after.cardIds.filter((id) => !beforeIds.has(id)).length;
    membershipRemovals += before.cardIds.filter((id) => !afterIds.has(id)).length;
    if (before.name !== after.name || !entitiesEqual(before.names, after.names)) {
      renamedCardSets += 1;
    }
    if (!before.archivedAt && after.archivedAt) {
      archivedCardSets += 1;
    }
  });

  return {
    createdCards: input.createdCards.length,
    updatedCards: input.updatedCards.length,
    pendingDuplicates: input.pendingDuplicates.length,
    createdCardSets: input.createdCardSets.length,
    archivedCardSets,
    renamedCardSets,
    membershipAdditions,
    membershipRemovals,
  };
}

function resolveCardRef(
  ref: string,
  resolvedRefs: Map<string, string>,
): string {
  return resolvedRefs.get(ref) ?? ref;
}

function deriveCanonicalName(
  names: Partial<Record<SupportedLanguage, string>> | undefined,
  fallback = '',
): string {
  for (const language of ['en', 'ru', 'es'] as const) {
    const candidate = names?.[language]?.trim();
    if (candidate) {
      return candidate;
    }
  }
  return fallback;
}

function rollbackConflict(
  entityType: AiRollbackConflict['entityType'],
  entityId: string,
  laterOperations: AppliedAiOperation[],
): AiRollbackConflict {
  const laterOperation = laterOperations.find((operation) =>
    operationTouchesEntity(operation, entityType, entityId),
  );
  return {
    entityType,
    entityId,
    ...(laterOperation
      ? { laterOperation: { id: laterOperation.id, title: laterOperation.title } }
      : {}),
  };
}

function operationTouchesEntity(
  operation: AppliedAiOperation,
  entityType: AiRollbackConflict['entityType'],
  entityId: string,
): boolean {
  if (entityType === 'card') {
    return (
      operation.createdCards.some((card) => card.id === entityId) ||
      operation.updatedCards.some((update) => update.after.id === entityId) ||
      operation.createdCardSets.some((set) => set.cardIds.includes(entityId)) ||
      operation.updatedCardSets.some((update) =>
        update.after.cardIds.includes(entityId),
      )
    );
  }
  return (
    operation.createdCardSets.some((set) => set.id === entityId) ||
    operation.updatedCardSets.some((update) => update.after.id === entityId)
  );
}

function entitiesEqual(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function cloneCard(card: LanguageCard): LanguageCard {
  const { translations, definitions, examples, tags, difficulty, ...base } = card;
  return {
    ...base,
    translations: { ...translations },
    ...(definitions ? { definitions: { ...definitions } } : {}),
    ...(examples
      ? {
          examples: Object.fromEntries(
            Object.entries(examples).map(([language, languageExamples]) => [
              language,
              languageExamples.map((example) => ({ ...example })),
            ]),
          ),
        }
      : {}),
    ...(tags ? { tags: [...tags] } : {}),
    ...(difficulty ? { difficulty } : {}),
  };
}

function cloneCardSet(cardSet: CardSet): CardSet {
  const { names, ...base } = cardSet;
  return {
    ...base,
    ...(names ? { names: { ...names } } : {}),
    cardIds: [...cardSet.cardIds],
  };
}

function cloneDuplicateProcessingEntry(
  entry: DuplicateProcessingEntry,
): DuplicateProcessingEntry {
  return {
    ...entry,
    incomingCard: cloneIncomingCard(entry.incomingCard),
    matchedBy: { ...entry.matchedBy },
    addedFields: [...entry.addedFields],
  };
}

function clonePendingDuplicate(duplicate: PendingDuplicate): PendingDuplicate {
  return {
    ...duplicate,
    incomingCard: cloneIncomingCard(duplicate.incomingCard),
    matchedBy: { ...duplicate.matchedBy },
    conflicts: [...duplicate.conflicts],
  };
}

function cloneIncomingCard(incoming: NormalizedIncomingCard): NormalizedIncomingCard {
  return {
    translations: { ...incoming.translations },
    ...(incoming.definitions
      ? { definitions: { ...incoming.definitions } }
      : {}),
    ...(incoming.examples
      ? {
          examples: Object.fromEntries(
            Object.entries(incoming.examples).map(
              ([language, languageExamples]) => [
                language,
                languageExamples.map((example) => ({ ...example })),
              ],
            ),
          ),
        }
      : {}),
    ...(incoming.tags ? { tags: [...incoming.tags] } : {}),
    ...(incoming.difficulty ? { difficulty: incoming.difficulty } : {}),
  };
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
