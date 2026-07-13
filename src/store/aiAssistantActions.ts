import { createAction } from '@reduxjs/toolkit';
import {
  AppliedAiOperation,
  PlannedAiOperation,
} from '../domain/aiOperations';

export const applyAiOperation = createAction<{
  operation: PlannedAiOperation;
  appliedAt: string;
}>('aiAssistant/applyOperation');

export const revertAiOperation = createAction<{
  operationId: string;
  revertedAt: string;
}>('aiAssistant/revertOperation');

export const commitAiRollback = createAction<{
  operation: AppliedAiOperation;
  revertedAt: string;
}>('aiAssistant/commitRollback');

export const rejectAiOperation = createAction<string>(
  'aiAssistant/rejectOperation',
);
