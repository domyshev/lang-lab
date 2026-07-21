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

import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import { IconButton, Tooltip, Typography } from '@mui/material';
import { t } from '../domain/i18n';
import { SupportedLanguage } from '../domain/languages';

export function KnownCardToggleButton({
  checked,
  dataTest,
  interfaceLanguage,
  onChange,
}: {
  checked: boolean;
  dataTest: string;
  interfaceLanguage: SupportedLanguage;
  onChange: (isKnown: boolean) => void;
}) {
  return (
    <Tooltip
      arrow
      placement="top"
      slotProps={{
        tooltip: {
          sx: (theme) => ({
            bgcolor: theme.palette.mode === 'dark' ? '#1f2933' : '#ffffff',
            border:
              theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.18)'
                : '1px solid rgba(32, 48, 21, 0.14)',
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 14px 30px rgba(0, 0, 0, 0.32)'
                : '0 14px 30px rgba(32, 48, 21, 0.14)',
            color: theme.palette.mode === 'dark' ? '#f8fafc' : '#203015',
            maxWidth: 280,
            px: 1.8,
            py: 1.2,
          }),
        },
        arrow: {
          sx: (theme) => ({
            color: theme.palette.mode === 'dark' ? '#1f2933' : '#ffffff',
            '&:before': {
              border:
                theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.18)'
                  : '1px solid rgba(32, 48, 21, 0.14)',
            },
          }),
        },
      }}
      title={
        <>
          <Typography sx={{ fontSize: 14.5, fontWeight: 850, lineHeight: 1.25, mb: 0.5 }}>
            {t(interfaceLanguage, 'markCardKnownTooltipTitle')}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 500, lineHeight: 1.35 }}>
            {t(interfaceLanguage, 'markCardKnownTooltip')}
          </Typography>
        </>
      }
    >
      <IconButton
        aria-label={t(interfaceLanguage, 'markCardKnown')}
        aria-pressed={checked}
        data-test={dataTest}
        onClick={() => onChange(!checked)}
        size="small"
        sx={{
          bgcolor: checked ? 'rgba(111, 75, 216, 0.11)' : 'rgba(32, 48, 21, 0.045)',
          border: '1px solid',
          borderColor: checked
            ? 'rgba(111, 75, 216, 0.34)'
            : 'rgba(32, 48, 21, 0.12)',
          boxShadow: checked
            ? '0 5px 12px rgba(111, 75, 216, 0.12)'
            : 'none',
          color: checked ? '#6f4bd8' : 'rgba(32, 48, 21, 0.42)',
          height: 30,
          width: 30,
          '&:hover': {
            bgcolor: checked
              ? 'rgba(111, 75, 216, 0.17)'
              : 'rgba(32, 48, 21, 0.08)',
            color: checked ? '#5b3bc0' : 'rgba(32, 48, 21, 0.62)',
          },
        }}
      >
        <SchoolOutlinedIcon data-test={`${dataTest}__icon`} sx={{ fontSize: 18 }} />
      </IconButton>
    </Tooltip>
  );
}
