import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { formatNumberInput, parseNumberInput, reformat } from "../numberInput.js";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const isSpace = (char) => /[\s\u00a0\u202f\u2009]/.test(char || "");

// Text field that shows 100 000 000 while typing and passes the parsed
// number (or "" / NaN) up. The caret stays after the same digit when the
// grouping changes; Backspace/Delete next to a group space removes the digit.
export default function NumberField({ id, value, decimal = false, onValue, ...rest }) {
  const options = { decimal };
  const ref = useRef(null);
  const caret = useRef(null);
  const [draft, setDraft] = useState(() => formatNumberInput(value, options));
  const [seen, setSeen] = useState(value);
  if (!Object.is(seen, value)) {
    setSeen(value);
    if (!Object.is(parseNumberInput(draft, options), value)) setDraft(formatNumberInput(value, options));
  }

  useIsoLayoutEffect(() => {
    const input = ref.current;
    if (caret.current === null || !input || document.activeElement !== input) return;
    input.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  const onChange = (event) => {
    const next = reformat(event.target.value, event.target.selectionStart ?? event.target.value.length, options);
    caret.current = next.caret;
    setDraft(next.text);
    onValue(next.value);
  };

  const onKeyDown = (event) => {
    const input = event.currentTarget;
    const { selectionStart: start, selectionEnd: end, value: text } = input;
    if (start !== end || start === null) return;
    if (event.key === "Backspace" && start > 1 && isSpace(text[start - 1])) input.setSelectionRange(start - 1, start - 1);
    if (event.key === "Delete" && isSpace(text[start])) input.setSelectionRange(start + 1, start + 1);
  };

  return (
    <input ref={ref} id={id} type="text" inputMode={decimal ? "decimal" : "numeric"} autoComplete="off" spellCheck={false}
      value={draft} onChange={onChange} onKeyDown={onKeyDown} {...rest} />
  );
}
