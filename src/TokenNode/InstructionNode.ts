import {TokenNode} from "./index";
import {Assembler, NODE_TYPE} from "../Assembler";

export class InstructionNode extends TokenNode {
    inst:string;
    addr: number;
    size: number;
    rs:number;
    rd:number;
    rt:number;
    imm:number;
    line: number;
    constructor(instructionName,currentAddress,InstructionSize,line_number)
    {
        super(NODE_TYPE.TEXT);
        this.inst = instructionName;
        this.addr = currentAddress;
        this.size = InstructionSize;
        this.line = line_number;
    }

}