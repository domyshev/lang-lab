import { Box, Tooltip } from '@mui/material';
import type { SxProps, Theme as MuiTheme } from '@mui/material/styles';
import {
  cloneElement,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';

type TooltipAnchorPosition = {
  x: number;
  y: number;
};

type TooltipPlacement =
  | 'bottom'
  | 'bottom-end'
  | 'bottom-start'
  | 'left'
  | 'left-end'
  | 'left-start'
  | 'right'
  | 'right-end'
  | 'right-start'
  | 'top'
  | 'top-end'
  | 'top-start';

type TooltipChildHandlers = {
  onMouseEnter?: (event: ReactMouseEvent<HTMLElement>) => void;
  onMouseLeave?: (event: ReactMouseEvent<HTMLElement>) => void;
  onMouseMove?: (event: ReactMouseEvent<HTMLElement>) => void;
  onMouseOver?: (event: ReactMouseEvent<HTMLElement>) => void;
};

export function CursorAnchoredTooltip({
  arrowDataTest,
  children,
  closeOnOtherOpen = false,
  hideArrow = false,
  leaveDelay = 0,
  placement = 'top',
  preventOverflow = false,
  title,
  transitionTimeout,
  tooltipSx,
}: {
  arrowDataTest: string;
  children: ReactElement;
  closeOnOtherOpen?: boolean;
  hideArrow?: boolean;
  leaveDelay?: number;
  placement?: TooltipPlacement;
  preventOverflow?: boolean;
  title: ReactNode;
  transitionTimeout?: number;
  tooltipSx: SxProps<MuiTheme>;
}) {
  const instanceId = useId();
  const bridgeHoveredRef = useRef(false);
  const lastAnchorPositionRef = useRef<TooltipAnchorPosition | null>(null);
  const tooltipHoveredRef = useRef(false);
  const [anchorPosition, setAnchorPosition] =
    useState<TooltipAnchorPosition | null>(null);
  const [isImmediateClose, setIsImmediateClose] = useState(false);
  const [isTriggerHovered, setIsTriggerHovered] = useState(false);

  const closeTooltip = useCallback((immediate = false) => {
    bridgeHoveredRef.current = false;
    tooltipHoveredRef.current = false;
    setIsImmediateClose(immediate);
    setAnchorPosition(null);
    setIsTriggerHovered(false);
  }, []);

  useEffect(() => {
    if (!closeOnOtherOpen) {
      return undefined;
    }

    cursorTooltipClosers.set(instanceId, closeTooltip);

    return () => {
      cursorTooltipClosers.delete(instanceId);
    };
  }, [closeOnOtherOpen, closeTooltip, instanceId]);

  const tooltipAnchorPosition = anchorPosition ?? lastAnchorPositionRef.current;
  const virtualAnchor = useMemo(
    () =>
      tooltipAnchorPosition
        ? {
            getBoundingClientRect: () => ({
              bottom: tooltipAnchorPosition.y,
              height: 0,
              left: tooltipAnchorPosition.x,
              right: tooltipAnchorPosition.x,
              top: tooltipAnchorPosition.y,
              width: 0,
              x: tooltipAnchorPosition.x,
              y: tooltipAnchorPosition.y,
              toJSON: () => undefined,
            }),
          }
        : undefined,
    [tooltipAnchorPosition],
  );
  const tooltipSlotProps = useMemo(
    () => ({
      arrow: {
        'data-test': arrowDataTest,
        sx: {
          color: '#ffffff',
          display: hideArrow ? 'none' : undefined,
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
                offset: [0, hideArrow ? 14 : 8],
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
        ? isImmediateClose
          ? {
              transition: {
                timeout: 0,
              },
            }
          : {}
        : {
            transition: {
              timeout: isImmediateClose ? 0 : transitionTimeout,
            },
          }),
      tooltip: {
        onMouseEnter: () => {
          tooltipHoveredRef.current = true;
        },
        onMouseLeave: () => {
          tooltipHoveredRef.current = false;
          closeTooltip();
        },
        sx: tooltipSx,
      },
    }),
    [
      arrowDataTest,
      closeTooltip,
      hideArrow,
      isImmediateClose,
      preventOverflow,
      tooltipSx,
      transitionTimeout,
      virtualAnchor,
    ],
  );

  const bridgeSx = useMemo(
    () =>
      anchorPosition
        ? getTooltipBridgeSx(anchorPosition, placement)
        : undefined,
    [anchorPosition, placement],
  );

  const openAtPointer = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      const nextPosition = { x: event.clientX, y: event.clientY };

      setIsTriggerHovered(true);

      if (anchorPosition) {
        return;
      }

      setIsImmediateClose(false);

      if (closeOnOtherOpen) {
        flushSync(() => {
          for (const [tooltipId, closeOtherTooltip] of cursorTooltipClosers) {
            if (tooltipId !== instanceId) {
              closeOtherTooltip(true);
            }
          }
        });
      }

      lastAnchorPositionRef.current = nextPosition;
      setAnchorPosition(nextPosition);
    },
    [anchorPosition, closeOnOtherOpen, instanceId],
  );

  const handleClose = (event: SyntheticEvent | Event) => {
    const eventPoint = getEventPoint(event);
    if (
      bridgeHoveredRef.current ||
      tooltipHoveredRef.current ||
      (eventPoint &&
        anchorPosition &&
        isPointInsideTooltipBridge(
          eventPoint,
          anchorPosition,
          placement,
        ))
    ) {
      return;
    }

    closeTooltip();
  };

  const childProps = children.props as TooltipChildHandlers;

  return (
    <>
      <Tooltip
        arrow
        leaveDelay={leaveDelay}
        onClose={handleClose}
        open={Boolean(anchorPosition)}
        placement={placement}
        slotProps={tooltipSlotProps}
        title={isImmediateClose ? '' : title}
      >
        {cloneElement(children, {
          'data-anchor-x': anchorPosition?.x ?? '',
          'data-anchor-y': anchorPosition?.y ?? '',
          onMouseEnter: (event: ReactMouseEvent<HTMLElement>) => {
            childProps.onMouseEnter?.(event);
            openAtPointer(event);
          },
          onMouseLeave: (event: ReactMouseEvent<HTMLElement>) => {
            childProps.onMouseLeave?.(event);
            setIsTriggerHovered(false);
          },
          onMouseMove: (event: ReactMouseEvent<HTMLElement>) => {
            childProps.onMouseMove?.(event);
          },
          onMouseOver: (event: ReactMouseEvent<HTMLElement>) => {
            childProps.onMouseOver?.(event);
            openAtPointer(event);
          },
        })}
      </Tooltip>
      {anchorPosition && bridgeSx && !isTriggerHovered && (
        <Box
          aria-hidden="true"
          data-test={`${arrowDataTest}__hover_bridge`}
          onMouseEnter={() => {
            bridgeHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            bridgeHoveredRef.current = false;
            if (!tooltipHoveredRef.current) {
              closeTooltip();
            }
          }}
          sx={bridgeSx}
        />
      )}
    </>
  );
}

