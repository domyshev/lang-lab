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
