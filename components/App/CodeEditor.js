import { useLayoutEffect, useRef, useState } from "react";
import Highlight, { defaultProps } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/palenight";
import styles from "./CodeEditor.module.css";

export default function Prism({ code, label, onChange, testName }) {
  const [isFocused, setIsFocused] = useState();
  const textAreaRef = useRef();

  useLayoutEffect(() => {
    if (isFocused) {
      const textArea = textAreaRef.current;
      if (textArea) {
        textArea.focus();
      }
    }
  }, [isFocused]);

  const handleBlur = (event) => {
    setIsFocused(false);

    onChange(event.target.value);
  };

  const handleFocus = (event) => {
    setIsFocused(true);
  };

  const handleKeyDown = (event) => {
    switch (event.keyCode) {
      case 27: // Escape
        event.target.blur();
        break;
      default:
        break;
    }
  };

  let content = null;
  if (isFocused) {
    content = (
      <textarea
        data-testname={`CodeEditor-textarea-${testName}`}
        defaultValue={code}
        className={styles.TextArea}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        ref={textAreaRef}
        spellCheck="false"
      />
    );
  } else {
    content = (
      <Highlight
        key={code}
        {...defaultProps}
        code={code}
        theme={theme}
        language="javascript"
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} ${styles.Pre}`}
            data-testname={`CodeEditor-pre-${testName}`}
            onFocus={handleFocus}
            style={style}
            tabIndex={0}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line, key: i })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    );
  }

  return (
    <>
      <div className={styles.Header}>
        <div className={styles.HeaderText}>{label}</div>
        {isFocused && (
          <div className={styles.HeaderHint}>(auto-saves on blur)</div>
        )}
      </div>
      {content}
    </>
  );
}
