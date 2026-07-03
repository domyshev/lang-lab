export type AssistantId = 'forestTutor' | 'kitchenSage' | 'starHero';

export interface AssistantCharacter {
  id: AssistantId;
  label: string;
}

export const assistantCharacters: AssistantCharacter[] = [
  { id: 'forestTutor', label: 'Forest Tutor' },
  { id: 'kitchenSage', label: 'Kitchen Sage' },
  { id: 'starHero', label: 'Star Hero' },
];

export const defaultAssistantId: AssistantId = 'forestTutor';
