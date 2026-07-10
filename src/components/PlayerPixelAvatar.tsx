import { Box } from '@mui/material';

type PlayerPixelAvatarProps = {
  ariaLabel?: string;
  dataTest?: string;
  seed: string;
  size?: number;
};

const palette = [
  ['#ff6b6b', '#ffd166', '#5dd39e', '#4d96ff'],
  ['#7c3aed', '#f472b6', '#22d3ee', '#facc15'],
  ['#fb923c', '#84cc16', '#06b6d4', '#a78bfa'],
  ['#ef4444', '#14b8a6', '#f59e0b', '#60a5fa'],
];

export function PlayerPixelAvatar({
  ariaLabel,
  dataTest = 'player_pixel_avatar',
  seed,
  size = 34,
}: PlayerPixelAvatarProps) {
  const hash = hashSeed(seed);
  const colors = palette[hash % palette.length];
  const cells = createMirroredCells(seed);

  return (
    <Box
      aria-label={ariaLabel}
      data-test={dataTest}
      role={ariaLabel ? 'img' : undefined}
      sx={{
        bgcolor: '#203015',
        border: '2px solid rgba(255,255,255,0.86)',
        borderRadius: 1.5,
        boxShadow:
          '0 5px 0 rgba(32, 48, 21, 0.22), 0 10px 18px rgba(32, 48, 21, 0.16)',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        height: size,
        overflow: 'hidden',
        p: '2px',
        width: size,
      }}
    >
      {cells.map((value, index) => (
        <Box
          aria-hidden="true"
          data-test={`${dataTest}__cell_${index}`}
          key={`${seed}-${index}`}
          sx={{
            bgcolor: value === -1 ? 'transparent' : colors[value % colors.length],
            boxShadow:
              value === -1 ? 'none' : 'inset -1px -1px 0 rgba(32, 48, 21, 0.20)',
          }}
        />
      ))}
    </Box>
  );
}

export function createPlayerAvatarSeed(value: string): string {
  const normalized = value.trim();
  return normalized
    ? `player:${normalized}:${hashSeed(normalized)}`
    : `player:anonymous:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function createMirroredCells(seed: string): number[] {
  const hash = hashSeed(seed);
  const cells: number[] = [];
  for (let y = 0; y < 5; y += 1) {
    const row: number[] = [];
    for (let x = 0; x < 3; x += 1) {
      const bit = (hash >> ((x + y * 3) % 24)) & 3;
      row[x] = bit === 0 ? -1 : bit;
    }
    row[3] = row[1];
    row[4] = row[0];
    cells.push(...row);
  }

  cells[12] = (hash % 3) + 1;
  return cells;
}

function hashSeed(seed: string): number {
  return Array.from(seed).reduce((hash, character) => {
    const nextHash = (hash << 5) - hash + character.charCodeAt(0);
    return nextHash >>> 0;
  }, 2166136261);
}
