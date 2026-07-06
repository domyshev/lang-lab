import { render, screen } from '@testing-library/react';
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
      '2 правильно',
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
          label="Всего пройдено упражнений"
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

  it('shows small text suffixes after metric chip numbers', () => {
    render(
      <>
        <CountMetric
          dataTestPrefix="stats_count_with_suffix"
          label="Всего пройдено упражнений"
          suffix="отвечено"
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
      '3 отвечено',
    );
    expect(
      screen.getByTestId('stats_formula_with_suffixes__total_chip'),
    ).toHaveTextContent('3 отвечено');
    expect(
      screen.getByTestId('stats_formula_with_suffixes__correct_chip'),
    ).toHaveTextContent('2 правильно');
    expect(
      screen.getByTestId('stats_formula_with_suffixes__incorrect_chip'),
    ).toHaveTextContent('1 неверно');
    expect(
      screen.getByTestId('stats_formula_with_suffixes__correct_chip__number'),
    ).toHaveStyle({ fontSize: '16px' });
    expect(
      screen.getByTestId('stats_formula_with_suffixes__correct_chip__suffix'),
    ).toHaveStyle({ fontSize: '11px' });
    expect(
      screen.getByTestId('stats_formula_with_suffixes__correct_chip__suffix'),
    ).toHaveStyle({ marginLeft: '4px' });
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
      await screen.findByText('Общее количество отвеченных вопросов в упражнении.'),
    ).toHaveStyle({
      backgroundColor: 'rgb(255, 255, 255)',
      color: 'rgb(32, 48, 21)',
      fontSize: '14px',
    });
  });
});
