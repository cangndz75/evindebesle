const turkishToEnglish = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
};

function generateSlug(text) {
    let slug = text;
    for (const [turkish, english] of Object.entries(turkishToEnglish)) {
        slug = slug.replace(new RegExp(turkish, 'g'), english);
    }
    return slug
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

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
    const status = result === expected ? "OK" : "FAILED";
    console.log(`${status}: "${input}" -> "${result}" (Expected: "${expected}")`);
    if (result === expected) passed++;
});

console.log(`\nTests Completed: ${passed}/${testCases.length} passed.`);
if (passed !== testCases.length) {
    process.exit(1);
}
