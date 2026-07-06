import { Box, Tooltip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import {
  cloneElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { flushSync } from 'react-dom';

type TooltipAnchorPosition = {
  x: number;
  y: number;
};

export function CursorAnchoredTooltip({
  arrowDataTest,
  children,
  closeOnOtherOpen = false,
  leaveDelay = 420,
  placement = 'top',
  preventOverflow = false,
  title,
  transitionTimeout,
  tooltipSx,
}: {
  arrowDataTest: string;
  children: ReactElement;
  closeOnOtherOpen?: boolean;
  leaveDelay?: number;
  placement?: 'top' | 'top-start' | 'top-end';
  preventOverflow?: boolean;
  title: ReactNode;
  transitionTimeout?: number;
  tooltipSx: SxProps<Theme>;
}) {
  const instanceId = useId();
  const [anchorPosition, setAnchorPosition] =
    useState<TooltipAnchorPosition | null>(null);

  useEffect(() => {
    if (!closeOnOtherOpen) {
      return undefined;
    }

    cursorTooltipClosers.set(instanceId, () => setAnchorPosition(null));

    return () => {
      cursorTooltipClosers.delete(instanceId);
    };
  }, [closeOnOtherOpen, instanceId]);

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
              enabled: preventOverflow,
              name: 'preventOverflow',
              options: {
                altAxis: true,
                padding: 8,
                tether: false,
              },
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
    [arrowDataTest, preventOverflow, tooltipSx, transitionTimeout, virtualAnchor],
  );

  const handleMouseOver = (event: MouseEvent<HTMLElement>) => {
    if (closeOnOtherOpen) {
      flushSync(() => {
        for (const [tooltipId, closeTooltip] of cursorTooltipClosers) {
          if (tooltipId !== instanceId) {
            closeTooltip();
          }
        }
      });
    }
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
      open={Boolean(anchorPosition)}
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

const cursorTooltipClosers = new Map<string, () => void>();

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
