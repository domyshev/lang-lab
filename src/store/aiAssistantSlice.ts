import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
  AppliedAiOperation,
  PlannedAiOperation,
} from '../domain/aiOperations';
import type { BlockedAiPreview } from '../domain/aiBlockedPreview';
import type { RootState } from './store';
import {
  applyAiOperation,
  commitAiRollback,
  rejectAiOperation,
} from './aiAssistantActions';

export interface AiAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  blockedPreview?: BlockedAiPreview;
  isError?: boolean;
  operationPreview?: PlannedAiOperation;
  previewStatus?: 'pending' | 'applied' | 'rejected';
  retryPrompt?: string;
}

export interface AiAssistantState {
  messages: AiAssistantMessage[];
  blockedPreview?: BlockedAiPreview;
  stagedOperation?: PlannedAiOperation;
  operations: AppliedAiOperation[];
  operationError?: string;
}

const initialState: AiAssistantState = {
  messages: [],
  operations: [],
};

const aiAssistantSlice = createSlice({
  name: 'aiAssistant',
  initialState,
  reducers: {
    appendAiMessage(state, action: PayloadAction<AiAssistantMessage>) {
      state.messages.push(action.payload);
      if (state.messages.length > 100) {
        state.messages.splice(0, state.messages.length - 100);
      }
    },
    clearAiChat(state) {
      state.messages = [];
    },
    stageAiOperation(state, action: PayloadAction<PlannedAiOperation>) {
      state.stagedOperation = action.payload;
      state.blockedPreview = undefined;
      state.operationError = undefined;
    },
    stageAiOperationMessage(
      state,
      action: PayloadAction<{
        message: AiAssistantMessage;
        operation: PlannedAiOperation;
      }>,
    ) {
      state.messages.push(action.payload.message);
      if (state.messages.length > 100) {
        state.messages.splice(0, state.messages.length - 100);
      }
      state.stagedOperation = action.payload.operation;
      state.blockedPreview = undefined;
      state.operationError = undefined;
    },
    stageBlockedAiPreview(state, action: PayloadAction<BlockedAiPreview>) {
      state.blockedPreview = action.payload;
      state.stagedOperation = undefined;
      state.operationError = undefined;
    },
    stageBlockedAiPreviewMessage(
      state,
      action: PayloadAction<{
        message: AiAssistantMessage;
        preview: BlockedAiPreview;
      }>,
    ) {
      state.messages.push(action.payload.message);
      if (state.messages.length > 100) {
        state.messages.splice(0, state.messages.length - 100);
      }
      state.blockedPreview = action.payload.preview;
      state.stagedOperation = undefined;
      state.operationError = undefined;
    },
    cancelStagedAiOperation(state) {
      if (state.stagedOperation) {
        const message = state.messages.find(
          (candidate) =>
            candidate.operationPreview?.id === state.stagedOperation?.id &&
            candidate.previewStatus === 'pending',
        );
        if (message) {
          message.previewStatus = 'rejected';
        }
      }
      if (state.blockedPreview) {
        const message = [...state.messages]
          .reverse()
          .find(
            (candidate) =>
              candidate.blockedPreview && candidate.previewStatus === 'pending',
          );
        if (message) {
          message.previewStatus = 'rejected';
        }
      }
      state.blockedPreview = undefined;
      state.stagedOperation = undefined;
      state.operationError = undefined;
    },
    clearAiOperationError(state) {
      state.operationError = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyAiOperation, (state, action) => {
        const message = state.messages.find(
          (candidate) =>
            candidate.operationPreview?.id === action.payload.operation.id,
        );
        if (message) {
          message.previewStatus = 'applied';
        }
        state.operations.unshift({
          ...action.payload.operation,
          appliedAt: action.payload.appliedAt,
          status: 'applied',
        });
        state.blockedPreview = undefined;
        state.stagedOperation = undefined;
        state.operationError = undefined;
      })
      .addCase(commitAiRollback, (state, action) => {
        const operation = state.operations.find(
          ({ id }) => id === action.payload.operation.id,
        );
        if (operation) {
          operation.status = 'reverted';
          operation.revertedAt = action.payload.revertedAt;
        }
        state.operationError = undefined;
      })
      .addCase(rejectAiOperation, (state, action) => {
        state.operationError = action.payload;
      });
  },
});

export const {
  appendAiMessage,
  cancelStagedAiOperation,
  clearAiChat,
  clearAiOperationError,
  stageBlockedAiPreview,
  stageBlockedAiPreviewMessage,
  stageAiOperation,
  stageAiOperationMessage,
} = aiAssistantSlice.actions;

export const aiAssistantReducer = aiAssistantSlice.reducer;

export const selectAiAssistant = (state: RootState) => state.aiAssistant;
export const selectAiMessages = (state: RootState) => state.aiAssistant.messages;
export const selectStagedAiOperation = (state: RootState) =>
  state.aiAssistant.stagedOperation;
export const selectAiOperations = (state: RootState) =>
  state.aiAssistant.operations;
export const selectAiOperationError = (state: RootState) =>
  state.aiAssistant.operationError;
