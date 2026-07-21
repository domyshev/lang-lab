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

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MultipleChoiceExercise } from '../MultipleChoiceExercise';

const prompt = {
  cardId: 'airport',
  prompt: 'ru: аэропорт / es: aeropuerto',
  expectedAnswer: 'airport',
  options: ['train', 'airport', 'vehicle'],
  translationHints: [
    { language: 'ru' as const, value: 'аэропорт' },
    { language: 'es' as const, value: 'aeropuerto' },
  ],
};

describe('MultipleChoiceExercise', () => {
  it('puts companion translations first and moves extra hints to the second row', () => {
    render(
      <MultipleChoiceExercise
        complementaryLanguages={['es', 'ru']}
        interfaceLanguage="ru"
        prompt={prompt}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId('multiple_choice_exercise__prompt_hint__airport__primary'),
    ).toHaveTextContent('es: aeropuerto');
    expect(
      screen.getByTestId(
        'multiple_choice_exercise__prompt_hint__airport__secondary__ru',
      ),
    ).toHaveTextContent('ru: аэропорт');
    expect(
      screen.getByTestId('multiple_choice_exercise__prompt_hint__airport__primary'),
    ).toHaveStyle({ fontWeight: '850' });
    expect(
      screen.getByTestId(
        'multiple_choice_exercise__prompt_hint__airport__primary_language_code',
      ),
    ).toHaveStyle({ marginRight: '4px' });
    expect(
      screen.getByTestId(
        'multiple_choice_exercise__prompt_hint__airport__secondary_language_code__ru',
      ),
    ).toHaveStyle({ marginRight: '4px' });
    expect(
      screen.getByTestId(
        'multiple_choice_exercise__prompt_hint__airport__secondary_row',
      ),
    ).toHaveStyle({ marginTop: '8px' });
  });

  it('hides translations for unchecked companion languages', () => {
    render(
      <MultipleChoiceExercise
        complementaryLanguages={['es']}
        interfaceLanguage="ru"
        prompt={prompt}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId('multiple_choice_exercise__prompt_hint__airport__primary'),
    ).toHaveTextContent('es: aeropuerto');
    expect(
      screen.queryByTestId(
        'multiple_choice_exercise__prompt_hint__airport__secondary__ru',
      ),
    ).not.toBeInTheDocument();
  });

  it('shows definition hints in companion language priority order', async () => {
    const user = userEvent.setup();

    render(
      <MultipleChoiceExercise
        complementaryLanguages={['es', 'ru']}
        definitions={{
          ru: 'Русское пояснение',
          es: 'Descripcion en espanol',
          uk: 'Українське пояснення',
        }}
        interfaceLanguage="ru"
        prompt={prompt}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    const definition = screen.getByTestId(
      'multiple_choice_exercise__prompt_hint__airport__definition',
    );
    const switcher = screen.getByTestId(
      'multiple_choice_exercise__prompt_hint__airport__definition_switcher',
    );

    expect(definition).toHaveTextContent('Descripcion en espanol');

    await user.click(switcher);
    expect(definition).toHaveTextContent('Русское пояснение');

    await user.click(switcher);
    expect(definition).toHaveTextContent('Українське пояснення');
  });

  it('renders Ukrainian hints as ukr in games', () => {
    render(
      <MultipleChoiceExercise
        complementaryLanguages={['uk']}
        interfaceLanguage="ru"
        prompt={{
          ...prompt,
          translationHints: [{ language: 'uk' as const, value: 'аеропорт' }],
        }}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId('multiple_choice_exercise__prompt_hint__airport__primary'),
    ).toHaveTextContent('ukr: аеропорт');
  });

  it('shows white answer options and marks the selected result before next', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onNext = vi.fn();
    const onKnownChange = vi.fn();

    render(
      <MultipleChoiceExercise
        interfaceLanguage="ru"
        prompt={prompt}
        promptStatsAction={<button data-test="multiple_choice_stats_action">stats</button>}
        onAnswer={onAnswer}
        onKnownChange={onKnownChange}
        onNext={onNext}
      />,
    );

    const primaryPromptRow = screen.getByTestId(
      'multiple_choice_exercise__prompt_hint__airport__primary_row',
    );
    expect(within(primaryPromptRow).getByTestId('multiple_choice_stats_action')).toBeInTheDocument();

    const options = screen.getByTestId('multiple_choice_exercise__options__airport');
    expect(options).toHaveStyle({ flexDirection: 'column' });
    const optionButtons = within(options).getAllByRole('button');
    expect(optionButtons).toHaveLength(3);
    optionButtons.forEach((button) => {
      expect(button).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
    });

    await user.click(screen.getByRole('button', { name: 'train' }));

    expect(onAnswer).toHaveBeenCalledWith('train');
    expect(screen.queryByText('Правильный ответ')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'train' })).toHaveStyle({
      backgroundColor: 'rgb(253, 232, 223)',
    });
    expect(screen.getByRole('button', { name: 'airport' })).toHaveStyle({
      backgroundColor: 'rgb(232, 247, 223)',
    });
    expect(screen.getByRole('button', { name: 'Неверно' })).toBeInTheDocument();
    expect(screen.queryByText('Я знаю')).not.toBeInTheDocument();
    const knownButton = screen.getByTestId(
      'multiple_choice_exercise__known_button__airport',
    );
    expect(knownButton).toHaveAttribute('aria-pressed', 'false');
    expect(within(primaryPromptRow).getByTestId('multiple_choice_exercise__known_button__airport')).toBe(
      knownButton,
    );
    expect(
      screen.getByTestId('multiple_choice_stats_action').compareDocumentPosition(knownButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await user.hover(knownButton);
    expect(
      await screen.findByText('Признак "Я знаю это"'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Такие карточки не будут участвовать в играх. Снять признак можно в разделе Карточки.',
      ),
    ).toBeInTheDocument();
    await user.click(knownButton);
    expect(onKnownChange).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole('button', { name: 'Неверно' }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('does not repeat the correct answer block after a correct choice', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();

    render(
      <MultipleChoiceExercise
        interfaceLanguage="ru"
        prompt={prompt}
        onAnswer={onAnswer}
        onNext={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'airport' }));

    expect(onAnswer).toHaveBeenCalledWith('airport');
    expect(screen.queryByText('Правильный ответ')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'airport' })).toHaveStyle({
      backgroundColor: 'rgb(232, 247, 223)',
    });
    expect(screen.getByRole('button', { name: 'train' })).not.toHaveStyle({
      backgroundColor: 'rgb(253, 232, 223)',
    });
    expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();
  });
});
