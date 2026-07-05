import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppLogo } from '../AppLogo';

describe('AppLogo', () => {
  it('keeps a 52px logo button and shows a real leaf accent without resizing the parent', () => {
    render(<AppLogo interfaceLanguage="ru" />);

    const logo = screen.getByRole('button', { name: 'Language Lab' });
    const legacyLeaf = screen.getByTestId('app_logo__legacy_leaf_hidden');
    const visibleLeaf = screen.getByTestId('app_logo__tree_leaf_svg');

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
    expect(visibleLeaf.tagName.toLowerCase()).toBe('svg');
    expect(visibleLeaf).toHaveAttribute('viewBox', '0 0 64 28');
    expect(visibleLeaf).toHaveStyle({
      height: '15.84px',
      right: '-5px',
      top: '0px',
      width: '40.32px',
    });
    expect(screen.getByTestId('app_logo__tree_leaf_shape')).toHaveAttribute(
      'd',
      expect.stringContaining('C 21 0, 43 0, 60 14'),
    );
    expect(screen.getByTestId('app_logo__tree_leaf_main_vein')).toBeInTheDocument();
  });
});
