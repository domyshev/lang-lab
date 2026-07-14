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
  | 'forest'
  | 'forest-elf'
  | 'unicorn'
  | 'ladybug'
  | 'mortal-kombat'
  | 'mk-flame-ninja'
  | 'mk-ice-guardian'
  | 'mk-shadow-queen'
  | 'mk-thunder-monk'
  | 'starfleet'
  | 'trek-chief-engineer'
  | 'trek-helm-pilot'
  | 'trek-science-officer'
  | 'trek-star-captain';

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
    case 'trek-star-captain':
      return (
        <>
          <rect
            data-test={`${dataTest}__trek_star_captain_space`}
            fill="#101b4d"
            height="38"
            width="54"
          />
          <rect fill="#f3b833" height="15" width="54" y="23" />
          <path
            data-test={`${dataTest}__trek_star_captain_delta`}
            d="M28 5 40 31 28 25 16 31Z"
            fill="#fff8dc"
            stroke="#101b4d"
            strokeLinejoin="round"
            strokeWidth="1.35"
          />
          <circle cx="9" cy="9" fill="#f7fbff" r="1.2" />
          <circle cx="44" cy="13" fill="#f7fbff" r="1.35" />
        </>
      );
    case 'trek-science-officer':
      return (
        <>
          <rect
            data-test={`${dataTest}__trek_science_officer_nebula`}
            fill="#102a5f"
            height="38"
            width="54"
          />
          <path
            d="M0 28c10-9 22-8 32-3 8 4 14 2 22-5v18H0Z"
            fill="#5cc8ff"
            opacity="0.78"
          />
          <circle
            data-test={`${dataTest}__trek_science_officer_orbit`}
            cx="28"
            cy="19"
            fill="#dff8ff"
            r="7"
            stroke="#101b4d"
            strokeWidth="1.2"
          />
          <path
            d="M13 19c8-7 22-7 30 0M13 19c8 7 22 7 30 0"
            fill="none"
            stroke="#f3b833"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </>
      );
    case 'trek-chief-engineer':
      return (
        <>
          <rect
            data-test={`${dataTest}__trek_chief_engineer_engine`}
            fill="#231022"
            height="38"
            width="54"
          />
          <rect fill="#d6423a" height="16" width="54" y="22" />
          <path
            data-test={`${dataTest}__trek_chief_engineer_core`}
            d="M15 9h24v20H15Z"
            fill="#f3b833"
            stroke="#fff8dc"
            strokeWidth="1.2"
          />
          <path
            d="M20 14h14M20 20h14M27 9v20"
            stroke="#231022"
            strokeLinecap="round"
            strokeWidth="1.7"
          />
        </>
      );
    case 'trek-helm-pilot':
      return (
        <>
          <rect
            data-test={`${dataTest}__trek_helm_pilot_course`}
            fill="#0d2433"
            height="38"
            width="54"
          />
          <path
            d="M5 30C18 10 33 7 49 16"
            fill="none"
            stroke="#5cc8ff"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="M11 27 27 14l-2 11 14 3Z"
            fill="#f3b833"
            stroke="#f7fbff"
            strokeLinejoin="round"
            strokeWidth="1.1"
          />
        </>
      );
    case 'mk-flame-ninja':
      return (
        <>
          <rect
            data-test={`${dataTest}__mk_flame_ninja_arena`}
            fill="#260909"
            height="38"
            width="54"
          />
          <rect fill="#d43f24" height="16" width="54" y="22" />
          <path
            data-test={`${dataTest}__mk_flame_ninja_fire`}
            d="M28 31c-9-5-8-13-1-24 1 7 8 8 7 15 4-3 6-7 5-12 8 11 3 21-11 21Z"
            fill="#ffb03a"
            stroke="#fff1d6"
            strokeLinejoin="round"
            strokeWidth="1.1"
          />
        </>
      );
    case 'mk-ice-guardian':
      return (
        <>
          <rect
            data-test={`${dataTest}__mk_ice_guardian_frost`}
            fill="#0d2347"
            height="38"
            width="54"
          />
          <rect fill="#76d7ff" height="15" width="54" y="23" />
          <path
            data-test={`${dataTest}__mk_ice_guardian_crystal`}
            d="M27 5 39 17 33 32H21L15 17Z"
            fill="#e7fbff"
            stroke="#1f6f9f"
            strokeLinejoin="round"
            strokeWidth="1.3"
          />
          <path
            d="M27 5v27M15 17h24"
            stroke="#76d7ff"
            strokeLinecap="round"
            strokeWidth="1.2"
          />
        </>
      );
    case 'mk-shadow-queen':
      return (
        <>
          <rect
            data-test={`${dataTest}__mk_shadow_queen_void`}
            fill="#17091e"
            height="38"
            width="54"
          />
          <rect fill="#6b1d72" height="15" width="54" y="23" />
          <path
            data-test={`${dataTest}__mk_shadow_queen_moon`}
            d="M33 7c-8 1-14 7-14 14s6 12 14 13c-4-4-6-8-6-13s2-10 6-14Z"
            fill="#f4d7ff"
            stroke="#ffb03a"
            strokeLinejoin="round"
            strokeWidth="1.1"
          />
          <path
            d="M12 28c9-10 20-13 31-9"
            fill="none"
            stroke="#ffb03a"
            strokeLinecap="round"
            strokeWidth="1.6"
          />
        </>
      );
    case 'mk-thunder-monk':
      return (
        <>
          <rect
            data-test={`${dataTest}__mk_thunder_monk_storm`}
            fill="#24113d"
            height="38"
            width="54"
          />
          <rect fill="#d43f24" height="14" width="54" y="24" />
          <path
            data-test={`${dataTest}__mk_thunder_monk_bolt`}
            d="M31 4 17 22h10l-4 13 16-20H28Z"
            fill="#ffdf64"
            stroke="#fff1d6"
            strokeLinejoin="round"
            strokeWidth="1.1"
          />
        </>
      );
    case 'starfleet':
      return (
        <>
          <rect
            data-test={`${dataTest}__starfleet_space`}
            fill="#101b4d"
            height="38"
            width="54"
          />
          <path
            d="M0 29c10-8 20-8 29-2 8 5 15 4 25-5v16H0Z"
            fill="#3f88ff"
            opacity="0.72"
          />
          <path
            data-test={`${dataTest}__starfleet_delta`}
            d="M28 6 39 30 28 24 17 30Z"
            fill="#f3b833"
            stroke="#f7fbff"
            strokeLinejoin="round"
            strokeWidth="1.3"
          />
          <circle cx="11" cy="9" fill="#f7fbff" r="1.5" />
          <circle cx="44" cy="13" fill="#f7fbff" r="1.2" />
        </>
      );
    case 'mortal-kombat':
      return (
        <>
          <rect
            data-test={`${dataTest}__mortal_kombat_arena`}
            fill="#260909"
            height="38"
            width="54"
          />
          <rect fill="#d43f24" height="18" width="54" y="20" />
          <path
            data-test={`${dataTest}__mortal_kombat_dragon`}
            d="M12 24c9-16 24-20 37-12-4 11-15 19-30 19 9-4 15-10 18-18-8 3-14 8-25 11Z"
            fill="#ffb03a"
            stroke="#fff1d6"
            strokeLinejoin="round"
            strokeWidth="1.1"
          />
          <path
            d="M21 28c8-3 16-8 24-16"
            fill="none"
            stroke="#260909"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </>
      );
    case 'ladybug':
      return (
        <>
          <rect
            data-test={`${dataTest}__ladybug_meadow`}
            fill="#e8f9cf"
            height="38"
            width="54"
          />
          <rect fill="#8cc66f" height="13" width="54" y="25" />
          <circle
            data-test={`${dataTest}__ladybug_shell`}
            cx="34"
            cy="19"
            fill="#d9463e"
            r="11"
            stroke="#203015"
            strokeWidth="1.3"
          />
          <path
            d="M34 9v20"
            stroke="#203015"
            strokeLinecap="round"
            strokeWidth="1.2"
          />
          <circle cx="29" cy="16" fill="#203015" r="1.8" />
          <circle cx="39" cy="16" fill="#203015" r="1.8" />
          <circle cx="31" cy="23" fill="#203015" r="1.8" />
          <circle cx="37" cy="23" fill="#203015" r="1.8" />
        </>
      );
    case 'unicorn':
      return (
        <>
          <rect
            data-test={`${dataTest}__unicorn_sky`}
            fill="#eef7ff"
            height="38"
            width="54"
          />
          <path
            d="M0 28c9-7 17-7 25-2 9 5 18 5 29-3v15H0Z"
            fill="#dff2c4"
          />
          <path
            data-test={`${dataTest}__unicorn_mane`}
            d="M14 28c5-13 17-18 27-12-2 11-13 18-27 12Z"
            fill="#f6efff"
            stroke="#6f4fa6"
            strokeWidth="1.2"
          />
          <path
            d="M20 25c5-3 11-6 18-9"
            fill="none"
            stroke="#ffb6d5"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            d="M34 14l5-8 2 10Z"
            fill="#ffe08a"
            stroke="#7c5a14"
            strokeLinejoin="round"
            strokeWidth="1"
          />
        </>
      );
    case 'forest-elf':
      return (
        <>
          <rect
            data-test={`${dataTest}__forest_elf_glade`}
            fill="#f4ffd8"
            height="38"
            width="54"
          />
          <rect fill="#75b85a" height="15" width="54" y="23" />
          <path
            data-test={`${dataTest}__forest_elf_leaf_shield`}
            d="M12 24c6-15 18-19 31-12-5 14-18 19-31 12Z"
            fill="#58a76f"
            stroke="#203015"
            strokeWidth="1.2"
          />
          <path
            d="M19 23c7-5 14-8 22-11"
            fill="none"
            stroke="#f7ffe5"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
          <path
            d="M13 15l7 4-7 4ZM42 15l-7 4 7 4Z"
            fill="#bdeba2"
            stroke="#203015"
            strokeLinejoin="round"
            strokeWidth="1"
          />
        </>
      );
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
