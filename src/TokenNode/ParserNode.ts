import {TokenNode} from "./index";
import {TOKEN_TYPE} from "../Tokenizer";

export class ParserNode extends TokenNode {
    type:TOKEN_TYPE;
    constructor(type){
        super(type)
    }
}