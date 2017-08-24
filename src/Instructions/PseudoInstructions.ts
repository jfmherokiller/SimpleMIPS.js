
import {Lib} from "../Lib";
import {TOKEN_TYPES} from "../Tokenizer";
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
            [TOKEN_TYPES.REGOPR, TOKEN_TYPES.COMMA, TOKEN_TYPES.WORD],
            ('lui $r1,__h16__{2} ' + 'ori {0},$r1,__l16__{2}'));
        // load immediate : li $rn, imm32
        this.addPseudoInstruction("li",
            [TOKEN_TYPES.REGOPR, TOKEN_TYPES.COMMA, TOKEN_TYPES.INTEGER],
            ('lui $r1,{2.H} ' + 'ori {0},$r1,{2.L}'));
        // push register : pushr $rn
        this.addPseudoInstruction("pushr",
            [TOKEN_TYPES.REGOPR],
            ('sw {0},0($sp)' + 'addi $sp,$sp,-4'));
        // pop to register : pushr $rn
        this.addPseudoInstruction("popr",
            [TOKEN_TYPES.REGOPR],
            ('lw {0},4($sp)' + 'addi $sp,$sp,4'));
    }
}

