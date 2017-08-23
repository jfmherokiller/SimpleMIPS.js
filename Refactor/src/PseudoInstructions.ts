import {tokenizer} from "./Instructions";
import {Lib} from "./Lib";

export interface PsudoInstruction {
    n: string;
    e: tokenizer.TOKEN_TYPES[];
    t: string;
}
export class PseudoInstructions {
    PI_NAMES = [];
    PI_EXPECTS = [];
    PI_TRANSLATION = [];
    SHARED_INST = [];
    PI_TABLE:PsudoInstruction[];

    constructor(cpuInstructionClasses) {
        this.makePitable();
        for (let PI_COUNT = 0; PI_COUNT < this.PI_TABLE.length; PI_COUNT++) {
            this.PI_NAMES.push(this.PI_TABLE[PI_COUNT].n);
            this.PI_EXPECTS.push(this.PI_TABLE[PI_COUNT].e);
            this.PI_TRANSLATION.push(this.PI_TABLE[PI_COUNT].t);
        }
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
        this.PI_TABLE = [
            { // load address : la $rn, label
                n: 'la',
                e: [
                    tokenizer.TOKEN_TYPES.REGOPR,
                    tokenizer.TOKEN_TYPES.COMMA,
                    tokenizer.TOKEN_TYPES.WORD
                ],
                t: 'lui $r1,__h16__{2} ' +
                'ori {0},$r1,__l16__{2}'
            }, { // load immediate : li $rn, imm32
                n: 'li',
                e: [
                    tokenizer.TOKEN_TYPES.REGOPR,
                    tokenizer.TOKEN_TYPES.COMMA,
                    tokenizer.TOKEN_TYPES.INTEGER
                ],
                t: 'lui $r1,{2.H} ' +
                'ori {0},$r1,{2.L}'
            }, { // push register : pushr $rn
                n: 'pushr',
                e: [
                    tokenizer.TOKEN_TYPES.REGOPR
                ],
                t: 'sw {0},0($sp)' +
                'addi $sp,$sp,-4'
            }, { // pop to register : pushr $rn
                n: 'popr',
                e: [
                    tokenizer.TOKEN_TYPES.REGOPR
                ],
                t: 'lw {0},4($sp)' +
                'addi $sp,$sp,4'
            }
        ];
    }
}

