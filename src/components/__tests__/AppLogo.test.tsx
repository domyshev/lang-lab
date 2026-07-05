import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppLogo } from '../AppLogo';

describe('AppLogo', () => {
  it('keeps a 52px logo button and shows a real leaf accent without resizing the parent', () => {
    render(<AppLogo interfaceLanguage="ru" />);

    const logo = screen.getByRole('button', { name: 'Language Lab' });
    const legacyLeaf = screen.getByTestId('app-logo-leaf');
    const visibleLeaf = screen.getByTestId('app-logo-tree-leaf');

    expect(logo).toHaveStyle({
      alignSelf: 'center',
      height: '52px',
      userSelect: 'none',
    });
    expect(legacyLeaf).toHaveStyle({
      display: 'none',
      height: '12px',
    });
    expect(visibleLeaf.tagName.toLowerCase()).toBe('svg');
    expect(visibleLeaf).toHaveAttribute('viewBox', '0 0 64 28');
    expect(screen.getByTestId('app-logo-leaf-shape')).toHaveAttribute(
      'd',
      expect.stringContaining('C 21 0, 43 0, 60 14'),
    );
    expect(screen.getByTestId('app-logo-leaf-vein')).toBeInTheDocument();
  });
});
