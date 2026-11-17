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
            { token: '', foreground: stripHash(dark.fg) },
            { token: 'string.key.json', foreground: stripHash(dark.accent) },
            { token: 'string.value.json', foreground: stripHash(dark.success) },
            { token: 'string', foreground: stripHash(dark.success) },
            { token: 'number', foreground: stripHash(dark.warning) },
            { token: 'keyword.json', foreground: stripHash(dark.error) },
            { token: 'delimiter', foreground: stripHash(dark.mutedFg) },
            { token: 'delimiter.bracket', foreground: stripHash(dark.mutedFg) },
            { token: 'delimiter.colon', foreground: stripHash(dark.mutedFg) },
            { token: 'delimiter.comma', foreground: stripHash(dark.mutedFg) },
          ],
          colors: {
            'editor.background': dark.card,
            'editor.foreground': dark.fg,
            'editorCursor.foreground': dark.fg,
            'editor.selectionBackground': dark.accent + '30',
            'editor.inactiveSelectionBackground': dark.accent + '18',
            'editor.selectionHighlightBackground': dark.accent + '22',
            'editorLineNumber.foreground': dark.borderStrong,
            'editorLineNumber.activeForeground': dark.fg,
            'editor.lineHighlightBackground': dark.muted + '80',
            'editor.lineHighlightBorder': dark.card + '00',
            'editorGutter.background': dark.card,
            'editorOverviewRuler.border': dark.card + '00',
            'editorOverviewRuler.background': dark.card,
            'scrollbarSlider.background': dark.fg + '15',
            'scrollbarSlider.hoverBackground': dark.fg + '25',
            'scrollbarSlider.activeBackground': dark.fg + '35',
            'widget.shadow': dark.card + '00',
          },
        });
      }

      if (light && light.card) {
        monaco.editor.defineTheme('appforge-light', {
          base: 'vs',
          inherit: true,
          rules: [
            { token: '', foreground: stripHash(light.fg) },
            { token: 'string.key.json', foreground: stripHash(light.accent) },
            { token: 'string.value.json', foreground: stripHash(light.success) },
            { token: 'string', foreground: stripHash(light.success) },
            { token: 'number', foreground: stripHash(light.warning) },
            { token: 'keyword.json', foreground: stripHash(light.error) },
            { token: 'delimiter', foreground: stripHash(light.mutedFg) },
            { token: 'delimiter.bracket', foreground: stripHash(light.mutedFg) },
            { token: 'delimiter.colon', foreground: stripHash(light.mutedFg) },
            { token: 'delimiter.comma', foreground: stripHash(light.mutedFg) },
          ],
          colors: {
            'editor.background': light.card,
            'editor.foreground': light.fg,
            'editorCursor.foreground': light.fg,
            'editor.selectionBackground': light.accent + '25',
            'editor.inactiveSelectionBackground': light.accent + '12',
            'editor.selectionHighlightBackground': light.accent + '18',
            'editorLineNumber.foreground': light.borderStrong,
            'editorLineNumber.activeForeground': light.fg,
            'editor.lineHighlightBackground': light.muted + '80',
            'editor.lineHighlightBorder': light.card + '00',
            'editorGutter.background': light.card,
            'editorOverviewRuler.border': light.card + '00',
            'editorOverviewRuler.background': light.card,
            'scrollbarSlider.background': light.fg + '10',
            'scrollbarSlider.hoverBackground': light.fg + '20',
            'scrollbarSlider.activeBackground': light.fg + '30',
            'widget.shadow': light.card + '00',
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
