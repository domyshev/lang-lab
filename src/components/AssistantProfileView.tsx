import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import {
  AssistantId,
  defaultAssistantId,
  getAssistantProfile,
  resolveAssistantId,
} from '../domain/assistants';
import { t } from '../domain/i18n';
import { resolveWorldId } from '../domain/worlds';
import { RootState } from '../store/store';
import { AssistantStickerIcon } from './assistantAssets';

export function AssistantProfileView({
  assistantId,
}: {
  assistantId?: AssistantId | null;
}) {
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const worldId = useSelector((state: RootState) =>
    resolveWorldId(state.app.worldId),
  );
  const resolvedAssistantId = resolveAssistantId(
    assistantId ?? defaultAssistantId,
    worldId,
  );
  const assistant = getAssistantProfile(
    resolvedAssistantId,
    interfaceLanguage,
    worldId,
  );
  const name = assistant.name[interfaceLanguage];
  const motto = assistant.motto[interfaceLanguage];

  return (
    <Paper
      data-test={`assistant_profile__page__${resolvedAssistantId}`}
      sx={{ p: { xs: 2, md: 3 } }}
    >
      <Stack data-test={`assistant_profile__content__${resolvedAssistantId}`} spacing={3}>
        <Stack
          data-test={`assistant_profile__hero__${resolvedAssistantId}`}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2.5}
          sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}
        >
          <AssistantStickerIcon
            assistantId={resolvedAssistantId}
            dataTest={`assistant_profile__sticker__${resolvedAssistantId}`}
            size={132}
            sx={{ height: { xs: 112, sm: 132 }, width: { xs: 112, sm: 132 } }}
            worldId={worldId}
          />
          <Box data-test={`assistant_profile__hero_text__${resolvedAssistantId}`}>
            <Typography
              component="h2"
              data-test={`assistant_profile__title__${resolvedAssistantId}`}
              variant="h4"
              sx={{ fontWeight: 900, letterSpacing: 0 }}
            >
              {name}
            </Typography>
            <Typography
              data-test={`assistant_profile__motto__${resolvedAssistantId}`}
              sx={{
                color: 'rgba(32, 48, 21, 0.74)',
                fontSize: 18,
                fontStyle: 'italic',
                fontWeight: 700,
                lineHeight: 1.35,
                mt: 0.75,
              }}
            >
              {motto}
            </Typography>
          </Box>
        </Stack>

        <Typography
          data-test={`assistant_profile__description__${resolvedAssistantId}`}
          sx={{ color: '#203015', fontSize: 16, lineHeight: 1.55, maxWidth: 760 }}
        >
          {assistant.description[interfaceLanguage]}
        </Typography>

        <Stack data-test={`assistant_profile__abilities__${resolvedAssistantId}`} spacing={1.25}>
          <Typography
            component="h3"
            data-test={`assistant_profile__abilities_title__${resolvedAssistantId}`}
            variant="h5"
            sx={{ fontWeight: 900 }}
          >
            {t(interfaceLanguage, 'assistantSuperpowersTitle')}
          </Typography>
          <Stack
            data-test={`assistant_profile__abilities_list__${resolvedAssistantId}`}
            spacing={1}
          >
            {assistant.abilities[interfaceLanguage].map((ability, index) => (
              <Stack
                data-test={`assistant_profile__ability__${resolvedAssistantId}__${index}`}
                direction="row"
                key={ability}
                spacing={1}
                sx={{
                  alignItems: 'flex-start',
                  border: '1px solid rgba(111, 75, 216, 0.18)',
                  borderRadius: 1,
                  bgcolor: 'rgba(111, 75, 216, 0.06)',
                  maxWidth: 820,
                  p: 1.25,
                }}
              >
                <AutoAwesomeRoundedIcon
                  data-test={`assistant_profile__ability_icon__${resolvedAssistantId}__${index}`}
                  sx={{ color: '#6f4bd8', flexShrink: 0, fontSize: 20, mt: 0.15 }}
                />
                <Typography
                  data-test={`assistant_profile__ability_text__${resolvedAssistantId}__${index}`}
                  sx={{ color: '#203015', fontSize: 15, lineHeight: 1.45 }}
                >
                  {ability}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
