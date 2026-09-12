import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

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

    const trimmed = line.trim();

    // Horizontal Rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      elements.push(
        <hr key={`hr-${lineIndex}`} className="academic-divider" />,
      );
      return;
    }

    // Blockquote (supports `> text` or `> * bullet text`)
    if (trimmed.startsWith(">")) {
      let quoteContent = trimmed.replace(/^>\s?/, "");
      if (quoteContent.startsWith("* ") || quoteContent.startsWith("- ")) {
        quoteContent = quoteContent.slice(2);
      }
      elements.push(
        <blockquote key={`quote-${lineIndex}`} className="academic-blockquote">
          {parseInlineFormatting(quoteContent)}
        </blockquote>,
      );
      return;
    }

    // Headings
    if (line.startsWith("#### ")) {
      elements.push(
        <h5 key={`h4-${lineIndex}`} className="academic-content-h4">
          {parseInlineFormatting(line.slice(5))}
        </h5>,
      );
      return;
    }
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

    // Checklist item (- [ ] or - [x] or * [ ] or * [x])
    if (
      trimmed.startsWith("- [ ] ") ||
      trimmed.startsWith("- [x] ") ||
      trimmed.startsWith("- [X] ") ||
      trimmed.startsWith("* [ ] ") ||
      trimmed.startsWith("* [x] ") ||
      trimmed.startsWith("* [X] ")
    ) {
      const isChecked =
        trimmed.startsWith("- [x] ") ||
        trimmed.startsWith("- [X] ") ||
        trimmed.startsWith("* [x] ") ||
        trimmed.startsWith("* [X] ");
      const text = trimmed.slice(6);
      elements.push(
        <div
          key={`check-${lineIndex}`}
          className={`academic-checklist-item ${isChecked ? "checklist-checked" : ""}`}
        >
          <span className="checklist-box">{isChecked ? "☑" : "☐"}</span>
          <span className={isChecked ? "line-through text-muted" : ""}>
            {parseInlineFormatting(text)}
          </span>
        </div>,
      );
      return;
    }

    // Numbered item: 1. 2. 3.
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`num-${lineIndex}`} className="academic-numbered-item">
          <span className="academic-number-badge">{numMatch[1]}.</span>
          <span>{parseInlineFormatting(numMatch[2])}</span>
        </div>,
      );
      return;
    }

    // Bullet list
    if (
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ") ||
      trimmed.startsWith("• ")
    ) {
      elements.push(
        <div key={`li-${lineIndex}`} className="academic-list-item">
          <span className="academic-bullet">•</span>
          <span>{parseInlineFormatting(trimmed.replace(/^[-*•]\s+/, ""))}</span>
        </div>,
      );
      return;
    }

    // Regular paragraph or empty line
    if (trimmed === "") {
      elements.push(
        <div key={`empty-${lineIndex}`} className="academic-line-spacer" />,
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

export function parseInlineFormatting(str) {
  if (!str) return "";

  // Replace common math and arrow notation cleanly
  const cleanStr = str
    .replace(/\\rightarrow/g, " → ")
    .replace(/\\leftarrow/g, " ← ")
    .replace(/\\leftrightarrow/g, " ↔ ")
    .replace(/\\Rightarrow/g, " ⇒ ")
    .replace(/\\Leftarrow/g, " ⇐ ")
    .replace(/\\cdot/g, " · ")
    .replace(/\\approx/g, " ≈ ")
    .replace(/\\neq/g, " ≠ ")
    .replace(/\\leq/g, " ≤ ")
    .replace(/\\geq/g, " ≥ ");

  // Split by inline code `code`
  const parts = cleanStr.split(/(`[^`]+`)/g);

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

      // Italic *text* or _text_
      const italicParts = bPart.split(/(\*[^*]+\*|_[^_]+_)/g);
      return italicParts.map((iPart, iIndex) => {
        if (
          (iPart.startsWith("*") && iPart.endsWith("*") && iPart.length >= 3) ||
          (iPart.startsWith("_") && iPart.endsWith("_") && iPart.length >= 3)
        ) {
          return (
            <em
              key={`${index}-${bIndex}-${iIndex}`}
              className="italic font-medium"
            >
              {iPart.slice(1, -1)}
            </em>
          );
        }

        // URLs detector
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urlParts = iPart.split(urlRegex);
        return urlParts.map((uPart, uIndex) => {
          if (uPart.match(urlRegex)) {
            return (
              <a
                key={`${index}-${bIndex}-${iIndex}-${uIndex}`}
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
