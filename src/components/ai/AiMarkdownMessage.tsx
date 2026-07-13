import { ReactNode } from 'react';
import { Box, Divider, Typography } from '@mui/material';

interface AiMarkdownMessageProps {
  content: string;
  dataTest: string;
}

const headingVariants = {
  1: 'h5',
  2: 'h6',
  3: 'subtitle1',
  4: 'subtitle1',
  5: 'body1',
  6: 'body1',
} as const;

export function AiMarkdownMessage({ content, dataTest }: AiMarkdownMessageProps) {
  return (
    <Box
      data-test={dataTest}
      sx={{
        '& > *:first-of-type': { mt: 0 },
        '& > *:last-child': { mb: 0 },
        fontSize: 15,
        lineHeight: 1.55,
      }}
    >
      {renderBlocks(content)}
    </Box>
  );
}

function renderBlocks(content: string): ReactNode[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const nodes: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmedLine)) {
      nodes.push(
        <Divider
          key={`divider-${index}`}
          sx={{
            borderColor: 'rgba(126, 87, 194, 0.18)',
            my: 1.25,
          }}
        />,
      );
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(trimmedLine);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 6) as 1 | 2 | 3 | 4 | 5 | 6;
      nodes.push(
        <Typography
          component={`h${level}`}
          key={`heading-${index}`}
          sx={{
            color: '#223d20',
            fontWeight: 900,
            letterSpacing: 0,
            mt: nodes.length === 0 ? 0 : 1.4,
          }}
          variant={headingVariants[level]}
        >
          {renderInline(headingMatch[2], `heading-${index}`)}
        </Typography>,
      );
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const table = renderTable(lines, index);
      nodes.push(table.node);
      index = table.nextIndex;
      continue;
    }

    if (isListItem(line)) {
      const listItems: string[] = [];
      const startIndex = index;
      while (index < lines.length && isListItem(lines[index])) {
        listItems.push(lines[index].replace(/^\s*[-*]\s+/, '').trim());
        index += 1;
      }
      nodes.push(
        <Box
          component="ul"
          key={`list-${startIndex}`}
          sx={{
            m: 0,
            my: 1,
            pl: 2.4,
          }}
        >
          {listItems.map((item, itemIndex) => (
            <Box component="li" key={`${startIndex}-${itemIndex}`} sx={{ mb: 0.45 }}>
              {renderInline(item, `list-${startIndex}-${itemIndex}`)}
            </Box>
          ))}
        </Box>,
      );
      continue;
    }

    const paragraphLines: string[] = [];
    const startIndex = index;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isSpecialBlockStart(lines, index)
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    nodes.push(
      <Typography key={`paragraph-${startIndex}`} sx={{ my: 0.9 }}>
        {renderInline(paragraphLines.join(' '), `paragraph-${startIndex}`)}
      </Typography>,
    );
  }

  return nodes;
}

function isSpecialBlockStart(lines: string[], index: number): boolean {
  const trimmedLine = lines[index].trim();
  return (
    /^(-{3,}|\*{3,})$/.test(trimmedLine) ||
    /^(#{1,6})\s+/.test(trimmedLine) ||
    isTableStart(lines, index) ||
    isListItem(lines[index])
  );
}

function isListItem(line: string): boolean {
  return /^\s*[-*]\s+/.test(line);
}

function isTableStart(lines: string[], index: number): boolean {
  return (
    index + 1 < lines.length &&
    isTableRow(lines[index]) &&
    isTableSeparator(lines[index + 1])
  );
}

function isTableRow(line: string): boolean {
  return /^\s*\|.+\|\s*$/.test(line);
}

function isTableSeparator(line: string): boolean {
  if (!isTableRow(line)) {
    return false;
  }

  const cells = splitTableCells(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function splitTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function renderTable(lines: string[], startIndex: number): {
  nextIndex: number;
  node: ReactNode;
} {
  const headers = splitTableCells(lines[startIndex]);
  const rows: string[][] = [];
  let index = startIndex + 2;

  while (index < lines.length && isTableRow(lines[index])) {
    rows.push(splitTableCells(lines[index]));
    index += 1;
  }

  return {
    nextIndex: index,
    node: (
      <Box
        data-test={`ai_markdown__table_wrapper__${startIndex}`}
        key={`table-${startIndex}`}
        sx={{
          maxWidth: '100%',
          my: 1.2,
          overflowX: 'auto',
        }}
      >
        <Box
          component="table"
          sx={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            minWidth: 420,
            width: '100%',
            '& th, & td': {
              borderBottom: '1px solid rgba(68, 83, 56, 0.14)',
              borderRight: '1px solid rgba(68, 83, 56, 0.12)',
              px: 1.1,
              py: 0.8,
              textAlign: 'left',
              verticalAlign: 'top',
            },
            '& th:first-of-type, & td:first-of-type': {
              borderLeft: '1px solid rgba(68, 83, 56, 0.12)',
            },
            '& thead th': {
              bgcolor: 'rgba(126, 87, 194, 0.11)',
              borderTop: '1px solid rgba(68, 83, 56, 0.12)',
              color: '#263c22',
              fontWeight: 900,
            },
            '& tbody tr:nth-of-type(even) td': {
              bgcolor: 'rgba(151, 205, 82, 0.07)',
            },
            '& tbody tr:nth-of-type(odd) td': {
              bgcolor: 'rgba(255, 255, 255, 0.52)',
            },
          }}
        >
          <Box component="thead">
            <Box component="tr">
              {headers.map((header, headerIndex) => (
                <Box component="th" key={`header-${headerIndex}`}>
                  {renderInline(header, `table-${startIndex}-header-${headerIndex}`)}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {rows.map((row, rowIndex) => (
              <Box component="tr" key={`row-${rowIndex}`}>
                {headers.map((_, cellIndex) => (
                  <Box component="td" key={`cell-${rowIndex}-${cellIndex}`}>
                    {renderInline(
                      row[cellIndex] ?? '',
                      `table-${startIndex}-cell-${rowIndex}-${cellIndex}`,
                    )}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    ),
  };
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const tokenPattern = /(`[^`\n]+`|\*\*[^*\n]+?\*\*|\*[^*\n]+?\*)/g;
  let lastIndex = 0;
  let tokenIndex = 0;

  for (const match of text.matchAll(tokenPattern)) {
    if (match.index === undefined) {
      continue;
    }

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-inline-${tokenIndex}`;
    if (token.startsWith('**')) {
      nodes.push(
        <Box component="strong" key={key} sx={{ fontWeight: 900 }}>
          {token.slice(2, -2)}
        </Box>,
      );
    } else if (token.startsWith('*')) {
      nodes.push(
        <Box component="em" key={key}>
          {token.slice(1, -1)}
        </Box>,
      );
    } else {
      nodes.push(
        <Box
          component="code"
          key={key}
          sx={{
            bgcolor: 'rgba(126, 87, 194, 0.10)',
            border: '1px solid rgba(126, 87, 194, 0.18)',
            borderRadius: 0.75,
            color: '#4c3476',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.92em',
            px: 0.45,
            py: 0.05,
          }}
        >
          {token.slice(1, -1)}
        </Box>,
      );
    }

    lastIndex = match.index + token.length;
    tokenIndex += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
