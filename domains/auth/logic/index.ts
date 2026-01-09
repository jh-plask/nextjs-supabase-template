import type { AuthInput, Operation } from "../schema";
import { loginHandler } from "./login";
import { logoutHandler } from "./logout";
import { magicLinkHandler } from "./magic-link";
import { signupHandler } from "./signup";

// Handler dispatch (server-only)
const handlers: Record<Operation, (data: AuthInput) => Promise<unknown>> = {
  login: loginHandler,
  signup: signupHandler,
  "magic-link": magicLinkHandler,
  logout: logoutHandler,
};

export function getHandler(operation: Operation) {
  return handlers[operation];
}
