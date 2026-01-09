import { login } from "./login";
import { logout } from "./logout";
import { magicLink } from "./magic-link";
import { signup } from "./signup";

export const handlers = {
  login,
  signup,
  "magic-link": magicLink,
  logout,
} as const;
