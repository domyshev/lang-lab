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

import { describe, expect, it } from 'vitest';
import {
  defaultVocabularyCards,
  defaultVocabularyCardSets,
} from '../defaultVocabulary';

describe('defaultVocabulary', () => {
  it('ships the built-in four-language themed library', () => {
    const supportedLanguages = ['en', 'ru', 'es', 'uk'] as const;
    const wordCards = defaultVocabularyCards.filter(
      (card) => !/\s/.test(card.translations.en?.trim() ?? ''),
    );
    const phraseCards = defaultVocabularyCards.filter((card) =>
      /\s/.test(card.translations.en?.trim() ?? ''),
    );

    expect(defaultVocabularyCards).toHaveLength(1500);
    expect(defaultVocabularyCardSets).toHaveLength(25);
    expect(wordCards).toHaveLength(750);
    expect(phraseCards).toHaveLength(750);
    expect(
      defaultVocabularyCards.every((card) =>
        supportedLanguages.every((language) =>
          Boolean(card.translations[language]?.trim()),
        ),
      ),
    ).toBe(true);
    expect(
      defaultVocabularyCardSets.every((cardSet) =>
        supportedLanguages.every((language) =>
          Boolean(cardSet.names?.[language]?.trim()),
        ),
      ),
    ).toBe(true);
    expect(defaultVocabularyCardSets.map((cardSet) => cardSet.name)).toEqual([
      'Любовь и отношения',
      'Дружба в детстве',
      'Работа и карьера',
      'Путешествие',
      'Познание мира',
      'Восприятие себя',
      'Понимание других',
      'Бизнес идеи',
      'Человеческая личность',
      'Футбол и любовь к спорту',
      'Велосипеды и велоезда',
      'Исчезает ли профессия программист?',
      'Почему AI заменяет программистов?',
      'Разработка компьютерных игр',
      'Война и мир',
      'Творческие люди',
      'Самопознание и самовыражение',
      'SAP board',
      'Моя семья, как моя поддержка',
      'Любовь и брак',
      'Дети и развитие в семье',
      'Наши предки',
      'Эволюция',
      'Совершенствование себя через самопознание',
      'Медитации и практики осознанности',
    ]);
    expect(
      defaultVocabularyCardSets.every((cardSet) => cardSet.cardIds.length === 60),
    ).toBe(true);
    expect(
      defaultVocabularyCardSets.find(
        (cardSet) => cardSet.id === 'default-set-love-relationships',
      )?.names?.uk,
    ).toBe('Любов і стосунки');
  });
});
