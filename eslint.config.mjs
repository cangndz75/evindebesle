import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: ["lib/generated/**", "prisma/**", "node_modules/**", ".next/**", ".next-ci/**", ".next-ci-retry/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  {
    files: ["**/*.{js,cjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
