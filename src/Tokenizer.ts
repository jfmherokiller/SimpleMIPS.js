export const enum TOKEN_TYPE {
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

    addRegexLine(type: TOKEN_TYPE, regex: RegExp) {
        this.tokenTypeNames.push(type.toString());
        this.tokenRegexps.push(regex);
        this.tokenTypeCount++;
    }

    constructor() {
        this.addRegexLine(TOKEN_TYPE.SPECIAL, /^\.\w+/);
        this.addRegexLine(TOKEN_TYPE.LABEL, /^(\w+):/);
        this.addRegexLine(TOKEN_TYPE.STRING, /^"(([^\\"]|\\.)*)"/);
        this.addRegexLine(TOKEN_TYPE.COMMA, /^\s*,\s*/);
        this.addRegexLine(TOKEN_TYPE.SPACE, /^\s+/);
        this.addRegexLine(TOKEN_TYPE.REGOPR, /^(\$\w{1,2}|zero)/);
        // char is also integer
        this.addRegexLine(TOKEN_TYPE.COMOPR, /^(-*\d*)\((\$\w{1,2}|zero)\)/);
        this.addRegexLine(TOKEN_TYPE.INTEGER, /^(0x[\da-f]+|-*\d+|'([^'\\]|\\*)')/);
        this.addRegexLine(TOKEN_TYPE.WORD, /^(\w+\.*\w+|\w+)(?!:)/);
    }
}