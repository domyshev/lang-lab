import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { RecentAnswersChip } from '../RecentAnswersChip';

describe('RecentAnswersChip', () => {
  it('opens from keyboard focus with a high-contrast focus-visible ring', async () => {
    const user = userEvent.setup();
    render(
      <RecentAnswersChip
        dataTestPrefix="recent_answer"
        interfaceLanguage="ru"
        recentResults={[
          { isCorrect: true, occurredAt: '2026-07-11T12:00:00.000Z' },
        ]}
        subject="airport"
      />,
    );

    const chip = screen.getByTestId('recent_answer__recent_stats_chip');
    await user.tab();

    expect(chip).toHaveFocus();
    expect(
      await screen.findByTestId('recent_answer__recent_tooltip'),
    ).toBeInTheDocument();

    const focusVisibleStyle = getFocusVisibleStyle(chip);
    expect(focusVisibleStyle?.getPropertyValue('outline')).toBe(
      '3px solid #111111',
    );
    expect(focusVisibleStyle?.getPropertyValue('outline-offset')).toBe('2px');
  });
});

function getFocusVisibleStyle(
  element: HTMLElement,
): CSSStyleDeclaration | undefined {
  const classSelectors = Array.from(element.classList, (name) => `.${name}`);

  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      const styleRule = rule as CSSStyleRule;
      if (
        styleRule.selectorText?.includes(':focus-visible') &&
        classSelectors.some((selector) =>
          styleRule.selectorText.includes(selector),
        )
      ) {
        return styleRule.style;
      }
    }
  }

  return undefined;
}
