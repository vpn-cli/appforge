"use client";

import Editor, { OnMount, BeforeMount } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { MONO_FONT_STACK } from '@/lib/fonts';

type ConfigEditorProps = {
  value: string;
  onChange: (value: string | undefined) => void;
};

export function ConfigEditor({ value, onChange }: ConfigEditorProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBeforeMount: BeforeMount = (monaco) => {
    // AppForge Dark Theme (tokens: card bg #171717, violet brand cursor #A78BFA, muted syntax)
    monaco.editor.defineTheme('appforge-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'd4d4d8' },
        { token: 'string.key.json', foreground: '93c5fd' }, // Muted blue for JSON keys
        { token: 'string.value.json', foreground: '86efac' }, // Muted sage green for string values
        { token: 'string', foreground: '86efac' },
        { token: 'number', foreground: 'cbd5e1' }, // Muted slate for numbers
        { token: 'keyword.json', foreground: 'fcd34d' }, // Muted warm amber for booleans/null
        { token: 'delimiter', foreground: '71717a' }, // Neutral zinc-500 punctuation
        { token: 'delimiter.bracket', foreground: '71717a' },
        { token: 'delimiter.colon', foreground: '71717a' },
        { token: 'delimiter.comma', foreground: '71717a' },
      ],
      colors: {
        'editor.background': '#171717',
        'editor.foreground': '#d4d4d8',
        'editorCursor.foreground': '#A78BFA', // Brand violet cursor
        'editor.selectionBackground': '#A78BFA33', // Brand violet selection tint
        'editor.inactiveSelectionBackground': '#A78BFA1A',
        'editor.selectionHighlightBackground': '#A78BFA22',
        'editorLineNumber.foreground': '#52525b',
        'editorLineNumber.activeForeground': '#a1a1aa',
        'editor.lineHighlightBackground': '#1f1f23',
        'editor.lineHighlightBorder': '#00000000',
        'editorGutter.background': '#171717',
        'editorOverviewRuler.border': '#00000000',
        'editorOverviewRuler.background': '#171717',
        'scrollbarSlider.background': '#ffffff15',
        'scrollbarSlider.hoverBackground': '#ffffff25',
        'scrollbarSlider.activeBackground': '#ffffff35',
        'widget.shadow': '#00000000',
      },
    });

    // AppForge Light Theme (tokens: card bg #ffffff, violet brand cursor #6D28D9, muted syntax)
    monaco.editor.defineTheme('appforge-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: '', foreground: '27272a' },
        { token: 'string.key.json', foreground: '2563eb' }, // Muted royal blue for JSON keys
        { token: 'string.value.json', foreground: '15803d' }, // Muted forest green for string values
        { token: 'string', foreground: '15803d' },
        { token: 'number', foreground: '475569' }, // Muted slate for numbers
        { token: 'keyword.json', foreground: 'b45309' }, // Muted warm amber for booleans/null
        { token: 'delimiter', foreground: '94a3b8' }, // Slate-400 neutral punctuation
        { token: 'delimiter.bracket', foreground: '94a3b8' },
        { token: 'delimiter.colon', foreground: '94a3b8' },
        { token: 'delimiter.comma', foreground: '94a3b8' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#27272a',
        'editorCursor.foreground': '#6D28D9', // Brand violet cursor
        'editor.selectionBackground': '#6D28D920', // Brand violet selection tint
        'editor.inactiveSelectionBackground': '#6D28D912',
        'editor.selectionHighlightBackground': '#6D28D918',
        'editorLineNumber.foreground': '#a1a1aa',
        'editorLineNumber.activeForeground': '#52525b',
        'editor.lineHighlightBackground': '#f8fafc',
        'editor.lineHighlightBorder': '#00000000',
        'editorGutter.background': '#ffffff',
        'editorOverviewRuler.border': '#00000000',
        'editorOverviewRuler.background': '#ffffff',
        'scrollbarSlider.background': '#00000010',
        'scrollbarSlider.hoverBackground': '#00000020',
        'scrollbarSlider.activeBackground': '#00000030',
        'widget.shadow': '#00000000',
      },
    });
  };

  const handleEditorDidMount: OnMount = (_editor, monaco) => {
    // Remeasure fonts after fonts.ready so caret and selection line up accurately
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        monaco.editor.remeasureFonts();
      });
    }
  };

  const activeTheme = mounted && resolvedTheme === 'light' ? 'appforge-light' : 'appforge-dark';

  return (
    <div className="w-full h-full shrink-0 relative overflow-hidden" data-lenis-prevent>
      <Editor
        height="100%"
        defaultLanguage="json"
        theme={activeTheme}
        value={value}
        onChange={onChange}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
        options={{
          fontFamily: MONO_FONT_STACK,
          fontSize: 13,
          lineHeight: 20,
          letterSpacing: 0,
          fontLigatures: false,
          minimap: { enabled: false },
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          wordWrap: 'on',
          formatOnPaste: true,
          overviewRulerBorder: false,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            useShadows: false,
          },
        }}
      />
    </div>
  );
}
