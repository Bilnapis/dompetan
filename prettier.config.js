module.exports = {
    printWidth: 80,
    semi: true,
    tabWidth: 4,
    trailingComma: "all",

    plugins: ["@ianvs/prettier-plugin-sort-imports"],
    importOrder: [
        "^react",
        "^react-native",
        "<THIRD_PARTY_MODULES>",
        "",
        "^[.]",
    ],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
};