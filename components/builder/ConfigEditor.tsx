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
    // AppForge Dark Theme (Surface token #171716, WCAG 2.2 AA verified >= 4.5:1)
    monaco.editor.defineTheme('appforge-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'EDEDEA' },
        { token: 'string.key.json', foreground: '8AB4F8' }, // Accent blue for keys
        { token: 'string.value.json', foreground: '4ADE80' }, // Success green for values
        { token: 'string', foreground: '4ADE80' },
        { token: 'number', foreground: 'FBBF24' }, // Warning amber for numbers
        { token: 'keyword.json', foreground: 'F87171' }, // Error salmon for booleans/null
        { token: 'delimiter', foreground: 'A3A29C' }, // Muted foreground
        { token: 'delimiter.bracket', foreground: 'A3A29C' },
        { token: 'delimiter.colon', foreground: 'A3A29C' },
        { token: 'delimiter.comma', foreground: 'A3A29C' },
      ],
      colors: {
        'editor.background': '#171716',
        'editor.foreground': '#EDEDEA',
        'editorCursor.foreground': '#EDEDEA',
        'editor.selectionBackground': '#8AB4F830',
        'editor.inactiveSelectionBackground': '#8AB4F818',
        'editor.selectionHighlightBackground': '#8AB4F822',
        'editorLineNumber.foreground': '#6E6D68',
        'editorLineNumber.activeForeground': '#EDEDEA',
        'editor.lineHighlightBackground': '#1F1F1D80',
        'editor.lineHighlightBorder': '#00000000',
        'editorGutter.background': '#171716',
        'editorOverviewRuler.border': '#00000000',
        'editorOverviewRuler.background': '#171716',
        'scrollbarSlider.background': '#ffffff15',
        'scrollbarSlider.hoverBackground': '#ffffff25',
        'scrollbarSlider.activeBackground': '#ffffff35',
        'widget.shadow': '#00000000',
      },
    });

    // AppForge Light Theme (Surface token #FFFFFF, WCAG 2.2 AA verified >= 4.5:1)
    monaco.editor.defineTheme('appforge-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: '', foreground: '111110' },
        { token: 'string.key.json', foreground: '1D4ED8' }, // Accent blue keys
        { token: 'string.value.json', foreground: '166534' }, // Forest green values
        { token: 'string', foreground: '166534' },
        { token: 'number', foreground: 'B54708' }, // Warning amber numbers
        { token: 'keyword.json', foreground: 'B42318' }, // Error red keywords
        { token: 'delimiter', foreground: '63625C' }, // Muted foreground
        { token: 'delimiter.bracket', foreground: '63625C' },
        { token: 'delimiter.colon', foreground: '63625C' },
        { token: 'delimiter.comma', foreground: '63625C' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#111110',
        'editorCursor.foreground': '#111110',
        'editor.selectionBackground': '#1D4ED825',
        'editor.inactiveSelectionBackground': '#1D4ED812',
        'editor.selectionHighlightBackground': '#1D4ED818',
        'editorLineNumber.foreground': '#8F8E88',
        'editorLineNumber.activeForeground': '#111110',
        'editor.lineHighlightBackground': '#F4F4F280',
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
          automaticLayout: true,
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
