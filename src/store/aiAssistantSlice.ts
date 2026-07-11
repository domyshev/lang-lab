import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
  AppliedAiOperation,
  PlannedAiOperation,
} from '../domain/aiOperations';
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
  isError?: boolean;
  retryPrompt?: string;
}

export interface AiAssistantState {
  messages: AiAssistantMessage[];
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
      state.operationError = undefined;
    },
    cancelStagedAiOperation(state) {
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
        state.operations.unshift({
          ...action.payload.operation,
          appliedAt: action.payload.appliedAt,
          status: 'applied',
        });
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
  stageAiOperation,
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
