import { Box } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CursorAnchoredTooltip, TooltipContent } from '../CursorAnchoredTooltip';

describe('CursorAnchoredTooltip', () => {
  it('keeps the tooltip anchor and hover bridge fixed while the pointer moves inside the trigger', async () => {
    render(
      <CursorAnchoredTooltip
        arrowDataTest="sample_tooltip_arrow"
        placement="right-start"
        title={
          <TooltipContent sx={{ bgcolor: '#ffffff', p: 1 }}>
            Useful details
          </TooltipContent>
        }
        tooltipSx={{ bgcolor: '#ffffff' }}
      >
        <Box data-test="sample_tooltip_anchor">hover me</Box>
      </CursorAnchoredTooltip>,
    );

    const anchor = screen.getByTestId('sample_tooltip_anchor');

    fireEvent.mouseOver(anchor, { clientX: 220, clientY: 120 });

    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    expect(anchor).toHaveAttribute('data-anchor-x', '220');
    expect(anchor).toHaveAttribute('data-anchor-y', '120');

    fireEvent.mouseMove(anchor, { clientX: 160, clientY: 122 });

    expect(anchor).toHaveAttribute('data-anchor-x', '220');
    expect(anchor).toHaveAttribute('data-anchor-y', '120');
    expect(
      screen.queryByTestId('sample_tooltip_arrow__hover_bridge'),
    ).not.toBeInTheDocument();

    fireEvent.mouseLeave(anchor, { clientX: 224, clientY: 120 });

    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    expect(
      screen.getByTestId('sample_tooltip_arrow__hover_bridge'),
    ).toHaveStyle({
      left: '216px',
      width: '118px',
    });
  });
});
