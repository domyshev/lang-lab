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
