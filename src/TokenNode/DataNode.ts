import {TokenNode} from "./index";
import {NODE_TYPE} from "../Assembler";

export class DataNode extends TokenNode {
    line:number;
    addr:number;
    size:number;
    data:number;
    constructor(line_number,current_address)
    {
        super(NODE_TYPE.DATA);
        this.line = line_number;
        this.addr = current_address;
    }


}