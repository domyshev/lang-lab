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
