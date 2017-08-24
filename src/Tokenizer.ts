export const enum TOKEN_TYPES {
    SPECIAL,
    LABEL,
    STRING,
    COMMA,
    SPACE,
    REGOPR,
    COMOPR,
    INTEGER,
    WORD,
}

export class regexObject {
    tokenRegexps: RegExp[] = [];
    tokenTypeNames: string[] = [];
    tokenTypeCount: number = 0;

    addRegexLine(type: TOKEN_TYPES, regex: RegExp) {
        this.tokenTypeNames.push(type.toString());
        this.tokenRegexps.push(regex);
        this.tokenTypeCount++;
    }

    constructor() {
        this.addRegexLine(TOKEN_TYPES.SPECIAL, /^\.\w+/);
        this.addRegexLine(TOKEN_TYPES.LABEL, /^(\w+):/);
        this.addRegexLine(TOKEN_TYPES.STRING, /^"(([^\\"]|\\.)*)"/);
        this.addRegexLine(TOKEN_TYPES.COMMA, /^\s*,\s*/);
        this.addRegexLine(TOKEN_TYPES.SPACE, /^\s+/);
        this.addRegexLine(TOKEN_TYPES.REGOPR, /^(\$\w{1,2}|zero)/);
        // char is also integer
        this.addRegexLine(TOKEN_TYPES.COMOPR, /^(-*\d*)\((\$\w{1,2}|zero)\)/);
        this.addRegexLine(TOKEN_TYPES.INTEGER, /^(0x[\da-f]+|-*\d+|'([^'\\]|\\*)')/);
        this.addRegexLine(TOKEN_TYPES.WORD, /^(\w+)(?!:)/);
    }
}