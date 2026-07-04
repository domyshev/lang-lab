import { SupportedLanguage } from './languages';

export const coachThoughts: Record<SupportedLanguage, string[]> = {
  en: buildThoughts(
    [
      'Champion mode is warming up',
      'I had no doubts about this brain',
      'Push a little, the word is close',
      'Your neurons just did a tiny victory lap',
      'This is not luck, this is training',
      'The next answer is already nervous',
      'Steady pace beats dramatic panic',
      'Your vocabulary is putting on sneakers',
      'I see progress pretending to be casual',
      'Good focus, clean swing',
    ],
    [
      'Keep the tempo.',
      'No need to look heroic, just precise.',
      'One letter at a time.',
      'The scoreboard is paying attention.',
      'Tiny steps still count.',
      'Stay sharp and stylish.',
      'The next card has been warned.',
      'A calm brain is a fast brain.',
      'Let the mistake teach, then move.',
      'We are building a dangerous memory palace.',
    ],
  ),
  es: buildThoughts(
    [
      'Modo campeon encendiendo motores',
      'Yo no dudaba de esa cabeza',
      'Aprieta un poco, la palabra esta cerca',
      'Tus neuronas acaban de celebrar',
      'Esto no es suerte, es entrenamiento',
      'La proxima respuesta ya esta nerviosa',
      'Ritmo estable gana al panico teatral',
      'Tu vocabulario se puso zapatillas',
      'Veo progreso haciendose el casual',
      'Buen foco, golpe limpio',
    ],
    [
      'Manten el ritmo.',
      'No hace falta posar, solo acertar.',
      'Una letra cada vez.',
      'El marcador esta mirando.',
      'Los pasos pequenos tambien cuentan.',
      'Sigue fino y con estilo.',
      'La siguiente tarjeta ya esta avisada.',
      'Una mente tranquila corre mas.',
      'Que el error ensene y seguimos.',
      'Estamos construyendo un palacio de memoria peligroso.',
    ],
  ),
  ru: buildThoughts(
    [
      'Ты победитель по жизни',
      'Я в тебе не сомневался',
      'Поднажми, слово уже рядом',
      'Нейроны сделали маленький круг почета',
      'Это не удача, это тренировка',
      'Следующий ответ уже нервничает',
      'Ровный темп сильнее паники',
      'Словарный запас надел кроссовки',
      'Вижу прогресс, он притворяется случайным',
      'Фокус хороший, удар чистый',
    ],
    [
      'Держим темп.',
      'Не надо героизма, нужна точность.',
      'По одной букве за раз.',
      'Табло внимательно смотрит.',
      'Маленькие шаги тоже считаются.',
      'Действуй четко и красиво.',
      'Следующая карточка предупреждена.',
      'Спокойная голова работает быстрее.',
      'Ошибка учит, а мы идем дальше.',
      'Строим опасно крепкий дворец памяти.',
    ],
  ),
};

export function getCoachThought(
  interfaceLanguage: SupportedLanguage,
  seed: number,
): string {
  const thoughts = coachThoughts[interfaceLanguage];
  return thoughts[Math.abs(Math.trunc(seed)) % thoughts.length];
}

function buildThoughts(openings: string[], endings: string[]): string[] {
  return openings.flatMap((opening) =>
    endings.map((ending) => `${opening}. ${ending}`),
  );
}
