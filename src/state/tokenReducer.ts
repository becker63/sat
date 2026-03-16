import type { TokenSource } from "./tokenSources";

export interface TokenState {
  query: number;
  anchor: number;
  closure: number;
  semantic: number;
}

export const initialTokenState: TokenState = {
  query: 0,
  anchor: 0,
  closure: 0,
  semantic: 0,
};

export function tokenReducer(
  state: TokenState,
  source: TokenSource,
  tokens: number,
): TokenState {
  return {
    ...state,
    [source]: state[source] + tokens,
  };
}
