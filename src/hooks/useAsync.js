import { useCallback, useEffect, useRef, useState } from "react";
import { parseApiError } from "../utils/format";

/** Runs an async loader and exposes { data, loading, error, reload }. Ignores stale responses. */
export default function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const runId = useRef(0);

  const run = useCallback(() => {
    const id = ++runId.current;
    setState((s) => ({ ...s, loading: true, error: "" }));
    loader()
      .then((data) => id === runId.current && setState({ data, loading: false, error: "" }))
      .catch((err) => id === runId.current && setState({ data: null, loading: false, error: parseApiError(err, "Could not load this content.").message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, reload: run };
}
