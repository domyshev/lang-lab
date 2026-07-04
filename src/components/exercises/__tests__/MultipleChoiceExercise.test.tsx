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
  it('shows white answer options and marks the selected result before next', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onNext = vi.fn();

    render(
      <MultipleChoiceExercise
        interfaceLanguage="ru"
        prompt={prompt}
        onAnswer={onAnswer}
        onNext={onNext}
      />,
    );

    const options = screen.getByTestId('multiple-choice-options');
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
      backgroundColor: 'rgb(253, 235, 238)',
    });
    expect(screen.getByRole('button', { name: 'airport' })).toHaveStyle({
      backgroundColor: 'rgb(235, 247, 225)',
    });
    expect(screen.getByRole('button', { name: 'Неверно' })).toBeInTheDocument();

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
      backgroundColor: 'rgb(235, 247, 225)',
    });
    expect(screen.getByRole('button', { name: 'train' })).not.toHaveStyle({
      backgroundColor: 'rgb(253, 235, 238)',
    });
    expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();
  });
});
