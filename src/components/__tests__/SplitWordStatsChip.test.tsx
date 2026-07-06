import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SplitWordStatsChip } from '../SplitWordStatsChip';

describe('SplitWordStatsChip', () => {
  it('fits its own content instead of stretching to the parent width', () => {
    render(
      <div style={{ width: 640 }}>
        <SplitWordStatsChip
          correct={3}
          dataTestPrefix="word_stats_chip_test"
          incorrect={1}
          interfaceLanguage="ru"
          statsLabel="Статистика по слову"
        />
      </div>,
    );

    expect(screen.getByTestId('word_stats_chip_test__root')).toHaveStyle({
      width: 'fit-content',
    });
    expect(screen.getByTestId('word_stats_chip_test__root')).toHaveStyle({
      alignSelf: 'flex-start',
    });
  });
});
