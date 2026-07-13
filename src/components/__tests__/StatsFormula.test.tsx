import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CountMetric, StatsFormula } from '../StatsFormula';

describe('StatsFormula', () => {
  it('always shows the answered chip and only non-zero result chips', () => {
    render(
      <StatsFormula
        correct={0}
        dataTestPrefix="stats_formula_test"
        incorrect={2}
        interfaceLanguage="ru"
        total={2}
        totalLabel="Всего отвечено вопросов"
      />,
    );

    expect(screen.getByTestId('stats_formula_test__label')).toHaveTextContent(
      'Всего отвечено вопросов:',
    );
    expect(screen.getByTestId('stats_formula_test__total_chip')).toHaveTextContent(
      '2 отвечено',
    );
    expect(screen.getByTestId('stats_formula_test__equals_icon')).toBeInTheDocument();
    expect(screen.queryByTestId('stats_formula_test__correct_chip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stats_formula_test__plus_icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('stats_formula_test__incorrect_chip')).toHaveTextContent(
      '2 неверно',
    );
  });

  it('keeps the answered chip visible for fully correct formulas', () => {
    render(
      <StatsFormula
        correct={2}
        dataTestPrefix="stats_formula_correct_only"
        incorrect={0}
        interfaceLanguage="ru"
        total={2}
        totalLabel="Всего отвечено вопросов"
      />,
    );

    expect(screen.getByTestId('stats_formula_correct_only__total_chip')).toHaveTextContent(
      '2 отвечено',
    );
    expect(screen.getByTestId('stats_formula_correct_only__equals_icon')).toBeInTheDocument();
    expect(screen.getByTestId('stats_formula_correct_only__correct_chip')).toHaveTextContent(
      '2 верно',
    );
    expect(
      screen.queryByTestId('stats_formula_correct_only__incorrect_chip'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('stats_formula_correct_only__plus_icon')).not.toBeInTheDocument();
  });

  it('keeps metric labels and values on the shared stats grid', () => {
    render(
      <>
        <CountMetric
          dataTestPrefix="stats_grid_count"
          label="Всего пройдено игр"
          value={3}
        />
        <StatsFormula
          correct={2}
          dataTestPrefix="stats_grid_formula"
          incorrect={1}
          interfaceLanguage="ru"
          total={3}
          totalLabel="Всего отвечено вопросов"
        />
      </>,
    );

    expect(screen.getByTestId('stats_grid_count__root')).toHaveStyle({
      gridTemplateColumns: '220px minmax(0, 1fr)',
    });
    expect(screen.getByTestId('stats_grid_formula__root')).toHaveStyle({
      gridTemplateColumns: '220px minmax(0, 1fr)',
    });
    expect(screen.getByTestId('stats_grid_formula__value_group')).toHaveStyle({
      justifyContent: 'flex-start',
    });
  });

  it('left-aligns the compact exercise formula under an exercise title', () => {
    render(
      <StatsFormula
        correct={1}
        dataTestPrefix="compact_exercise_formula"
        incorrect={1}
        interfaceLanguage="ru"
        showLabel={false}
        total={2}
        totalLabel="Всего отвечено вопросов"
      />,
    );

    expect(screen.getByTestId('compact_exercise_formula__root')).toHaveStyle({
      alignItems: 'flex-start',
    });
    expect(screen.getByTestId('compact_exercise_formula__value_group')).toHaveStyle({
      justifyContent: 'flex-start',
    });
  });

  it('can render compact exercise formulas as large answered text plus colored result text', () => {
    render(
      <StatsFormula
        correct={2}
        dataTestPrefix="exercise_text_formula"
        incorrect={6}
        interfaceLanguage="ru"
        resultDisplay="text"
        showLabel={false}
        total={8}
        totalDisplay="plainWithSuffix"
        totalLabel="Всего отвечено вопросов"
      />,
    );

    expect(screen.queryByTestId('exercise_text_formula__total_chip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('exercise_text_formula__correct_chip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('exercise_text_formula__incorrect_chip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('exercise_text_formula__equals_icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('exercise_text_formula__total_value')).toHaveTextContent(
      '8 отвечено',
    );
    expect(screen.getByTestId('exercise_text_formula__total_value__number')).toHaveStyle({
      fontSize: '42px',
    });
    expect(screen.getByTestId('exercise_text_formula__total_value__suffix')).toHaveStyle({
      fontSize: '16px',
    });
    expect(screen.getByTestId('exercise_text_formula__breakdown')).toHaveTextContent(
      '2 верно + 6 неверно',
    );
    expect(screen.getByTestId('exercise_text_formula__correct_text')).toHaveStyle({
      color: '#7fc77a',
    });
    expect(screen.getByTestId('exercise_text_formula__incorrect_text')).toHaveStyle({
      color: '#f39aa4',
    });
  });

  it('shows small text suffixes after metric chip numbers', () => {
    render(
      <>
        <CountMetric
          dataTestPrefix="stats_count_with_suffix"
          label="Всего пройдено игр"
          suffix="пройдено"
          value={3}
        />
        <StatsFormula
          correct={2}
          dataTestPrefix="stats_formula_with_suffixes"
          incorrect={1}
          interfaceLanguage="ru"
          total={3}
          totalLabel="Всего отвечено вопросов"
        />
      </>,
    );

    expect(screen.getByTestId('stats_count_with_suffix__value_chip')).toHaveTextContent(
      '3 пройдено',
    );
    expect(
      screen.getByTestId('stats_formula_with_suffixes__total_chip'),
    ).toHaveTextContent('3 отвечено');
    expect(
      screen.getByTestId('stats_formula_with_suffixes__correct_chip'),
    ).toHaveTextContent('2 верно');
    expect(
      screen.getByTestId('stats_formula_with_suffixes__incorrect_chip'),
    ).toHaveTextContent('1 неверно');
    expect(
      screen.getByTestId('stats_formula_with_suffixes__correct_chip__number'),
    ).toHaveStyle({ fontSize: '13px' });
    expect(
      screen.getByTestId('stats_formula_with_suffixes__correct_chip__suffix'),
    ).toHaveStyle({ fontSize: '10px' });
    expect(
      screen.getByTestId('stats_formula_with_suffixes__correct_chip__suffix'),
    ).toHaveStyle({ marginLeft: '4px' });
  });

  it('can render the total as a plain large number while keeping result chips', () => {
    render(
      <StatsFormula
        correct={1}
        dataTestPrefix="plain_total_formula"
        incorrect={1}
        interfaceLanguage="ru"
        total={2}
        totalDisplay="plain"
        totalLabel="Всего отвечено карточек"
      />,
    );

    expect(screen.queryByTestId('plain_total_formula__total_chip')).not.toBeInTheDocument();
    expect(screen.getByTestId('plain_total_formula__total_value')).toHaveTextContent('2');
    expect(screen.getByTestId('plain_total_formula__total_value')).toHaveStyle({
      fontSize: '42px',
    });
    expect(screen.getByTestId('plain_total_formula__equals_icon')).toBeInTheDocument();
    expect(screen.getByTestId('plain_total_formula__correct_chip')).toHaveTextContent(
      '1 верно',
    );
    expect(screen.getByTestId('plain_total_formula__incorrect_chip')).toHaveTextContent(
      '1 неверно',
    );
  });

  it('uses a light readable tooltip for metric chips', async () => {
    const user = userEvent.setup();
    render(
      <StatsFormula
        correct={1}
        dataTestPrefix="stats_formula_tooltip"
        incorrect={1}
        interfaceLanguage="ru"
        total={2}
        totalLabel="Всего отвечено вопросов"
      />,
    );

    await user.hover(screen.getByTestId('stats_formula_tooltip__total_chip'));

    expect(
      await screen.findByText('Общее количество отвеченных вопросов в игре.'),
    ).toHaveStyle({
      backgroundColor: 'rgb(255, 255, 255)',
      color: 'rgb(32, 48, 21)',
      fontSize: '14px',
    });
    expect(
      screen.getByTestId('stats_formula_tooltip__total_chip__tooltip_arrow'),
    ).toBeInTheDocument();
    expect(screen.getByRole('tooltip').closest('[data-popper-placement]')).toHaveAttribute(
      'data-popper-placement',
      expect.stringMatching(/^top/),
    );
  });

  it('can override formula metric tooltips for target-wide card totals', async () => {
    render(
      <StatsFormula
        correct={1}
        correctTooltip="количество карточек отвеченных верно"
        dataTestPrefix="target_formula_tooltip"
        incorrect={1}
        incorrectTooltip="количество карточек отвеченных неверно"
        interfaceLanguage="ru"
        total={2}
        totalLabel="Всего отвечено карточек"
        totalTooltip="всего отвечено карточек во всех играх"
      />,
    );

    const totalChip = screen.getByTestId('target_formula_tooltip__total_chip');
    const correctChip = screen.getByTestId('target_formula_tooltip__correct_chip');
    const incorrectChip = screen.getByTestId('target_formula_tooltip__incorrect_chip');

    fireEvent.mouseOver(totalChip, { clientX: 100, clientY: 80 });
    expect(
      await screen.findByText('всего отвечено карточек во всех играх'),
    ).toBeInTheDocument();

    fireEvent.mouseLeave(totalChip);
    fireEvent.mouseOver(correctChip, { clientX: 180, clientY: 80 });
    expect(
      await screen.findByText('количество карточек отвеченных верно'),
    ).toBeInTheDocument();

    fireEvent.mouseLeave(correctChip);
    fireEvent.mouseOver(incorrectChip, { clientX: 260, clientY: 80 });
    expect(
      await screen.findByText('количество карточек отвеченных неверно'),
    ).toBeInTheDocument();
  });

  it('uses an interactive cursor-anchored tooltip for the completed exercise count', async () => {
    render(
      <CountMetric
        dataTestPrefix="completed_count_metric"
        label="Всего пройдено игр"
        suffix="пройдено"
        tooltip="Общее количество пройденных игр."
        value={4}
      />,
    );

    const chip = screen.getByTestId('completed_count_metric__value_chip');

    expect(chip).toHaveTextContent('4 пройдено');

    fireEvent.mouseOver(chip, { clientX: 180, clientY: 90 });

    expect(
      await screen.findByText('Общее количество пройденных игр.'),
    ).toHaveStyle({
      backgroundColor: 'rgb(255, 255, 255)',
      color: 'rgb(32, 48, 21)',
      fontSize: '14px',
    });
    expect(chip).toHaveAttribute('data-anchor-x', '180');
    expect(chip).toHaveAttribute('data-anchor-y', '90');
    expect(
      screen.getByTestId('completed_count_metric__value_chip__tooltip_arrow'),
    ).toBeInTheDocument();

    fireEvent.mouseMove(chip, { clientX: 220, clientY: 110 });

    expect(chip).toHaveAttribute('data-anchor-x', '180');
    expect(chip).toHaveAttribute('data-anchor-y', '90');

    fireEvent.mouseLeave(chip);
    fireEvent.mouseOver(screen.getByRole('tooltip'));

    expect(screen.getByText('Общее количество пройденных игр.')).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole('tooltip'));

    await waitFor(() =>
      expect(
        screen.queryByText('Общее количество пройденных игр.'),
      ).not.toBeInTheDocument(),
    );
  });

  it('closes the previous metric tooltip immediately when another metric opens', async () => {
    render(
      <StatsFormula
        correct={1}
        dataTestPrefix="single_metric_tooltip"
        incorrect={1}
        interfaceLanguage="ru"
        total={2}
        totalLabel="Всего отвечено вопросов"
      />,
    );

    const totalChip = screen.getByTestId('single_metric_tooltip__total_chip');
    const correctChip = screen.getByTestId('single_metric_tooltip__correct_chip');

    fireEvent.mouseOver(totalChip, { clientX: 100, clientY: 80 });

    expect(
      await screen.findByText('Общее количество отвеченных вопросов в игре.'),
    ).toBeInTheDocument();

    fireEvent.mouseLeave(totalChip);
    fireEvent.mouseOver(correctChip, { clientX: 180, clientY: 80 });

    expect(
      await screen.findByText('Количество вопросов, отвеченных верно.'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByText('Общее количество отвеченных вопросов в игре.'),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getAllByRole('tooltip')).toHaveLength(1);
  });
});
