import { Box, Tooltip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import {
  cloneElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useMemo,
  useState,
} from 'react';

type TooltipAnchorPosition = {
  x: number;
  y: number;
};

export function CursorAnchoredTooltip({
  arrowDataTest,
  children,
  leaveDelay = 420,
  placement = 'top',
  title,
  transitionTimeout,
  tooltipSx,
}: {
  arrowDataTest: string;
  children: ReactElement;
  leaveDelay?: number;
  placement?: 'top' | 'top-start' | 'top-end';
  title: ReactNode;
  transitionTimeout?: number;
  tooltipSx: SxProps<Theme>;
}) {
  const [anchorPosition, setAnchorPosition] =
    useState<TooltipAnchorPosition | null>(null);
  const virtualAnchor = useMemo(
    () =>
      anchorPosition
        ? {
            getBoundingClientRect: () => ({
              bottom: anchorPosition.y,
              height: 0,
              left: anchorPosition.x,
              right: anchorPosition.x,
              top: anchorPosition.y,
              width: 0,
              x: anchorPosition.x,
              y: anchorPosition.y,
              toJSON: () => undefined,
            }),
          }
        : undefined,
    [anchorPosition],
  );
  const tooltipSlotProps = useMemo(
    () => ({
      arrow: {
        'data-test': arrowDataTest,
        sx: {
          color: '#ffffff',
          '&:before': {
            border: '1px solid rgba(32, 48, 21, 0.14)',
          },
        },
      },
      popper: {
        ...(virtualAnchor ? { anchorEl: virtualAnchor } : {}),
        popperOptions: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 8],
              },
            },
            {
              enabled: false,
              name: 'flip',
            },
            {
              enabled: false,
              name: 'preventOverflow',
            },
          ],
        },
      },
      ...(transitionTimeout === undefined
        ? {}
        : {
            transition: {
              timeout: transitionTimeout,
            },
          }),
      tooltip: {
        sx: tooltipSx,
      },
    }),
    [arrowDataTest, tooltipSx, transitionTimeout, virtualAnchor],
  );

  const handleMouseOver = (event: MouseEvent<HTMLElement>) => {
    setAnchorPosition(
      (currentPosition) =>
        currentPosition ?? { x: event.clientX, y: event.clientY },
    );
  };

  return (
    <Tooltip
      arrow
      leaveDelay={leaveDelay}
      onClose={() => setAnchorPosition(null)}
      placement={placement}
      slotProps={tooltipSlotProps}
      title={title}
    >
      {cloneElement(children, {
        'data-anchor-x': anchorPosition?.x ?? '',
        'data-anchor-y': anchorPosition?.y ?? '',
        onMouseOver: handleMouseOver,
      })}
    </Tooltip>
  );
}

export function TooltipContent({
  children,
  sx,
}: {
  children: ReactNode;
  sx: SxProps<Theme>;
}) {
  return (
    <Box component="span" sx={sx}>
      {children}
    </Box>
  );
}
