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

  it('shows white answer options and marks the selected result before next', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onNext = vi.fn();
    const onKnownChange = vi.fn();

    render(
      <MultipleChoiceExercise
        interfaceLanguage="ru"
        prompt={prompt}
        onAnswer={onAnswer}
        onKnownChange={onKnownChange}
        onNext={onNext}
      />,
    );

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
