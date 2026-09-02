import { useState } from "react";
import { Check, Copy, ExternalLink, FileText } from "lucide-react";

export function formatRichContent(text) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLang = "";

  lines.forEach((line, lineIndex) => {
    // Code block toggle
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <CodeBlockItem
            key={`code-${lineIndex}`}
            code={codeBuffer.join("\n")}
            lang={codeLang}
          />,
        );
        codeBuffer = [];
        codeLang = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Blockquote
    if (line.trim().startsWith(">")) {
      elements.push(
        <blockquote key={`quote-${lineIndex}`} className="academic-blockquote">
          {parseInlineFormatting(line.replace(/^>\s?/, ""))}
        </blockquote>,
      );
      return;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={`h3-${lineIndex}`} className="academic-content-h3">
          {parseInlineFormatting(line.slice(4))}
        </h4>,
      );
      return;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={`h2-${lineIndex}`} className="academic-content-h2">
          {parseInlineFormatting(line.slice(3))}
        </h3>,
      );
      return;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h2 key={`h1-${lineIndex}`} className="academic-content-h1">
          {parseInlineFormatting(line.slice(2))}
        </h2>,
      );
      return;
    }

    // Bullet list
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      elements.push(
        <div key={`li-${lineIndex}`} className="academic-list-item">
          <span className="academic-bullet">•</span>
          <span>{parseInlineFormatting(line.trim().slice(2))}</span>
        </div>,
      );
      return;
    }

    // Regular paragraph or empty line
    if (line.trim() === "") {
      elements.push(
        <div key={`empty-${lineIndex}`} style={{ height: "8px" }} />,
      );
    } else {
      elements.push(
        <p key={`p-${lineIndex}`} className="academic-content-p">
          {parseInlineFormatting(line)}
        </p>,
      );
    }
  });

  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <CodeBlockItem
        key="code-end"
        code={codeBuffer.join("\n")}
        lang={codeLang}
      />,
    );
  }

  return elements;
}

function parseInlineFormatting(str) {
  if (!str) return "";

  // Split by inline code `code`
  const parts = str.split(/(`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code key={index} className="academic-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold **text**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, bIndex) => {
      if (bPart.startsWith("**") && bPart.endsWith("**") && bPart.length >= 4) {
        return (
          <strong
            key={`${index}-${bIndex}`}
            className="font-bold text-foreground"
          >
            {bPart.slice(2, -2)}
          </strong>
        );
      }

      // URLs detector
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urlParts = bPart.split(urlRegex);
      return urlParts.map((uPart, uIndex) => {
        if (uPart.match(urlRegex)) {
          return (
            <a
              key={`${index}-${bIndex}-${uIndex}`}
              href={uPart}
              target="_blank"
              rel="noopener noreferrer"
              className="academic-link-chip"
            >
              <span>
                {uPart.replace(/^https?:\/\/(www\.)?/, "").slice(0, 30)}...
              </span>
              <ExternalLink size={12} />
            </a>
          );
        }
        return uPart;
      });
    });
  });
}

function CodeBlockItem({ code, lang }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="academic-code-block-wrap">
      <div className="code-block-header">
        <span className="code-block-lang">{lang || "code"}</span>
        <button type="button" onClick={handleCopy} className="code-copy-btn">
          {copied ? (
            <Check size={13} className="text-emerald" />
          ) : (
            <Copy size={13} />
          )}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="code-block-content">
        <code>{code}</code>
      </pre>
    </div>
  );
}
