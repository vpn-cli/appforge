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

  const getCssColor = (varName: string, fallbackWithoutHash: string = "000000"): string => {
    if (typeof window !== "undefined") {
      const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      if (val) return val;
    }
    return `#${fallbackWithoutHash}`;
  };

  const getRuleColor = (varName: string, fallbackWithoutHash: string = "000000"): string => {
    const raw = getCssColor(varName, fallbackWithoutHash);
    let hex = raw.replace(/^#/, "");
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    return hex;
  };

  const defineThemes = (monaco: Monaco) => {
    monaco.editor.defineTheme('appforge-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: getRuleColor('--editor-fg-dark', 'F2F2F7') },
        { token: 'string.key.json', foreground: getRuleColor('--editor-key-dark', 'ADA6FC') },
        { token: 'string.value.json', foreground: getRuleColor('--editor-val-dark', 'FBBF24') },
        { token: 'string', foreground: getRuleColor('--editor-val-dark', 'FBBF24') },
        { token: 'number', foreground: getRuleColor('--editor-num-dark', '60A5FA') },
        { token: 'keyword.json', foreground: getRuleColor('--editor-kw-dark', '4ADE80') },
        { token: 'delimiter', foreground: getRuleColor('--editor-delim-dark', 'A9A9BD') },
        { token: 'delimiter.bracket', foreground: getRuleColor('--editor-bracket-dark', '8B7FF8') },
        { token: 'delimiter.colon', foreground: getRuleColor('--editor-delim-dark', 'A9A9BD') },
        { token: 'delimiter.comma', foreground: getRuleColor('--editor-delim-dark', 'A9A9BD') },
      ],
      colors: {
        'editor.background': getCssColor('--editor-bg-dark', '16161F'),
        'editor.foreground': getCssColor('--editor-fg-dark', 'F2F2F7'),
        'editorCursor.foreground': getCssColor('--editor-fg-dark', 'F2F2F7'),
        'editor.selectionBackground': getCssColor('--editor-selection-dark', '8B7FF840'),
        'editor.inactiveSelectionBackground': getCssColor('--editor-selection-inactive-dark', '8B7FF820'),
        'editor.selectionHighlightBackground': getCssColor('--editor-selection-highlight-dark', '8B7FF828'),
        'editorLineNumber.foreground': getCssColor('--editor-line-number-dark', '6B6B82'),
        'editorLineNumber.activeForeground': getCssColor('--editor-line-number-active-dark', 'F2F2F7'),
        'editor.lineHighlightBackground': getCssColor('--editor-line-highlight-dark', 'FFFFFF08'),
        'editor.lineHighlightBorder': getCssColor('--editor-transparent', '00000000'),
        'editorGutter.background': getCssColor('--editor-bg-dark', '16161F'),
        'editorOverviewRuler.border': getCssColor('--editor-transparent', '00000000'),
        'editorOverviewRuler.background': getCssColor('--editor-bg-dark', '16161F'),
        'editorIndentGuide.background': getCssColor('--editor-indent-guide-dark', 'FFFFFF0D'),
        'editorIndentGuide.activeBackground': getCssColor('--editor-indent-guide-active-dark', 'FFFFFF1F'),
        'editorIndentGuide.background1': getCssColor('--editor-indent-guide-dark', 'FFFFFF0D'),
        'editorIndentGuide.activeBackground1': getCssColor('--editor-indent-guide-active-dark', 'FFFFFF1F'),
        'scrollbarSlider.background': getCssColor('--editor-scrollbar-dark', 'FFFFFF14'),
        'scrollbarSlider.hoverBackground': getCssColor('--editor-scrollbar-hover-dark', 'FFFFFF26'),
        'scrollbarSlider.activeBackground': getCssColor('--editor-scrollbar-active-dark', 'FFFFFF33'),
        'widget.shadow': getCssColor('--editor-transparent', '00000000'),
      },
    });

    monaco.editor.defineTheme('appforge-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: '', foreground: getRuleColor('--editor-fg-light', '17171F') },
        { token: 'string.key.json', foreground: getRuleColor('--editor-key-light', '5B45E0') },
        { token: 'string.value.json', foreground: getRuleColor('--editor-val-light', 'D97706') },
        { token: 'string', foreground: getRuleColor('--editor-val-light', 'D97706') },
        { token: 'number', foreground: getRuleColor('--editor-num-light', '2563EB') },
        { token: 'keyword.json', foreground: getRuleColor('--editor-kw-light', '16A34A') },
        { token: 'delimiter', foreground: getRuleColor('--editor-delim-light', '55556B') },
        { token: 'delimiter.bracket', foreground: getRuleColor('--editor-bracket-light', '4B37BF') },
        { token: 'delimiter.colon', foreground: getRuleColor('--editor-delim-light', '55556B') },
        { token: 'delimiter.comma', foreground: getRuleColor('--editor-delim-light', '55556B') },
      ],
      colors: {
        'editor.background': getCssColor('--editor-bg-light', 'FFFFFF'),
        'editor.foreground': getCssColor('--editor-fg-light', '17171F'),
        'editorCursor.foreground': getCssColor('--editor-fg-light', '17171F'),
        'editor.selectionBackground': getCssColor('--editor-selection-light', '6D5BF040'),
        'editor.inactiveSelectionBackground': getCssColor('--editor-selection-inactive-light', '6D5BF020'),
        'editor.selectionHighlightBackground': getCssColor('--editor-selection-highlight-light', '6D5BF028'),
        'editorLineNumber.foreground': getCssColor('--editor-line-number-light', '9A9AB0'),
        'editorLineNumber.activeForeground': getCssColor('--editor-line-number-active-light', '17171F'),
        'editor.lineHighlightBackground': getCssColor('--editor-line-highlight-light', '0000000A'),
        'editor.lineHighlightBorder': getCssColor('--editor-transparent', '00000000'),
        'editorGutter.background': getCssColor('--editor-bg-light', 'FFFFFF'),
        'editorOverviewRuler.border': getCssColor('--editor-transparent', '00000000'),
        'editorOverviewRuler.background': getCssColor('--editor-bg-light', 'FFFFFF'),
        'editorIndentGuide.background': getCssColor('--editor-indent-guide-light', '0000000D'),
        'editorIndentGuide.activeBackground': getCssColor('--editor-indent-guide-active-light', '0000001F'),
        'editorIndentGuide.background1': getCssColor('--editor-indent-guide-light', '0000000D'),
        'editorIndentGuide.activeBackground1': getCssColor('--editor-indent-guide-active-light', '0000001F'),
        'scrollbarSlider.background': getCssColor('--editor-scrollbar-light', '00000014'),
        'scrollbarSlider.hoverBackground': getCssColor('--editor-scrollbar-hover-light', '00000026'),
        'scrollbarSlider.activeBackground': getCssColor('--editor-scrollbar-active-light', '00000033'),
        'widget.shadow': getCssColor('--editor-transparent', '00000000'),
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
