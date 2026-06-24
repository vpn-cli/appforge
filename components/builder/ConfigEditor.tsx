import Editor from '@monaco-editor/react';

type ConfigEditorProps = {
  value: string;
  onChange: (value: string | undefined) => void;
};

export function ConfigEditor({ value, onChange }: ConfigEditorProps) {
  return (
    <div className="w-full h-full border-r border-border shrink-0" data-lenis-prevent>
      <Editor
        height="100%"
        defaultLanguage="json"
        theme="vs-dark"
        value={value}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "var(--font-geist-mono)",
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          wordWrap: 'on',
          formatOnPaste: true,
        }}
      />
    </div>
  );
}
