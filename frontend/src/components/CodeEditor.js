import React from 'react';
import Editor from '@monaco-editor/react';

function CodeEditor({ code, setCode, darkMode }) {
  
  // Disable syntax validation (red squiggly lines)
  const handleEditorWillMount = (monaco) => {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-panel)" }}>
      <div style={{ 
        padding: "8px 20px", 
        backgroundColor: "rgba(0,0,0,0.05)", 
        color: "var(--text-dim)", 
        fontSize: "1.2rem", 
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: "10px"
      }}>
        <span style={{ color: "var(--primary)" }}>●</span> EDITOR
      </div>
      
      <div style={{ flex: 1, position: "relative" }}>
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onChange={(value) => setCode(value || '')}
          theme={darkMode ? "vs-dark" : "light"}
          beforeMount={handleEditorWillMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'Fira Code', 'Inter', monospace",
            wordWrap: 'on',
            lineNumbersMinChars: 3,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            formatOnPaste: true,
            renderValidationDecorations: "off" // Also forces validation UI off globally
          }}
          loading={<div style={{ padding: "20px", color: "var(--text-dim)" }}>Loading Editor...</div>}
        />
      </div>
    </div>
  );
}

export default CodeEditor;