import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppLogo } from '../AppLogo';

describe('AppLogo', () => {
  it('keeps a clipped leaf accent instead of an inner rounded rectangle', () => {
    render(<AppLogo interfaceLanguage="ru" />);

    const logo = screen.getByRole('button', { name: 'Language Lab' });
    const leaf = screen.getByTestId('app-logo-leaf');

    expect(logo).toHaveStyle({ alignSelf: 'center', userSelect: 'none' });
    expect(leaf).toHaveStyle({
      borderTopLeftRadius: '0',
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 18% 100%)',
    });
  });
});
