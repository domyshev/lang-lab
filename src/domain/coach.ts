import { SupportedLanguage } from './languages';
import { CardStats } from './stats';

export function buildCoachComment(input: {
  interfaceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  cardStats: CardStats[];
  correctCount: number;
  totalCount: number;
}): string {
  const percent =
    input.totalCount === 0
      ? 0
      : Math.round((input.correctCount / input.totalCount) * 100);
  const weakCount = input.cardStats.filter(
    (stat) =>
      stat.targetLanguage === input.targetLanguage && stat.stability === 'weak',
  ).length;

  if (input.interfaceLanguage === 'ru') {
    return `Точность: ${percent}%. Слабые карточки: ${weakCount}. Повтори их перед новой темой.`;
  }

  if (input.interfaceLanguage === 'es') {
    return `Precisión: ${percent}%. Tarjetas débiles: ${weakCount}. Repítelas antes de un tema nuevo.`;
  }

  return `Accuracy: ${percent}%. Weak cards: ${weakCount}. Repeat them before starting a new theme.`;
}
