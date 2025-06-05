export function highlightSensitiveKeywords(text: string, sensitiveKeywords: string[]): string {
    let highlightedText = text;
    const lowerCaseText = text.toLowerCase();

    sensitiveKeywords.forEach(keyword => {
        const lowerCaseKeyword = keyword.toLowerCase();
        if (lowerCaseText.includes(lowerCaseKeyword)) {
            const regex = new RegExp(`(?<=\b|[^a-zA-Z0-9])(${escapeRegExp(keyword)})(?=\b|[^a-zA-Z0-9])`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="text-red-500 font-bold">$1</span>');
        }
    });

    return highlightedText;
}

function escapeRegExp(string: string): string {
    return string.replace(/[.*+\-?^\[\](){}|]/g, '\\$&'); // $& means the matched substring
} 