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
import { AppLogo } from '../AppLogo';

describe('AppLogo', () => {
  it('keeps a 52px logo button and shows the inner football crest without the right flag accent', () => {
    render(<AppLogo interfaceLanguage="ru" />);

    const logo = screen.getByRole('button', { name: 'Language Lab' });
    const legacyLeaf = screen.getByTestId('app_logo__legacy_leaf_hidden');
    const footballCrest = screen.getByTestId('app_logo__football_crest_svg');

    expect(logo).toHaveStyle({
      alignSelf: 'center',
      height: '52px',
      minWidth: '250px',
      paddingRight: '35px',
      userSelect: 'none',
    });
    expect(legacyLeaf).toHaveStyle({
      display: 'none',
      height: '12px',
    });
    expect(screen.queryByTestId('app_logo__football_flag_svg')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app_logo__letter_tile_grid')).not.toBeInTheDocument();
    expect(footballCrest.tagName.toLowerCase()).toBe('svg');
    expect(footballCrest).toHaveAttribute('viewBox', '0 0 44 50');
    expect(screen.getByTestId('app_logo__crest_shield')).toBeInTheDocument();
    expect(screen.getByTestId('app_logo__crest_ball')).toBeInTheDocument();
  });
});
