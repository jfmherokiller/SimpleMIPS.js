export const enum TOKEN_TYPE {
    SPECIAL,
    LABEL,
    STRING,
    COMMA,
    SPACE,
    REGOPR,
    COMOPR,
    INTEGER,
    FLOAT,
    HEXNUM,
    WORD,
    CHAR,
}

export class regexObject {
    ListOfRegexes = [];

    addRegexLine(type: TOKEN_TYPE, regex: RegExp) {
        this.ListOfRegexes[type] = regex;
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
        this.addRegexLine(TOKEN_TYPE.INTEGER, /^(-?\d+\b)/); // 123456
        this.addRegexLine(TOKEN_TYPE.FLOAT, /^-?([\d]+[.][\d]+)$/); //1.0
        this.addRegexLine(TOKEN_TYPE.WORD, /^([\w.$]+)(?!:)/); //In$ertD4taH3re
        this.addRegexLine(TOKEN_TYPE.CHAR, /^'([^'\\]|\\*)'/); //'\b\n'
        this.addRegexLine(TOKEN_TYPE.HEXNUM, /^(0x[\da-fA-F]+\b)/)
    }
}