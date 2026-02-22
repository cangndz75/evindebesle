import { generateSlug } from "./lib/slug";

const testCases = [
    { input: "İç Giyim", expected: "ic-giyim" },
    { input: "ATLET", expected: "atlet" },
    { input: "Erkek Dış Giyim", expected: "erkek-dis-giyim" },
    { input: "Pijama & Sabahlık", expected: "pijama-sabahlik" },
    { input: "ŞÖFÖR", expected: "sofor" },
    { input: "Ilık Su", expected: "ilik-su" }
];

console.log("Starting Slug Generation Tests...\n");

let passed = 0;
testCases.forEach(({ input, expected }) => {
    const result = generateSlug(input);
    const status = result === expected ? "✅ PASSED" : "❌ FAILED";
    console.log(`${status}: "${input}" -> "${result}" (Expected: "${expected}")`);
    if (result === expected) passed++;
});

console.log(`\nTests Completed: ${passed}/${testCases.length} passed.`);
if (passed !== testCases.length) {
    process.exit(1);
}
