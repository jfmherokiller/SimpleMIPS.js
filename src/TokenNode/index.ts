export class TokenNode {
    type;
    value;
    offset;

    constructor(type) {
        this.type = type;
        this.value = undefined;
        this.offset = undefined;
    }
}
export {InstructionNode} from "./InstructionNode";
export {ParserNode} from "./ParserNode";
export {DataNode} from "./DataNode";