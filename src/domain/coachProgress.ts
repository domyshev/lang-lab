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

import { ExerciseAttempt } from './exercises';
import { SupportedLanguage } from './languages';

export interface CoachProgressMessage {
  text: string;
  tooltip: string;
}

export function getCoachProgressMessage({
  attempt,
  attempts,
  interfaceLanguage,
}: {
  attempt: ExerciseAttempt | null;
  attempts: ExerciseAttempt[];
  interfaceLanguage: SupportedLanguage;
}): CoachProgressMessage | undefined {
  const prompt = attempt?.prompts[0];
  if (!attempt || !prompt) {
    return undefined;
  }

  const isCorrect = Boolean(attempt.correctness[prompt.cardId]);
  const events = attempts
    .filter(
      (item) =>
        item.targetLanguage === attempt.targetLanguage &&
        Object.prototype.hasOwnProperty.call(item.correctness, prompt.cardId),
    )
    .map((item) => ({
      id: item.id,
      at: item.completedAt ?? item.createdAt,
      isCorrect: Boolean(item.correctness[prompt.cardId]),
    }))
    .sort((left, right) => left.at.localeCompare(right.at));

  const currentIndex = events.findIndex((event) => event.id === attempt.id);
  const eventsUntilCurrent =
    currentIndex >= 0 ? events.slice(0, currentIndex + 1) : events;

  if (!isCorrect) {
    return getIncorrectMessage(interfaceLanguage);
  }

  const streak = countCorrectStreak(eventsUntilCurrent);
  if (streak <= 1) {
    return getFirstCorrectMessage({
      hasPreviousAttempts: eventsUntilCurrent.length > 1,
      interfaceLanguage,
    });
  }

  return getCorrectStreakMessage(streak, interfaceLanguage);
}

function countCorrectStreak(events: Array<{ isCorrect: boolean }>): number {
  let streak = 0;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (!events[index].isCorrect) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function getFirstCorrectMessage({
  hasPreviousAttempts,
  interfaceLanguage,
}: {
  hasPreviousAttempts: boolean;
  interfaceLanguage: SupportedLanguage;
}): CoachProgressMessage {
  if (interfaceLanguage === 'ru') {
    return {
      text: 'Ура! Похоже, ты начал запоминать это слово.',
      tooltip: hasPreviousAttempts
        ? 'Это первый правильный ответ после ошибки или прерванной серии по этой карточке.'
        : 'Это первый сохраненный ответ по этой карточке для текущего языка-цели.',
    };
  }

  if (interfaceLanguage === 'es') {
    return {
      text: 'Bien! Parece que esta tarjeta empieza a quedarse.',
      tooltip: hasPreviousAttempts
        ? 'Es la primera respuesta correcta despues de un error o una racha rota en esta tarjeta.'
        : 'Es la primera respuesta guardada para esta tarjeta en el idioma objetivo actual.',
    };
  }

  return {
    text: 'Nice! It looks like this card is starting to stick.',
    tooltip: hasPreviousAttempts
      ? 'This is the first correct answer after a mistake or broken streak on this card.'
      : 'This is the first saved answer for this card in the current target language.',
  };
}

function getCorrectStreakMessage(
  streak: number,
  interfaceLanguage: SupportedLanguage,
): CoachProgressMessage {
  if (interfaceLanguage === 'ru') {
    return {
      text: `Это ${streak}-й правильный ответ подряд по этой карточке.`,
      tooltip:
        'Серия считается по последним сохраненным ответам этой карточки для текущего языка-цели.',
    };
  }

  if (interfaceLanguage === 'es') {
    return {
      text: `Van ${streak} respuestas correctas seguidas en esta tarjeta.`,
      tooltip:
        'La racha se calcula con las ultimas respuestas guardadas de esta tarjeta para el idioma objetivo actual.',
    };
  }

  return {
    text: `That is ${streak} correct answers in a row for this card.`,
    tooltip:
      'The streak is counted from the latest saved answers for this card in the current target language.',
  };
}

function getIncorrectMessage(
  interfaceLanguage: SupportedLanguage,
): CoachProgressMessage {
  if (interfaceLanguage === 'ru') {
    return {
      text: 'Эта карточка просит ближайший повтор.',
      tooltip:
        'Последний ответ был неверным, поэтому карточка поднимется выше в очереди повторения.',
    };
  }

  if (interfaceLanguage === 'es') {
    return {
      text: 'Esta tarjeta pide una repeticion cercana.',
      tooltip:
        'La ultima respuesta fue incorrecta, asi que la tarjeta subira en la cola de repaso.',
    };
  }

  return {
    text: 'This card is asking for a near repeat.',
    tooltip:
      'The latest answer was incorrect, so the card will move higher in the review queue.',
  };
}
