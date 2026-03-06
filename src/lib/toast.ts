import { sileo } from "sileo";

export const toast = {
  success: (opts: { title: string; description?: string }) =>
    sileo.success(opts),
  error: (opts: { title: string; description?: string }) =>
    sileo.error(opts),
};
