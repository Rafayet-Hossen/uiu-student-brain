import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, Layers, Sparkles } from "lucide-react";
import { searchBscseCourses } from "../data/courseCatalogue";

export default function CourseAutocomplete({
  value = "",
  onChange,
  onSelectCourse,
  placeholder = "e.g. Data Structures or CSE 2215",
  id = "course-autocomplete-input",
  className = "form-input",
  disabled = false,
  autoFocus = false,
  required = false,
  label = null,
  showCodePreview = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Update suggestions on query change
  useEffect(() => {
    if (!value || value.trim().length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    const matches = searchBscseCourses(value, 6);
    setSuggestions(matches);
    setIsOpen(matches.length > 0);
    setSelectedIndex(-1);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (course) => {
    setIsOpen(false);
    if (onSelectCourse) {
      onSelectCourse(course);
    } else if (onChange) {
      onChange({ target: { value: course.title } });
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="course-autocomplete-container"
      style={{ position: "relative", width: "100%" }}
    >
      {label && (
        <label
          htmlFor={id}
          className="form-label"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "6px",
          }}
        >
          <span>{label}</span>
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Sparkles size={11} /> Auto-suggests UIU BSCSE
          </span>
        </label>
      )}

      <div style={{ position: "relative", width: "100%" }}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={className}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            if (onChange) onChange(e);
          }}
          onFocus={() => {
            if (value && value.trim().length > 0) {
              const matches = searchBscseCourses(value, 6);
              setSuggestions(matches);
              if (matches.length > 0) setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus={autoFocus}
          required={required}
          autoComplete="off"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          className="course-suggestions-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 5px)",
            left: 0,
            right: 0,
            zIndex: 2500,
            background: "var(--color-surface, #ffffff)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg, 12px)",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            maxHeight: "280px",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              background: "var(--color-surface-subtle, rgba(0,0,0,0.03))",
              borderBottom: "1px solid var(--color-border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.7rem",
              color: "var(--color-text-muted)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <span>Suggested BSCSE Courses ({suggestions.length})</span>
            <span>Click to Auto-fill</span>
          </div>

          <div style={{ padding: "4px" }}>
            {suggestions.map((item, idx) => {
              const isHighlighted = idx === selectedIndex;
              const isLab =
                item.credits === "1.0" || item.credits === "1.5" || item.type.includes("Lab");

              return (
                <div
                  key={item.code}
                  className={`course-suggestion-item ${
                    isHighlighted ? "item-highlighted" : ""
                  }`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                    background: isHighlighted
                      ? "var(--color-primary-light, rgba(99, 102, 241, 0.12))"
                      : "transparent",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 800,
                      fontSize: "0.75rem",
                      padding: "3px 7px",
                      borderRadius: "6px",
                      background: isLab
                        ? "rgba(16, 185, 129, 0.12)"
                        : "var(--color-primary-light, rgba(99, 102, 241, 0.12))",
                      color: isLab ? "#10b981" : "var(--color-primary, #6366f1)",
                      border: `1px solid ${
                        isLab
                          ? "rgba(16, 185, 129, 0.25)"
                          : "rgba(99, 102, 241, 0.25)"
                      }`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.code}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.83rem",
                        fontWeight: 600,
                        color: "var(--color-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                        fontSize: "0.7rem",
                        color: "var(--color-text-muted)",
                        marginTop: "2px",
                      }}
                    >
                      {item.trimester && (
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--color-primary)",
                          }}
                        >
                          {item.trimester}
                        </span>
                      )}
                      {item.prerequisite &&
                        item.prerequisite !== "None" &&
                        item.prerequisite !== "X" && (
                          <span>• Prereq: {item.prerequisite}</span>
                        )}
                      {item.examDay &&
                        item.examDay !== "N/A" &&
                        item.examDay !== "----" && (
                          <span style={{ opacity: 0.85 }}>
                            • Exam: {item.examDay} ({item.examSlot})
                          </span>
                        )}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "10px",
                      background: "var(--color-surface-subtle)",
                      color: "var(--color-text-secondary)",
                      border: "1px solid var(--color-border-subtle)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.credits} Cr
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
