"use client";

import Editor, { OnMount, BeforeMount, Monaco } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { useState, useEffect, useRef } from 'react';
import { MONO_FONT_STACK } from '@/lib/fonts';

type ConfigEditorProps = {
  value: string;
  onChange: (value: string | undefined) => void;
};

export function ConfigEditor({ value, onChange }: ConfigEditorProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const monacoRef = useRef<Monaco | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defineThemes = (monaco: Monaco) => {
    monaco.editor.defineTheme('appforge-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'EDEDEA' },
        { token: 'string.key.json', foreground: '8FA8FF' },
        { token: 'string.value.json', foreground: 'D9C27A' },
        { token: 'string', foreground: 'D9C27A' },
        { token: 'number', foreground: 'FCD34D' },
        { token: 'keyword.json', foreground: '34D399' },
        { token: 'delimiter', foreground: '94A3B8' },
        { token: 'delimiter.bracket', foreground: 'C4B5FD' },
        { token: 'delimiter.colon', foreground: '94A3B8' },
        { token: 'delimiter.comma', foreground: '94A3B8' },
      ],
      colors: {
        'editor.background': '#14141A',
        'editor.foreground': '#EDEDEA',
        'editorCursor.foreground': '#EDEDEA',
        'editor.selectionBackground': '#8AB4F84D',
        'editor.inactiveSelectionBackground': '#8AB4F826',
        'editor.selectionHighlightBackground': '#8AB4F833',
        'editorLineNumber.foreground': '#EDEDEA59',
        'editorLineNumber.activeForeground': '#EDEDEAB3',
        'editor.lineHighlightBackground': '#FFFFFF08',
        'editor.lineHighlightBorder': '#00000000',
        'editorGutter.background': '#14141A',
        'editorOverviewRuler.border': '#00000000',
        'editorOverviewRuler.background': '#14141A',
        'editorIndentGuide.background': '#FFFFFF0D',
        'editorIndentGuide.activeBackground': '#FFFFFF1F',
        'editorIndentGuide.background1': '#FFFFFF0D',
        'editorIndentGuide.activeBackground1': '#FFFFFF1F',
        'scrollbarSlider.background': '#FFFFFF14',
        'scrollbarSlider.hoverBackground': '#FFFFFF26',
        'scrollbarSlider.activeBackground': '#FFFFFF33',
        'widget.shadow': '#00000000',
      },
    });

    monaco.editor.defineTheme('appforge-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: '', foreground: '111110' },
        { token: 'string.key.json', foreground: '2B6CB0' },
        { token: 'string.value.json', foreground: '8A7A1F' },
        { token: 'string', foreground: '8A7A1F' },
        { token: 'number', foreground: 'B45309' },
        { token: 'keyword.json', foreground: '059669' },
        { token: 'delimiter', foreground: '475569' },
        { token: 'delimiter.bracket', foreground: '6D28D9' },
        { token: 'delimiter.colon', foreground: '475569' },
        { token: 'delimiter.comma', foreground: '475569' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#111110',
        'editorCursor.foreground': '#111110',
        'editor.selectionBackground': '#1D4ED84D',
        'editor.inactiveSelectionBackground': '#1D4ED826',
        'editor.selectionHighlightBackground': '#1D4ED833',
        'editorLineNumber.foreground': '#11111059',
        'editorLineNumber.activeForeground': '#111110B3',
        'editor.lineHighlightBackground': '#0000000A',
        'editor.lineHighlightBorder': '#00000000',
        'editorGutter.background': '#FFFFFF',
        'editorOverviewRuler.border': '#00000000',
        'editorOverviewRuler.background': '#FFFFFF',
        'editorIndentGuide.background': '#0000000D',
        'editorIndentGuide.activeBackground': '#0000001F',
        'editorIndentGuide.background1': '#0000000D',
        'editorIndentGuide.activeBackground1': '#0000001F',
        'scrollbarSlider.background': '#00000014',
        'scrollbarSlider.hoverBackground': '#00000026',
        'scrollbarSlider.activeBackground': '#00000033',
        'widget.shadow': '#00000000',
      },
    });
  };

  const handleBeforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
    defineThemes(monaco);
  };

  const handleEditorDidMount: OnMount = (_editor, monaco) => {
    monacoRef.current = monaco;
    defineThemes(monaco);
    const themeName = resolvedTheme === 'light' ? 'appforge-light' : 'appforge-dark';
    monaco.editor.setTheme(themeName);

    // Remeasure fonts after fonts.ready so caret and selection line up accurately
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        monaco.editor.remeasureFonts();
      });
    }
  };

  // Switch Monaco theme whenever app theme changes
  useEffect(() => {
    if (monacoRef.current) {
      const themeName = resolvedTheme === 'light' ? 'appforge-light' : 'appforge-dark';
      monacoRef.current.editor.setTheme(themeName);
    }
  }, [resolvedTheme]);

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
          padding: { top: 16, bottom: 72 },
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
          bracketPairColorization: { enabled: false },
          guides: {
            bracketPairs: false,
            bracketPairsHorizontal: false,
            indentation: true,
          },
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
