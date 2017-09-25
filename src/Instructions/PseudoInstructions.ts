
import {Lib} from "../Lib";
import {TOKEN_TYPE} from "../Tokenizer";
export class PseudoInstructions {
    PI_NAMES = [];
    PI_EXPECTS = [];
    PI_TRANSLATION = [];
    SHARED_INST = [];
    addPseudoInstruction(name:string,expects,translation:string)
    {
        this.PI_NAMES.push(name);
        this.PI_EXPECTS.push(expects);
        this.PI_TRANSLATION.push(translation);
    }
    constructor(cpuInstructionClasses) {

        this.makePitable();
        this.SHARED_INST = Lib.overlap(this.PI_NAMES, cpuInstructionClasses.INST_ALL);
    }

    makePitable() {
        /* pseudo instruction translation table
         * n - instruction name
         * e - expected tokens (do not include heading and trailing space)
         * t - translation format
         * 		{n} --> expectedToken[n].value
         * 		use {n.offset} to access offset property of COMOPR token
         * 		use {n.H} and {n.L} to access higher 16 bits and lower
         * 			16 bits of integer value respectively
         * 		use __h16__ and __l16__ prefix if you want translator only
         * 			use higher or lower 16 bits of the resolved address
         * 			of the corresponding label
         */
        // load address : la $rn, label
        this.addPseudoInstruction("la",
            [TOKEN_TYPE.REGOPR, TOKEN_TYPE.COMMA, TOKEN_TYPE.WORD],
            ('lui $r1,__h16__{2}' + ' ori {0},$r1,__l16__{2}'));
        // load immediate : li $rn, imm32
        this.addPseudoInstruction("li",
            [TOKEN_TYPE.REGOPR, TOKEN_TYPE.COMMA, [TOKEN_TYPE.INTEGER,TOKEN_TYPE.HEXNUM,TOKEN_TYPE.CHAR]],
            ('lui $r1,{2.H}' + ' ori {0},$r1,{2.L}'));
        // push register : pushr $rn
        this.addPseudoInstruction("pushr",
            [TOKEN_TYPE.REGOPR],
            ('sw {0},0($sp)' + ' addi $sp,$sp,-4'));
        // pop to register : pushr $rn
        this.addPseudoInstruction("popr",
            [TOKEN_TYPE.REGOPR],
            ('lw {0},4($sp)' + ' addi $sp,$sp,4'));
        // unconditional branch
        this.addPseudoInstruction("b",
            [TOKEN_TYPE.WORD],
            ('BEQ r0, r0, {0}'));
    }
}

