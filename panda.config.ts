import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,

  include: ["./src/**/*.{js,jsx,ts,tsx}"],

  jsxFramework: "react",

  outdir: "styled-system",

  theme: {
    extend: {},
  },
});
