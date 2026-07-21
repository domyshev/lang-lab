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
    expect(chip).toHaveAccessibleName('Статистика последних ответов');
    expect(chip).not.toHaveTextContent('Статистика последних ответов');
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
