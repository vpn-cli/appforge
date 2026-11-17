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
    const normalizeHex = (hex: string) => {
      if (!hex) return '';
      let clean = hex.trim();
      if (clean.startsWith('#') && clean.length === 4) {
        clean = '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
      }
      return clean;
    };

    const resolveTokens = (isDark: boolean) => {
      if (typeof document === 'undefined') return null;
      const probe = document.createElement('div');
      if (isDark) probe.className = 'dark';
      document.body.appendChild(probe);
      const cs = window.getComputedStyle(probe);
      const get = (v: string) => normalizeHex(cs.getPropertyValue(v).trim());
      const tokens = {
        card: get('--card'),
        fg: get('--foreground'),
        mutedFg: get('--muted-foreground'),
        muted: get('--muted'),
        borderStrong: get('--border-strong'),
        accent: get('--accent'),
        success: get('--theme-success'),
        warning: get('--theme-warning'),
        error: get('--theme-error'),
      };
      document.body.removeChild(probe);
      return tokens;
    };

    try {
      const dark = resolveTokens(true);
      const light = resolveTokens(false);
      const stripHash = (val?: string) => (val || '').replace(/^#/, '');

      if (dark && dark.card) {
        monaco.editor.defineTheme('appforge-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: '', foreground: 'EDEDEA' },
            { token: 'string.key.json', foreground: '8FA8FF', fontStyle: 'bold' },
            { token: 'string.value.json', foreground: 'D9C27A' },
            { token: 'string', foreground: 'D9C27A' },
            { token: 'number', foreground: 'FCD34D' },
            { token: 'keyword.json', foreground: 'FDBA74' },
            { token: 'delimiter', foreground: '94A3B8' },
            { token: 'delimiter.bracket', foreground: 'C4B5FD' },
            { token: 'delimiter.colon', foreground: '94A3B8' },
            { token: 'delimiter.comma', foreground: '94A3B8' },
          ],
          colors: {
            'editor.background': '#14141A',
            'editor.foreground': '#EDEDEA',
            'editorCursor.foreground': '#EDEDEA',
            'editor.selectionBackground': '#8AB4F830',
            'editor.inactiveSelectionBackground': '#8AB4F818',
            'editor.selectionHighlightBackground': '#8AB4F822',
            'editorLineNumber.foreground': 'rgba(255, 255, 255, 0.35)',
            'editorLineNumber.activeForeground': '#EDEDEA',
            'editor.lineHighlightBackground': 'rgba(255, 255, 255, 0.03)',
            'editor.lineHighlightBorder': '#00000000',
            'editorGutter.background': '#14141A',
            'editorOverviewRuler.border': '#00000000',
            'editorOverviewRuler.background': '#14141A',
            'editorIndentGuide.background': 'rgba(255, 255, 255, 0.06)',
            'editorIndentGuide.activeBackground': 'rgba(255, 255, 255, 0.14)',
            'scrollbarSlider.background': 'rgba(255, 255, 255, 0.12)',
            'scrollbarSlider.hoverBackground': 'rgba(255, 255, 255, 0.20)',
            'scrollbarSlider.activeBackground': 'rgba(255, 255, 255, 0.30)',
            'widget.shadow': '#00000000',
          },
        });
      }

      if (light && light.card) {
        monaco.editor.defineTheme('appforge-light', {
          base: 'vs',
          inherit: true,
          rules: [
            { token: '', foreground: '09090B' },
            { token: 'string.key.json', foreground: '2B6CB0', fontStyle: 'bold' },
            { token: 'string.value.json', foreground: '8A7A1F' },
            { token: 'string', foreground: '8A7A1F' },
            { token: 'number', foreground: 'B45309' },
            { token: 'keyword.json', foreground: 'C2410C' },
            { token: 'delimiter', foreground: '52525B' },
            { token: 'delimiter.bracket', foreground: '6D28D9' },
            { token: 'delimiter.colon', foreground: '52525B' },
            { token: 'delimiter.comma', foreground: '52525B' },
          ],
          colors: {
            'editor.background': '#FFFFFF',
            'editor.foreground': '#09090B',
            'editorCursor.foreground': '#09090B',
            'editor.selectionBackground': '#1D4ED825',
            'editor.inactiveSelectionBackground': '#1D4ED812',
            'editor.selectionHighlightBackground': '#1D4ED818',
            'editorLineNumber.foreground': 'rgba(0, 0, 0, 0.35)',
            'editorLineNumber.activeForeground': '#09090B',
            'editor.lineHighlightBackground': 'rgba(0, 0, 0, 0.03)',
            'editor.lineHighlightBorder': '#00000000',
            'editorGutter.background': '#FFFFFF',
            'editorOverviewRuler.border': '#00000000',
            'editorOverviewRuler.background': '#FFFFFF',
            'editorIndentGuide.background': 'rgba(0, 0, 0, 0.06)',
            'editorIndentGuide.activeBackground': 'rgba(0, 0, 0, 0.14)',
            'scrollbarSlider.background': 'rgba(0, 0, 0, 0.10)',
            'scrollbarSlider.hoverBackground': 'rgba(0, 0, 0, 0.18)',
            'scrollbarSlider.activeBackground': 'rgba(0, 0, 0, 0.25)',
            'widget.shadow': '#00000000',
          },
        });
      }
    } catch (e) {
      console.warn("Theme definition skipped:", e);
    }
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
