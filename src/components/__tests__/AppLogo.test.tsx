import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppLogo } from '../AppLogo';

describe('AppLogo', () => {
  it('keeps a 52px logo button and shows a Spain football accent without resizing the parent', () => {
    render(<AppLogo interfaceLanguage="ru" />);

    const logo = screen.getByRole('button', { name: 'Language Lab' });
    const legacyLeaf = screen.getByTestId('app_logo__legacy_leaf_hidden');
    const footballFlag = screen.getByTestId('app_logo__football_flag_svg');

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
    expect(footballFlag.tagName.toLowerCase()).toBe('svg');
    expect(footballFlag).toHaveAttribute('viewBox', '0 0 72 32');
    expect(footballFlag).toHaveStyle({
      height: '18px',
      right: '-5px',
      top: '0px',
      width: '44px',
    });
    expect(screen.getByTestId('app_logo__flag_yellow')).toBeInTheDocument();
    expect(screen.getByTestId('app_logo__football_ball')).toBeInTheDocument();
  });
});
