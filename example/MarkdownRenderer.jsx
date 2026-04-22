import React, { Fragment, useMemo, useState } from 'react';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=,./?<>:;"'|\\[\]{}]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseMarkdown(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  let headingCount = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      i += 1;
      const codeLines = [];
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length && lines[i].startsWith('```')) {
        i += 1;
      }
      blocks.push({ type: 'code', language, content: codeLines.join('\n') });
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      headingCount += 1;
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2].trim(),
        anchorId: `${slugify(headingMatch[2].trim()) || 'section'}-${headingCount}`,
      });
      i += 1;
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      const items = [];
      while (i < lines.length) {
        const currentLine = lines[i].trimEnd();
        const currentBulletMatch = currentLine.match(/^[-*]\s+(.*)$/);
        if (!currentBulletMatch) {
          break;
        }
        items.push(currentBulletMatch[1]);
        i += 1;
      }
      blocks.push({ type: 'list', ordered: false, items });
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      const items = [];
      while (i < lines.length) {
        const currentLine = lines[i].trimEnd();
        const currentOrderedMatch = currentLine.match(/^\d+\.\s+(.*)$/);
        if (!currentOrderedMatch) {
          break;
        }
        items.push(currentOrderedMatch[1]);
        i += 1;
      }
      blocks.push({ type: 'list', ordered: true, items });
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      const quoteLines = [];
      while (i < lines.length) {
        const currentLine = lines[i].trimEnd();
        const currentQuoteMatch = currentLine.match(/^>\s?(.*)$/);
        if (!currentQuoteMatch) {
          break;
        }
        quoteLines.push(currentQuoteMatch[1]);
        i += 1;
      }
      blocks.push({ type: 'quote', content: quoteLines.join('\n') });
      continue;
    }

    const tableSeparator = i + 1 < lines.length
      ? lines[i + 1].trim()
      : '';
    if (line.includes('|') && /^[:\-\s|]+$/.test(tableSeparator)) {
      const header = line.split('|').map((cell) => cell.trim()).filter(Boolean);
      i += 2;
      const rows = [];

      while (i < lines.length && lines[i].includes('|')) {
        const row = lines[i].split('|').map((cell) => cell.trim()).filter(Boolean);
        if (row.length === 0) {
          break;
        }
        rows.push(row);
        i += 1;
      }

      blocks.push({ type: 'table', header, rows });
      continue;
    }

    const paragraphLines = [line];
    i += 1;
    while (i < lines.length && lines[i].trim()) {
      const nextLine = lines[i].trimEnd();
      if (
        nextLine.startsWith('```') ||
        /^(#{1,6})\s+/.test(nextLine) ||
        /^[-*]\s+/.test(nextLine) ||
        /^\d+\.\s+/.test(nextLine) ||
        /^>\s?/.test(nextLine)
      ) {
        break;
      }
      paragraphLines.push(nextLine);
      i += 1;
    }
    blocks.push({ type: 'paragraph', content: paragraphLines.join(' ') });
  }

  return blocks;
}

