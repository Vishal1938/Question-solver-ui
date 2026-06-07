// src/components/MathText.jsx
import { useEffect, useRef } from 'react';

/**
 * Renders text that may contain LaTeX math, using KaTeX.
 *
 * Supports the delimiters your LLM produces:
 *   \( ... \)   inline math
 *   \[ ... \]   display math (centered block)
 *   $ ... $     inline math (fallback)
 *   $$ ... $$   display math (fallback)
 *
 * Falls back to plain text if KaTeX isn't loaded or a segment fails to parse.
 *
 * REQUIRES KaTeX to be available. Two ways to provide it (see MathText_setup.md):
 *   1. npm install katex          (recommended)
 *   2. CDN <link> + <script> in index.html
 */
export default function MathText({ children, style }) {
  const containerRef = useRef(null);
  const text = typeof children === 'string' ? children : '';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // KaTeX is loaded as a module (npm) or on window (CDN)
    const katex = window.katex || null;

    if (!katex) {
      // No KaTeX available — render plain text
      container.textContent = text;
      return;
    }

    container.innerHTML = '';
    const segments = splitMath(text);

    segments.forEach((seg) => {
      if (seg.type === 'text') {
        // Preserve line breaks in plain text
        const span = document.createElement('span');
        span.style.whiteSpace = 'pre-wrap';
        span.textContent = seg.content;
        container.appendChild(span);
      } else {
        const span = document.createElement('span');
        try {
          katex.render(seg.content, span, {
            displayMode: seg.type === 'display',
            throwOnError: false,
            errorColor: '#f87171',
          });
        } catch {
          span.textContent = seg.raw;   // fall back to raw on failure
        }
        container.appendChild(span);
      }
    });
  }, [text]);

  return <div ref={containerRef} style={style} />;
}

/**
 * Split a string into text and math segments.
 * Returns array of { type: 'text'|'inline'|'display', content, raw }.
 */
function splitMath(input) {
  const segments = [];
  // Match \[..\], \(..\), $$..$$, $..$  (display first so $$ wins over $)
  const pattern = /(\\\[[\s\S]+?\\\])|(\\\([\s\S]+?\\\))|(\$\$[\s\S]+?\$\$)|(\$[^$]+?\$)/g;

  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(input)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: input.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    let type, content;
    if (raw.startsWith('\\[')) {
      type = 'display';  content = raw.slice(2, -2);
    } else if (raw.startsWith('\\(')) {
      type = 'inline';   content = raw.slice(2, -2);
    } else if (raw.startsWith('$$')) {
      type = 'display';  content = raw.slice(2, -2);
    } else {
      type = 'inline';   content = raw.slice(1, -1);
    }
    segments.push({ type, content: content.trim(), raw });
    lastIndex = pattern.lastIndex;
  }

  // Trailing text
  if (lastIndex < input.length) {
    segments.push({ type: 'text', content: input.slice(lastIndex) });
  }

  return segments;
}