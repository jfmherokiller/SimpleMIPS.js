export class TokenNode {
    type;
    value;
    offset;
    addr;
    line;
    size;
    data;

    constructor(type) {
        this.type = type;
        this.value = undefined;
        this.offset = undefined;
    }
}
