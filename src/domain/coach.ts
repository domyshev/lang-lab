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
    return `Точность: ${percent}%. Слабые карточки: ${weakCount}. Повтори их перед новым набором.`;
  }

  if (input.interfaceLanguage === 'es') {
    return `Precisión: ${percent}%. Tarjetas débiles: ${weakCount}. Repítelas antes de un conjunto nuevo.`;
  }

  return `Accuracy: ${percent}%. Weak cards: ${weakCount}. Repeat them before starting a new card set.`;
}
