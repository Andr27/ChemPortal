// Рекурсивно собирает текст из TipTap-документа (узлы с типом "text" имеют поле .text)
const extractTextFromTipTap = (node) => {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractTextFromTipTap).join(' ');
    let result = '';
    if (typeof node.text === 'string') result += node.text;
    if (Array.isArray(node.content)) {
        result += (result ? ' ' : '') + node.content.map(extractTextFromTipTap).join(' ');
    }
    return result;
};

// Принимает строку, TipTap-JSON (строкой или объектом) — возвращает чистый текст
export const toPlainText = (input) => {
    if (input == null) return '';
    if (typeof input === 'string') {
        const trimmed = input.trim();
        // Попытка распарсить как JSON (если это TipTap)
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                return extractTextFromTipTap(parsed).replace(/\s+/g, ' ').trim();
            } catch {
                return trimmed;
            }
        }
        return trimmed;
    }
    if (typeof input === 'object') {
        return extractTextFromTipTap(input).replace(/\s+/g, ' ').trim();
    }
    return String(input);
};

// Обрезает текст до maxWords слов, добавляет многоточие если обрезано
export const truncateWords = (text, maxWords = 15) => {
    if (!text) return '';
    const words = String(text).trim().split(/\s+/);
    if (words.length <= maxWords) return words.join(' ');
    return words.slice(0, maxWords).join(' ') + '...';
};

// Удобный шорткат: на вход что угодно (string / TipTap), на выход — обрезанный plain text
export const makeExcerpt = (input, maxWords = 15) => truncateWords(toPlainText(input), maxWords);
