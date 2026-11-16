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
    // AppForge Dark Theme (Real surface token #18181B, WCAG 2.2 AA verified >= 4.5:1)
    monaco.editor.defineTheme('appforge-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'E4E4E7' },
        { token: 'string.key.json', foreground: '93C5FD' }, // Muted blue for JSON keys (9.82:1)
        { token: 'string.value.json', foreground: '86EFAC' }, // Muted sage for values (12.62:1)
        { token: 'string', foreground: '86EFAC' },
        { token: 'number', foreground: 'FDE047' }, // Warm yellow for numbers (13.44:1)
        { token: 'keyword.json', foreground: 'FDBA74' }, // Orange for booleans/null (10.51:1)
        { token: 'delimiter', foreground: 'A1A1AA' }, // Punctuation zinc-400 (6.91:1)
        { token: 'delimiter.bracket', foreground: 'A1A1AA' },
        { token: 'delimiter.colon', foreground: 'A1A1AA' },
        { token: 'delimiter.comma', foreground: 'A1A1AA' },
      ],
      colors: {
        'editor.background': '#18181B',
        'editor.foreground': '#E4E4E7',
        'editorCursor.foreground': '#A78BFA', // Brand violet cursor (6.51:1)
        'editor.selectionBackground': '#A78BFA33', // Brand violet selection tint
        'editor.inactiveSelectionBackground': '#A78BFA1A',
        'editor.selectionHighlightBackground': '#A78BFA22',
        'editorLineNumber.foreground': '#71717A',
        'editorLineNumber.activeForeground': '#E4E4E7',
        'editor.lineHighlightBackground': '#27272A50',
        'editor.lineHighlightBorder': '#00000000',
        'editorGutter.background': '#18181B',
        'editorOverviewRuler.border': '#00000000',
        'editorOverviewRuler.background': '#18181B',
        'scrollbarSlider.background': '#ffffff15',
        'scrollbarSlider.hoverBackground': '#ffffff25',
        'scrollbarSlider.activeBackground': '#ffffff35',
        'widget.shadow': '#00000000',
      },
    });

    // AppForge Light Theme (Real surface token #FFFFFF, WCAG 2.2 AA verified >= 4.5:1)
    monaco.editor.defineTheme('appforge-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: '', foreground: '18181B' },
        { token: 'string.key.json', foreground: '1D4ED8' }, // Blue keys (6.70:1)
        { token: 'string.value.json', foreground: '15803D' }, // Forest green values (5.02:1)
        { token: 'string', foreground: '15803D' },
        { token: 'number', foreground: 'A16207' }, // Amber numbers (4.92:1)
        { token: 'keyword.json', foreground: 'C2410C' }, // Orange keywords (5.18:1)
        { token: 'delimiter', foreground: '52525B' }, // Punctuation zinc-600 (7.73:1)
        { token: 'delimiter.bracket', foreground: '52525B' },
        { token: 'delimiter.colon', foreground: '52525B' },
        { token: 'delimiter.comma', foreground: '52525B' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#18181B',
        'editorCursor.foreground': '#6D28D9', // Brand violet cursor (7.10:1)
        'editor.selectionBackground': '#6D28D920', // Brand violet selection tint
        'editor.inactiveSelectionBackground': '#6D28D912',
        'editor.selectionHighlightBackground': '#6D28D918',
        'editorLineNumber.foreground': '#A1A1AA',
        'editorLineNumber.activeForeground': '#18181B',
        'editor.lineHighlightBackground': '#F4F4F580',
        'editor.lineHighlightBorder': '#00000000',
        'editorGutter.background': '#FFFFFF',
        'editorOverviewRuler.border': '#00000000',
        'editorOverviewRuler.background': '#FFFFFF',
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
