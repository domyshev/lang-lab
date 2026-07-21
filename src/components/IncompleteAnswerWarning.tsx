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

import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Box } from '@mui/material';

export function IncompleteAnswerWarning({
  label,
  pulseKey,
  visible,
}: {
  label: string;
  pulseKey: number;
  visible: boolean;
}) {
  return (
    <Box
      data-test="incomplete_answer_warning__container"
      sx={{
        alignItems: 'center',
        display: 'inline-flex',
        flexShrink: 0,
        height: 38,
        justifyContent: 'center',
        width: 34,
      }}
    >
      {visible && (
        <WarningAmberRoundedIcon
          key={pulseKey}
          aria-label={label}
          className="missingInputWarning"
          data-test="incomplete_answer_warning__icon"
          sx={{ color: '#d6a500', fontSize: 30 }}
        />
      )}
    </Box>
  );
}
