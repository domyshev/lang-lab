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

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MissingLettersExercise } from '../MissingLettersExercise';

describe('MissingLettersExercise', () => {
  it('strikes only an incorrectly entered letter after an incorrect submission', async () => {
    const user = userEvent.setup();

    render(
      <MissingLettersExercise
        interfaceLanguage="ru"
        prompt={{
          cardId: 'vehicle',
          prompt: 'ru: транспортное средство',
          expectedAnswer: 'vehicle',
          maskedAnswer: 'v_h_c_e',
          translationHints: [
            { language: 'ru', value: 'транспортное средство' },
          ],
        }}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    const inputs = screen.getAllByLabelText(/Missing letter/);
    await user.type(inputs[0], 'e');
    await user.type(inputs[1], 'o');
    await user.type(inputs[2], 'l');
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(inputs[0]).toHaveStyle({ textDecorationLine: 'none' });
    expect(inputs[1]).toHaveStyle({ textDecorationLine: 'line-through' });
    expect(inputs[2]).toHaveStyle({ textDecorationLine: 'none' });
    expect(
      screen.getByTestId(
        'missing_letters_exercise__correct_answer_cell__vehicle__3',
      ),
    ).toHaveStyle({ textDecorationLine: 'none' });
  });

  it('shows a green success state without repeating the correct answer', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onNext = vi.fn();

    render(
      <MissingLettersExercise
        interfaceLanguage="ru"
        prompt={{
          cardId: 'vehicle',
          prompt: 'ru: транспортное средство',
          expectedAnswer: 'vehicle',
          maskedAnswer: 'v_h_c_e',
          translationHints: [{ language: 'ru', value: 'транспортное средство' }],
        }}
        onAnswer={onAnswer}
        onNext={onNext}
      />,
    );

    expect(screen.queryByLabelText('Answer')).not.toBeInTheDocument();

    const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
    expect(missingLetterInputs).toHaveLength(3);
    expect(screen.getByText('v')).toHaveStyle({ color: 'rgb(95, 107, 87)' });

    await user.type(missingLetterInputs[0], 'e');
    expect(missingLetterInputs[0]).toHaveStyle({ color: 'rgb(32, 48, 21)' });
    await user.type(missingLetterInputs[1], 'i');
    await user.type(missingLetterInputs[2], 'l');
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(onAnswer).toHaveBeenCalledWith('vehicle');
    expect(missingLetterInputs[0]).toBeDisabled();
    expect(missingLetterInputs[0]).toHaveStyle({ color: 'rgb(117, 117, 117)' });
    expect(missingLetterInputs[0]).toHaveStyle({
      backgroundColor: 'rgb(232, 247, 223)',
    });
    expect(screen.queryByText('Правильный ответ')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Правильно!' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Правильно!' }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('marks an in-session repeated prompt with a repeat chip', () => {
    render(
      <MissingLettersExercise
        interfaceLanguage="ru"
        isRepeatedPrompt
        prompt={{
          cardId: 'impede',
          prompt: 'ru: препятствовать',
          expectedAnswer: 'impede',
          maskedAnswer: 'i_p_d_',
          translationHints: [{ language: 'ru', value: 'препятствовать' }],
        }}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId('missing_letters_exercise__repeat_chip__impede'),
    ).toHaveTextContent('повтор');
    expect(
      screen.getByTestId('missing_letters_exercise__repeat_icon__impede'),
    ).toBeInTheDocument();
  });

  it('shows the correct answer as green word cells after a mistake', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();

    render(
      <MissingLettersExercise
        interfaceLanguage="ru"
        prompt={{
          cardId: 'airport',
          prompt: 'ru: аэропорт',
          expectedAnswer: 'airport',
          maskedAnswer: 'a_r_o_t',
          translationHints: [{ language: 'ru', value: 'аэропорт' }],
        }}
        onAnswer={onAnswer}
        onNext={vi.fn()}
      />,
    );

    const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
    await user.type(missingLetterInputs[0], 'x');
    await user.type(missingLetterInputs[1], 'x');
    await user.type(missingLetterInputs[2], 'x');
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(onAnswer).toHaveBeenCalledWith('axrxoxt');
    expect(missingLetterInputs[0]).toHaveStyle({
      backgroundColor: 'rgb(253, 232, 223)',
    });
    expect(screen.getByText('Правильный ответ')).toBeInTheDocument();
    const correctAnswer = screen.getByLabelText('Правильный ответ: airport');
    expect(correctAnswer).toBeInTheDocument();
    expect(within(correctAnswer).getByText('a')).toHaveStyle({
      color: 'rgb(32, 48, 21)',
    });
    expect(screen.getByRole('button', { name: 'Неверно' })).toBeInTheDocument();
  });

  it('shows a memorize state and saves a partial answer for an incomplete answer', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onNext = vi.fn();
    const onKnownChange = vi.fn();

    render(
      <MissingLettersExercise
        interfaceLanguage="ru"
        onKnownChange={onKnownChange}
        prompt={{
          cardId: 'vehicle',
          prompt: 'ru: транспортное средство',
          expectedAnswer: 'vehicle',
          maskedAnswer: 'v_h_c_e',
          translationHints: [{ language: 'ru', value: 'транспортное средство' }],
        }}
        onAnswer={onAnswer}
        onNext={onNext}
      />,
    );

    const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
    await user.type(missingLetterInputs[0], 'e');
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(onAnswer).toHaveBeenCalledWith('veh_c_e');
    expect(
      screen.queryByLabelText('Заполните все пропуски'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Неверно' })).not.toBeInTheDocument();
    expect(screen.getByText('Правильный ответ')).toBeInTheDocument();
    const correctAnswer = screen.getByLabelText('Правильный ответ: vehicle');
    expect(correctAnswer).toBeInTheDocument();
    expect(within(correctAnswer).getByText('v')).toHaveStyle({
      color: 'rgb(32, 48, 21)',
    });
    expect(screen.getByRole('button', { name: 'Запомнить!' })).toHaveStyle({
      backgroundColor: 'rgb(255, 243, 205)',
    });
    const knownButton = screen.getByTestId(
      'missing_letters_exercise__known_button__vehicle',
    );
    expect(knownButton).toHaveAttribute('aria-pressed', 'false');
    await user.click(knownButton);
    expect(onKnownChange).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole('button', { name: 'Запомнить!' }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('moves focus to the next missing letter after typing', async () => {
    const user = userEvent.setup();

    render(
      <MissingLettersExercise
        interfaceLanguage="ru"
        prompt={{
          cardId: 'vehicle',
          prompt: 'ru: транспортное средство',
          expectedAnswer: 'vehicle',
          maskedAnswer: 'v_h_c_e',
          translationHints: [{ language: 'ru', value: 'транспортное средство' }],
        }}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
    await user.type(missingLetterInputs[0], 'e');

    expect(missingLetterInputs[1]).toHaveFocus();
  });

  it('focuses the first missing letter so typing can start immediately', async () => {
    const user = userEvent.setup();

    render(
      <MissingLettersExercise
        interfaceLanguage="ru"
        prompt={{
          cardId: 'vehicle',
          prompt: 'ru: транспортное средство',
          expectedAnswer: 'vehicle',
          maskedAnswer: 'v_h_c_e',
          translationHints: [{ language: 'ru', value: 'транспортное средство' }],
        }}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
    await waitFor(() => expect(missingLetterInputs[0]).toHaveFocus());

    await user.keyboard('e');

    expect(missingLetterInputs[0]).toHaveValue('e');
    expect(missingLetterInputs[1]).toHaveFocus();
  });

  it('submits with Enter from any missing letter cell', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onNext = vi.fn();

    render(
      <MissingLettersExercise
        interfaceLanguage="ru"
        prompt={{
          cardId: 'vehicle',
          prompt: 'ru: транспортное средство',
          expectedAnswer: 'vehicle',
          maskedAnswer: 'v_h_c_e',
          translationHints: [{ language: 'ru', value: 'транспортное средство' }],
        }}
        onAnswer={onAnswer}
        onNext={onNext}
      />,
    );

    const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
    await user.type(missingLetterInputs[0], 'e');
    await user.type(missingLetterInputs[1], 'i');
    await user.type(missingLetterInputs[2], 'l{enter}');

    expect(onAnswer).toHaveBeenCalledWith('vehicle');
    expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();

    await user.keyboard('{Enter}');
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('does not bubble the submit Enter from a letter cell to document shortcuts', async () => {
    const user = userEvent.setup();
    const enterSpy = vi.fn();
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        enterSpy();
      }
    };
    document.addEventListener('keydown', handleDocumentKeyDown);

    try {
      render(
        <MissingLettersExercise
          interfaceLanguage="ru"
          prompt={{
            cardId: 'vehicle',
            prompt: 'ru: транспортное средство',
            expectedAnswer: 'vehicle',
            maskedAnswer: 'v_h_c_e',
            translationHints: [{ language: 'ru', value: 'транспортное средство' }],
          }}
          onAnswer={vi.fn()}
          onNext={vi.fn()}
        />,
      );

      const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
      await user.type(missingLetterInputs[0], 'e');
      await user.type(missingLetterInputs[1], 'i');
      await user.type(missingLetterInputs[2], 'l{enter}');

      expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();
      expect(enterSpy).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', handleDocumentKeyDown);
    }
  });

  it('advances memorize results with Enter after submitting from a letter cell', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    render(
      <MissingLettersExercise
        interfaceLanguage="ru"
        prompt={{
          cardId: 'vehicle',
          prompt: 'ru: транспортное средство',
          expectedAnswer: 'vehicle',
          maskedAnswer: 'v_h_c_e',
          translationHints: [{ language: 'ru', value: 'транспортное средство' }],
        }}
        onAnswer={vi.fn()}
        onNext={onNext}
      />,
    );

    const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
    await user.type(missingLetterInputs[0], 'e{enter}');

    expect(screen.getByRole('button', { name: 'Запомнить!' })).toBeInTheDocument();

    await user.keyboard('{Enter}');
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('does not advance when the submit button receives an accidental double click', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    render(
      <MissingLettersExercise
        interfaceLanguage="ru"
        prompt={{
          cardId: 'vehicle',
          prompt: 'ru: транспортное средство',
          expectedAnswer: 'vehicle',
          maskedAnswer: 'v_h_c_e',
          translationHints: [{ language: 'ru', value: 'транспортное средство' }],
        }}
        onAnswer={vi.fn()}
        onNext={onNext}
      />,
    );

    const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
    await user.type(missingLetterInputs[0], 'e');
    await user.type(missingLetterInputs[1], 'i');
    await user.type(missingLetterInputs[2], 'l');
    await user.dblClick(screen.getByRole('button', { name: 'Отправить' }));

    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();
  });
});
