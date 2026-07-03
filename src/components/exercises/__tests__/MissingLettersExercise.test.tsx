import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MissingLettersExercise } from '../MissingLettersExercise';

describe('MissingLettersExercise', () => {
  it('fills missing letters directly inside the word cells', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();

    render(
      <MissingLettersExercise
        prompt={{
          cardId: 'vehicle',
          prompt: 'ru: транспортное средство',
          expectedAnswer: 'vehicle',
          maskedAnswer: 'v_h_c_e',
          translationHints: [{ language: 'ru', value: 'транспортное средство' }],
        }}
        onAnswer={onAnswer}
      />,
    );

    expect(screen.queryByLabelText('Answer')).not.toBeInTheDocument();

    const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
    expect(missingLetterInputs).toHaveLength(3);

    await user.type(missingLetterInputs[0], 'e');
    await user.type(missingLetterInputs[1], 'i');
    await user.type(missingLetterInputs[2], 'l');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onAnswer).toHaveBeenCalledWith('vehicle');
  });
});
