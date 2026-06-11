import { useEffect, useState } from "react";

import {
  type RuntimeShellState
} from "../../../../packages/core-runtime/src/runtime-fixture-reader";
import { loadSelectedRuntimeDataState } from "./runtime-data-source";

type LoadingState = {
  status: "loading";
  message: string;
};

export function useRuntimeFixture(): RuntimeShellState | LoadingState {
  const [state, setState] = useState<RuntimeShellState | LoadingState>({
    status: "loading",
    message: "Loading selected runtime data source."
  });

  useEffect(() => {
    let mounted = true;

    loadSelectedRuntimeDataState()
      .then((nextState) => {
        if (mounted) {
          setState(nextState);
        }
      })
      .catch((error: unknown) => {
        if (mounted) {
          setState({
            status: "missing",
            message: error instanceof Error ? error.message : "Runtime data source failed to load."
          });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
