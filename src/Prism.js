import { useLayoutEffect, useRef, useState } from "react";
import Highlight, { defaultProps } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/palenight";
import styles from "./Prism.module.css";

export default function Prism({ code, onChange }) {
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
  };

  const handleFocus = (event) => {
    setIsFocused(true);
  };

  const handleChange = (event) => {
    event.preventDefault();
    event.stopPropagation();

    onChange(event.target.value);
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

  if (isFocused) {
    return (
      <textarea
        defaultValue={code}
        className={styles.TextArea}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        ref={textAreaRef}
      />
    );
  }

  return (
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
          onFocus={handleFocus}
          style={style}
          tabIndex={0}
        >
          {tokens.map((line, i) => (
            <div {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
