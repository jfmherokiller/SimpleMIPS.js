import {TokenNode} from "./index";
import {TOKEN_TYPES} from "../Tokenizer";

export class ParserNode extends TokenNode {
    type:TOKEN_TYPES;
    constructor(type){
        super(type)
    }
}