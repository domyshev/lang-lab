export type AssistantId =
  | 'studyTroll'
  | 'trollMama'
  | 'capeChampion'
  | 'greenPower'
  | 'webRunner';

export interface AssistantCharacter {
  id: AssistantId;
  label: string;
}

export const assistantCharacters: AssistantCharacter[] = [
  { id: 'studyTroll', label: 'Study Troll' },
  { id: 'trollMama', label: 'Troll Mama' },
  { id: 'capeChampion', label: 'Cape Champion' },
  { id: 'greenPower', label: 'Green Power' },
  { id: 'webRunner', label: 'Web Runner' },
];

export const defaultAssistantId: AssistantId = 'studyTroll';

export function resolveAssistantId(value: unknown): AssistantId {
  return assistantCharacters.some((assistant) => assistant.id === value)
    ? (value as AssistantId)
    : defaultAssistantId;
}
