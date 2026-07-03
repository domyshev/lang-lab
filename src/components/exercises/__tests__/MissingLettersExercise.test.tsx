import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MissingLettersExercise } from '../MissingLettersExercise';

describe('MissingLettersExercise', () => {
  it('fills missing letters directly inside the word cells', async () => {
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

    await user.type(missingLetterInputs[0], 'e');
    await user.type(missingLetterInputs[1], 'i');
    await user.type(missingLetterInputs[2], 'l');
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(onAnswer).toHaveBeenCalledWith('vehicle');
    expect(missingLetterInputs[0]).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Следующий' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Следующий' }));
    expect(onNext).toHaveBeenCalledOnce();
  });
});
