export function numberToTurkishText(amount: number): string {
    if (amount === 0) return "SIFIR TÃœRK LÄ°RASI";

    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);

    const ones = ["", "BÄ°R", "Ä°KÄ°", "ÃœÃ‡", "DÃ–RT", "BEÅ", "ALTI", "YEDÄ°", "SEKÄ°Z", "DOKUZ"];
    const tens = ["", "ON", "YÄ°RMÄ°", "OTUZ", "KIRK", "ELLÄ°", "ALTMIÅ", "YETMÄ°Å", "SEKSEN", "DOKSAN"];
    const groups = ["", "BÄ°N", "MÄ°LYON", "MÄ°LYAR", "TRÄ°LYON"];

    function convertGroup(num: number): string {
        if (num === 0) return "";

        const h = Math.floor(num / 100);
        const t = Math.floor((num % 100) / 10);
        const o = num % 10;

        let result = "";

        if (h === 1) result += "YÃœZ ";
        else if (h > 1) result += ones[h] + " YÃœZ ";

        result += tens[t] + " ";
        result += ones[o] + " ";

        return result.trim();
    }

    function convertInteger(num: number): string {
        if (num === 0) return "SIFIR";

        let result = "";
        let groupIndex = 0;
        let tempNum = num;

        while (tempNum > 0) {
            const groupValue = tempNum % 1000;

            if (groupValue > 0) {
                let groupText = convertGroup(groupValue);

                if (groupIndex === 1 && groupValue === 1) {
                    groupText = "";
                }

                result = groupText + " " + groups[groupIndex] + " " + result;
            }

            tempNum = Math.floor(tempNum / 1000);
            groupIndex++;
        }

        return result.trim();
    }

    const integerText = convertInteger(integerPart);
    const decimalText = decimalPart > 0 ? convertInteger(decimalPart) : "SIFIR";

    let result = integerText + " TÃœRK LÄ°RASI";
    if (decimalPart > 0) {
        result += " " + decimalText + " KURUÅ";
    }

    return result;
}