function renderInline(text) {
  const parts = String(text || '').split(/(`[^`]+`)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          style={{
            padding: '2px 6px',
            borderRadius: '6px',
            backgroundColor: '#eef2ff',
            color: '#4338ca',
            fontSize: '0.95em',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function renderBlock(block, index, copiedCodeIndex, onCopyCode) {
  if (block.type === 'heading') {
    const sizeMap = {
      1: '28px',
      2: '22px',
      3: '18px',
      4: '16px',
      5: '14px',
      6: '13px',
    };

    return (
      <div
        key={index}
        id={block.anchorId}
        style={{
          fontSize: sizeMap[block.level] || '14px',
          fontWeight: 700,
          color: '#111827',
          marginTop: index === 0 ? 0 : '12px',
          marginBottom: '10px',
        }}
      >
        {renderInline(block.content)}
      </div>
    );
  }

  if (block.type === 'paragraph') {
    return (
      <p key={index} style={{ margin: '0 0 14px 0', color: '#374151', lineHeight: 1.8 }}>
        {renderInline(block.content)}
      </p>
    );
  }

  if (block.type === 'quote') {
    return (
      <blockquote
        key={index}
        style={{
          margin: '0 0 14px 0',
          padding: '10px 14px',
          borderLeft: '4px solid #93c5fd',
          backgroundColor: '#eff6ff',
          color: '#1f2937',
          borderRadius: '0 8px 8px 0',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.8,
        }}
      >
        {renderInline(block.content)}
      </blockquote>
    );
  }

  if (block.type === 'list') {
    const ListTag = block.ordered ? 'ol' : 'ul';
    return (
      <ListTag
        key={index}
        style={{
          margin: '0 0 14px 0',
          paddingLeft: '22px',
          color: '#374151',
          lineHeight: 1.8,
        }}
      >
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex} style={{ marginBottom: '6px' }}>
            {renderInline(item)}
          </li>
        ))}
      </ListTag>
    );
  }

  if (block.type === 'code') {
    return (
      <div key={index} style={{ marginBottom: '16px' }}>
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#0f172a',
          color: '#cbd5e1',
          fontSize: '12px',
          borderRadius: '10px 10px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <span>{block.language || 'code'}</span>
          <button
            onClick={() => onCopyCode(block.content, index)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              backgroundColor: copiedCodeIndex === index ? '#16a34a' : '#111827',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {copiedCodeIndex === index ? '已复制' : '复制代码'}
          </button>
        </div>
        <pre style={{
          margin: 0,
          padding: '14px 16px',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          borderRadius: '0 0 10px 10px',
          backgroundColor: '#0f172a',
          color: '#e5e7eb',
          fontSize: '12px',
          lineHeight: 1.7,
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        }}>
          {block.content}
        </pre>
      </div>
    );
  }

  if (block.type === 'table') {
    return (
      <div key={index} style={{ marginBottom: '16px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
          <thead>
            <tr>
              {block.header.map((cell, cellIndex) => (
                <th
                  key={cellIndex}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    color: '#111827',
                  }}
                >
                  {renderInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      color: '#374151',
                      verticalAlign: 'top',
                    }}
                  >
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}

export default function MarkdownRenderer({ content }) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);
  const headings = useMemo(
    () => blocks.filter((block) => block.type === 'heading' && block.level <= 3),
    [blocks]
  );

  const handleCopyCode = async (code, index) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', 'readonly');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedCodeIndex(index);
      window.setTimeout(() => {
        setCopiedCodeIndex((current) => (current === index ? null : current));
      }, 1800);
    } catch (error) {
      console.warn('复制代码失败:', error);
    }
  };

  const navigateToHeading = (anchorId) => {
    const target = document.getElementById(anchorId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{ fontSize: '14px' }}>
      {headings.length > 1 && (
        <div style={{
          marginBottom: '20px',
          padding: '14px 16px',
          borderRadius: '10px',
          border: '1px solid #dbeafe',
          backgroundColor: '#f8fbff',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '10px', color: '#1d4ed8' }}>
            文档目录
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {headings.map((heading, index) => (
              <button
                key={`${heading.anchorId}-${index}`}
                onClick={() => navigateToHeading(heading.anchorId)}
                style={{
                  color: heading.level === 1 ? '#111827' : '#374151',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  paddingLeft: `${Math.max(0, heading.level - 1) * 14}px`,
                  fontSize: heading.level === 1 ? '14px' : '13px',
                  fontWeight: heading.level <= 2 ? 600 : 500,
                }}
              >
                {heading.content}
              </button>
            ))}
          </div>
        </div>
      )}

      {blocks.map((block, index) => renderBlock(block, index, copiedCodeIndex, handleCopyCode))}
    </div>
  );
}
