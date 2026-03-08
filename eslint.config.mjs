import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import styleFirewall from "./eslint/style-firewall.mjs";

export default [
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/styled-system/**",
      "**/playwright/**",
      "**/test-results/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "style-firewall": styleFirewall,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "style-firewall/no-inline-style-except-geometry": "error",
      "style-firewall/no-raw-colors": "error",
      "style-firewall/no-raw-box-shadow": "error",
      "style-firewall/no-raw-border-radius": "error",
      "style-firewall/no-styling-outside-ui": [
        "error",
        {
          allow: ["src/components/ui", "src/theme", "src/styled-system"],
        },
      ],
      "style-firewall/no-surface-props-outside-recipes": [
        "error",
        {
          allow: ["src/theme", "src/components/ui"],
        },
      ],
      "style-firewall/prefer-panda-css": "error",
    },
  },
  {
    files: ["**/*.spec.ts", "**/*.spec.tsx", "**/*.e2e.spec.ts"],
    rules: {
      "style-firewall/no-inline-style-except-geometry": "off",
      "style-firewall/no-raw-colors": "off",
      "style-firewall/no-raw-box-shadow": "off",
      "style-firewall/no-raw-border-radius": "off",
      "style-firewall/no-styling-outside-ui": "off",
      "style-firewall/no-surface-props-outside-recipes": "off",
      "style-firewall/prefer-panda-css": "off",
    },
  },
];