const cursorTooltipClosers = new Map<string, (immediate?: boolean) => void>();

function getTooltipBridgeSx(
  anchorPosition: TooltipAnchorPosition,
  placement: TooltipPlacement,
): SxProps<MuiTheme> {
  const bridgeSize = 118;
  const crossAxisSize = 72;
  const halfCrossAxis = crossAxisSize / 2;
  const baseSx = {
    bgcolor: 'transparent',
    pointerEvents: 'auto',
    position: 'fixed',
    zIndex: 1499,
  };

  if (placement.startsWith('right')) {
    return {
      ...baseSx,
      height: crossAxisSize,
      left: anchorPosition.x - 4,
      top: anchorPosition.y - halfCrossAxis,
      width: bridgeSize,
    };
  }

  if (placement.startsWith('left')) {
    return {
      ...baseSx,
      height: crossAxisSize,
      left: anchorPosition.x - bridgeSize + 4,
      top: anchorPosition.y - halfCrossAxis,
      width: bridgeSize,
    };
  }

  if (placement.startsWith('bottom')) {
    return {
      ...baseSx,
      height: bridgeSize,
      left: anchorPosition.x - halfCrossAxis,
      top: anchorPosition.y - 4,
      width: crossAxisSize,
    };
  }

  return {
    ...baseSx,
    height: bridgeSize,
    left: anchorPosition.x - halfCrossAxis,
    top: anchorPosition.y - bridgeSize + 4,
    width: crossAxisSize,
  };
}

function isPointInsideTooltipBridge(
  point: TooltipAnchorPosition,
  anchorPosition: TooltipAnchorPosition,
  placement: TooltipPlacement,
): boolean {
  const bridgeSx = getTooltipBridgeSx(
    anchorPosition,
    placement,
  ) as {
    height: number;
    left: number;
    top: number;
    width: number;
  };

  return (
    point.x >= bridgeSx.left &&
    point.x <= bridgeSx.left + bridgeSx.width &&
    point.y >= bridgeSx.top &&
    point.y <= bridgeSx.top + bridgeSx.height
  );
}

function getEventPoint(event: SyntheticEvent | Event) {
  const maybeNativeEvent =
    'nativeEvent' in event ? event.nativeEvent : event;

  if (
    maybeNativeEvent &&
    typeof maybeNativeEvent === 'object' &&
    'clientX' in maybeNativeEvent &&
    'clientY' in maybeNativeEvent &&
    typeof maybeNativeEvent.clientX === 'number' &&
    typeof maybeNativeEvent.clientY === 'number'
  ) {
    return {
      x: maybeNativeEvent.clientX,
      y: maybeNativeEvent.clientY,
    };
  }

  return null;
}

export function TooltipContent({
  children,
  sx,
}: {
  children: ReactNode;
  sx: SxProps<MuiTheme>;
}) {
  return (
    <Box component="span" sx={sx}>
      {children}
    </Box>
  );
}
