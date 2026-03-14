const FACTORY_NAME_MAP = {
  "oze factory": "\u5c0f\u702c\u5de5\u5834", // 小瀬工場
  kurachi: "\u5009\u77e5\u5de5\u5834", // 倉知工場
  "kurachi factory": "\u5009\u77e5\u5de5\u5834", // 倉知工場
  "factory 1": "\u7b2c\u4e00\u5de5\u5834", // 第一工場
  "factory 2": "\u7b2c\u4e8c\u5de5\u5834", // 第二工場
  "factory 3": "\u5929\u5fb3\u5de5\u5834", // 天徳工場
  "factory 4": "\u91ce\u7530\u5009\u5eab", // 野田倉庫
  "factory 5": "\u7b2c\u4e00\u5de5\u5834", // 第一工場
  "factory 6": "\u7b2c\u4e8c\u5de5\u5834", // 第二工場
};

const KANJI_DIGITS = ["", "\u4e00", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d", "\u4e03", "\u516b", "\u4e5d"];

function toSimpleKanjiNumber(num) {
  if (num <= 0 || !Number.isInteger(num)) return "";
  if (num < 10) return KANJI_DIGITS[num];
  if (num === 10) return "\u5341";
  if (num < 20) return `\u5341${KANJI_DIGITS[num % 10]}`;
  if (num % 10 === 0) return `${KANJI_DIGITS[Math.floor(num / 10)]}\u5341`;
  return `${KANJI_DIGITS[Math.floor(num / 10)]}\u5341${KANJI_DIGITS[num % 10]}`;
}

function normalizeFactoryName(name) {
  return String(name || "").trim().toLowerCase();
}

export function getDisplayFactoryName(name) {
  const normalized = normalizeFactoryName(name);

  if (FACTORY_NAME_MAP[normalized]) {
    return FACTORY_NAME_MAP[normalized];
  }

  const match = normalized.match(/^factory\s+(\d+)$/i);
  if (!match) return name;

  const num = Number(match[1]);
  const kanjiNum = toSimpleKanjiNumber(num);
  return kanjiNum ? `\u7b2c${kanjiNum}\u5de5\u5834` : name; // 第N工場
}
