export enum TOKEN_TYPE {
    SPECIAL,
    LABEL,
    STRING,
    COMMA,
    SPACE,
    REGOPR,
    COMOPR,
    INTEGER,
    FLOAT,
    WORD,
    ESCAPED,
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
        this.addRegexLine(TOKEN_TYPE.LABEL, /^([$\w]+|\w+):/); // mylabel$
        this.addRegexLine(TOKEN_TYPE.STRING, /^"(([^\\"]|\\.)*)"/); // "this is a string"
        this.addRegexLine(TOKEN_TYPE.COMMA, /^\s*,\s*/); // `,`
        this.addRegexLine(TOKEN_TYPE.SPACE, /^\s+/); // ` `
        this.addRegexLine(TOKEN_TYPE.REGOPR, /^(\$zero|\$\w{1,2}\b)/); //$ra
        // char is also integer
        this.addRegexLine(TOKEN_TYPE.COMOPR, /^(-?\d*)\((\$\w{1,2}|\$zero)\)/); // offset(base)
        this.addRegexLine(TOKEN_TYPE.INTEGER, /^(0x[\da-f]+|-?\d+)/); // 123456
        this.addRegexLine(TOKEN_TYPE.FLOAT, /^(?![A-Za-z_+]+)(\d+\.\d+)(?![A-Za-z_+]+)/); //1.0
        this.addRegexLine(TOKEN_TYPE.WORD, /^([\w.$]+)(?!:)/); //In$ertD4taH3re
        this.addRegexLine(TOKEN_TYPE.ESCAPED, /^'([^'\\]|\\*)'/)
    }
}