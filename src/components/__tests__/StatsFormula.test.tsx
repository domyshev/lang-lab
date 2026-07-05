import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CountMetric, StatsFormula } from '../StatsFormula';

describe('StatsFormula', () => {
  it('shows only the non-zero result chip when one side of the formula is zero', () => {
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
    expect(screen.queryByTestId('stats_formula_test__total_chip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stats_formula_test__equals_icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stats_formula_test__correct_chip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stats_formula_test__plus_icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('stats_formula_test__incorrect_chip')).toHaveTextContent(
      '2',
    );
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
  });
});
