import { Box } from '@mui/material';

type PlayerPixelAvatarProps = {
  ariaLabel?: string;
  country?: SupporterCountry;
  dataTest?: string;
  seed: string;
  size?: number;
};

export type SupporterCountry =
  | 'spain'
  | 'portugal'
  | 'england'
  | 'germany'
  | 'forest';

export function PlayerPixelAvatar({
  ariaLabel,
  country = 'spain',
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
      <SupporterFlag country={country} dataTest={dataTest} />
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

function SupporterFlag({
  country,
  dataTest,
}: {
  country: SupporterCountry;
  dataTest: string;
}) {
  switch (country) {
    case 'forest':
      return (
        <>
          <rect
            data-test={`${dataTest}__forest_sky`}
            fill="#dff2c4"
            height="38"
            width="54"
          />
          <rect
            data-test={`${dataTest}__forest_moss`}
            fill="#8cc66f"
            height="17"
            width="54"
            y="21"
          />
          <path
            data-test={`${dataTest}__forest_leaf`}
            d="M11 24c11-16 25-18 36-10-8 11-21 17-36 10Z"
            fill="#4f8e5b"
            stroke="#203015"
            strokeWidth="1.2"
          />
          <path
            d="M15 23c8-2 17-5 28-9"
            fill="none"
            stroke="#f7ffe5"
            strokeLinecap="round"
            strokeWidth="1.3"
          />
        </>
      );
    case 'portugal':
      return (
        <>
          <rect
            data-test={`${dataTest}__portugal_green_field`}
            fill="#046a38"
            height="38"
            width="22"
          />
          <rect
            data-test={`${dataTest}__portugal_red_field`}
            fill="#da291c"
            height="38"
            width="32"
            x="22"
          />
          <circle
            data-test={`${dataTest}__portugal_crest`}
            cx="22"
            cy="19"
            fill="#ffd100"
            r="5"
            stroke="#ffffff"
            strokeWidth="1"
          />
        </>
      );
    case 'england':
      return (
        <>
          <rect
            data-test={`${dataTest}__england_white_field`}
            fill="#fffdf4"
            height="38"
            width="54"
          />
          <rect
            data-test={`${dataTest}__england_red_cross_horizontal`}
            fill="#c8102e"
            height="7"
            width="54"
            y="15.5"
          />
          <rect
            data-test={`${dataTest}__england_red_cross_vertical`}
            fill="#c8102e"
            height="38"
            width="7"
            x="23.5"
          />
        </>
      );
    case 'germany':
      return (
        <>
          <rect
            data-test={`${dataTest}__germany_black_stripe`}
            fill="#111111"
            height="13"
            width="54"
          />
          <rect
            data-test={`${dataTest}__germany_red_stripe`}
            fill="#dd0000"
            height="12"
            width="54"
            y="13"
          />
          <rect
            data-test={`${dataTest}__germany_yellow_stripe`}
            fill="#ffce00"
            height="13"
            width="54"
            y="25"
          />
        </>
      );
    case 'spain':
    default:
      return (
        <>
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
        </>
      );
  }
}

export function createPlayerAvatarSeed(
  value: string,
  country: SupporterCountry = 'spain',
): string {
  const normalized = value.trim();
  return normalized
    ? `supporter:${country}:${normalized}:${hashSeed(`${country}:${normalized}`)}`
    : `supporter:${country}:anonymous:${Date.now()}:${Math.random()
        .toString(36)
        .slice(2)}`;
}

function hashSeed(seed: string): number {
  return Array.from(seed).reduce((hash, character) => {
    const nextHash = (hash << 5) - hash + character.charCodeAt(0);
    return nextHash >>> 0;
  }, 2166136261);
}
