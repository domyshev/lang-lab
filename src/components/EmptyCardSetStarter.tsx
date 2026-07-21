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

import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import { addCardSet } from '../store/cardSetsSlice';
import { AppDispatch } from '../store/store';

export function EmptyCardSetStarter() {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState('');

  const createCardSet = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const now = new Date().toISOString();
    dispatch(
      addCardSet({
        id: createCardSetId(),
        name: trimmedName,
        cardIds: [],
        createdAt: now,
        updatedAt: now,
      }),
    );
    setName('');
  };

  return (
    <Paper data-test="empty_card_set_starter__panel" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        data-test="empty_card_set_starter__content"
        spacing={2}
        alignItems="flex-start"
      >
        <Stack data-test="empty_card_set_starter__header" spacing={0.5}>
          <Typography
            data-test="empty_card_set_starter__title"
            variant="h5"
            component="h2"
            sx={{ fontWeight: 800 }}
          >
            Create your first card set
          </Typography>
          <Typography
            color="text.secondary"
            data-test="empty_card_set_starter__description"
          >
            Card sets group imported cards into focused practice sets.
          </Typography>
        </Stack>

        <Stack
          data-test="empty_card_set_starter__form"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ width: '100%' }}
        >
          <TextField
            data-test="empty_card_set_starter__name_input"
            label="Card set name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                createCardSet();
              }
            }}
            fullWidth
          />
          <Button
            data-test="empty_card_set_starter__create_button"
            startIcon={<AddIcon />}
            variant="contained"
            onClick={createCardSet}
            disabled={!name.trim()}
            sx={{ minWidth: 150 }}
          >
            Create
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function createCardSetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `card-set-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
