import { Box } from '@mui/material';

type PlayerPixelAvatarProps = {
  ariaLabel?: string;
  dataTest?: string;
  seed: string;
  size?: number;
};

export function PlayerPixelAvatar({
  ariaLabel,
  dataTest = 'player_pixel_avatar',
  seed,
  size = 34,
}: PlayerPixelAvatarProps) {
  const shimmerId = `fan-flag-shimmer-${hashSeed(seed)}`;

  return (
    <Box
      aria-label={ariaLabel}
      component="svg"
      data-test={dataTest}
      focusable="false"
      role={ariaLabel ? 'img' : undefined}
      viewBox="0 0 54 38"
      sx={{
        borderRadius: 1.5,
        boxShadow:
          '0 5px 0 rgba(124, 21, 24, 0.22), 0 10px 18px rgba(32, 48, 21, 0.14)',
        display: 'block',
        height: size,
        overflow: 'hidden',
        width: size,
      }}
    >
      <defs>
        <linearGradient id={shimmerId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.70)" />
          <stop offset="0.45" stopColor="rgba(255,255,255,0.10)" />
          <stop offset="1" stopColor="rgba(32,48,21,0.16)" />
        </linearGradient>
      </defs>
      <rect
        data-test={`${dataTest}__spain_red_top_stripe`}
        fill="#c60b1e"
        height="10"
        width="54"
      />
      <rect
        data-test={`${dataTest}__spain_yellow_stripe`}
        fill="#ffc400"
        height="18"
        width="54"
        y="10"
      />
      <rect
        data-test={`${dataTest}__spain_red_bottom_stripe`}
        fill="#c60b1e"
        height="10"
        width="54"
        y="28"
      />
      <rect
        fill={`url(#${shimmerId})`}
        height="38"
        opacity="0.72"
        width="54"
      />
      <path
        data-test={`${dataTest}__supporter_crest`}
        d="M13 13 h10 v7 c0 5 -3 8 -5 9 c-2 -1 -5 -4 -5 -9 Z"
        fill="#f8f1d7"
        stroke="#7c2d12"
        strokeWidth="1.2"
      />
      <path
        d="M16 16 h4 M16 19 h4 M18 14 v11"
        fill="none"
        stroke="#c60b1e"
        strokeLinecap="round"
        strokeWidth="1.1"
      />
      <path
        d="M27 19 c5 -3 12 -3 17 0"
        fill="none"
        stroke="#7c2d12"
        strokeLinecap="round"
        strokeWidth="1.6"
        opacity="0.55"
      />
      <rect
        fill="none"
        height="36"
        rx="7"
        stroke="rgba(255,255,255,0.86)"
        strokeWidth="2"
        width="52"
        x="1"
        y="1"
      />
    </Box>
  );
}

export function createPlayerAvatarSeed(value: string): string {
  const normalized = value.trim();
  return normalized
    ? `supporter:spain:${normalized}:${hashSeed(normalized)}`
    : `supporter:spain:anonymous:${Date.now()}:${Math.random()
        .toString(36)
        .slice(2)}`;
}

function hashSeed(seed: string): number {
  return Array.from(seed).reduce((hash, character) => {
    const nextHash = (hash << 5) - hash + character.charCodeAt(0);
    return nextHash >>> 0;
  }, 2166136261);
}
