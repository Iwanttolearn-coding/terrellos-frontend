import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from '@codemirror/basic-setup';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';

const langMap = { html, css, js: javascript };

export default function CodeEditor({ language = 'html', value = '', onChange }) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const langExtension = langMap[language] ? langMap[language]() : [];

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        oneDark,
        langExtension,
        EditorView.lineWrapping,
        EditorView.updateListener.of(update => {
          if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => view.destroy();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Sync external value changes without re-mounting
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-auto text-sm"
      style={{ fontFamily: 'var(--font-mono)' }}
    />
  );
}