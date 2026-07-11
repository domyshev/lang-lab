import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import { appReducer } from '../../store/appSlice';
import { CoachPanel } from '../CoachPanel';

function setNarrowViewport(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches,
    media: '(max-width:899.95px)',
    onchange: null,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  }));
}

function renderCoachPanel() {
  const store = configureStore({ reducer: { app: appReducer } });

  render(
    <Provider store={store}>
      <CoachPanel thoughtSeed={0} />
    </Provider>,
  );

  return screen.getByTestId(
    'coach_panel__assistant_sticker_wrapper__studyTroll',
  );
}

describe('CoachPanel', () => {
  it('places the assistant tooltip on the left in wide viewports', async () => {
    setNarrowViewport(false);
    const assistantWrapper = renderCoachPanel();

    fireEvent.mouseOver(assistantWrapper);

    expect(
      (await screen.findByRole('tooltip')).closest('[data-popper-placement]'),
    ).toHaveAttribute('data-popper-placement', expect.stringMatching(/^left/));
  });

  it('places the assistant tooltip on the right in narrow viewports', async () => {
    setNarrowViewport(true);
    const assistantWrapper = renderCoachPanel();
    vi.spyOn(assistantWrapper, 'getBoundingClientRect').mockReturnValue({
      bottom: 220,
      height: 120,
      left: 40,
      right: 160,
      top: 100,
      width: 120,
      x: 40,
      y: 100,
      toJSON: () => undefined,
    });

    fireEvent.mouseOver(assistantWrapper);

    expect(
      (await screen.findByRole('tooltip')).closest('[data-popper-placement]'),
    ).toHaveAttribute('data-popper-placement', expect.stringMatching(/^right/));
    expect(assistantWrapper).toHaveAttribute('data-anchor-x', '160');
  });
});
