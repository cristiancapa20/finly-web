import { sileo } from "sileo";

const baseStyles = {
  fill: "#171717",
  styles: {
    title: "!text-white",
    description: "!text-white/80",
  },
};

export const toast = {
  success: (opts: { title: string; description?: string }) =>
    sileo.success({ ...baseStyles, ...opts }),
  error: (opts: { title: string; description?: string }) =>
    sileo.error({ ...baseStyles, ...opts }),
};
