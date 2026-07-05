import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MissingLettersExercise } from '../MissingLettersExercise';

describe('MissingLettersExercise', () => {
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
      backgroundColor: 'rgb(235, 247, 225)',
    });
    expect(screen.queryByText('Правильный ответ')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Правильно!' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Правильно!' }));
    expect(onNext).toHaveBeenCalledOnce();
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
      backgroundColor: 'rgb(253, 235, 238)',
    });
    expect(screen.getByText('Правильный ответ')).toBeInTheDocument();
    expect(screen.getByLabelText('Правильный ответ: airport')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Неверно' })).toBeInTheDocument();
  });

  it('shows a memorize state without saving stats for an incomplete answer', async () => {
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
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(onAnswer).not.toHaveBeenCalled();
    expect(
      screen.queryByLabelText('Заполните все пропуски'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Неверно' })).not.toBeInTheDocument();
    expect(screen.getByText('Правильный ответ')).toBeInTheDocument();
    expect(screen.getByLabelText('Правильный ответ: vehicle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Запомнить!' })).toHaveStyle({
      backgroundColor: 'rgb(255, 243, 205)',
    });

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

  it('submits with Enter from any missing letter cell', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();

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
        onNext={vi.fn()}
      />,
    );

    const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
    await user.type(missingLetterInputs[0], 'e');
    await user.type(missingLetterInputs[1], 'i');
    await user.type(missingLetterInputs[2], 'l{enter}');

    expect(onAnswer).toHaveBeenCalledWith('vehicle');
    expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();
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
