import {FPU_format} from "./index";
import {Lib} from "../Lib";
import {InstructionNode} from "../TokenNode/InstructionNode";

export class Instructions {
    static instructionTable = {
        // load/store
        'lb': ['1000 00ss ssst tttt iiii iiii iiii iiii', 'RC', 'S'], // $t=(byte)mem[$s+imm]
        'lbu': ['1001 00ss ssst tttt iiii iiii iiii iiii', 'RC', 'S'], // $t=(ubyte)mem[$s+imm]
        'lh': ['1000 01ss ssst tttt iiii iiii iiii iiii', 'RC', 'S'], // $t=(halfword)mem[$s+imm]
        'lhu': ['1001 01ss ssst tttt iiii iiii iiii iiii', 'RC', 'S'], // $t=(uhalfword)mem[$s+imm]
        'lui': ['0011 1100 000t tttt iiii iiii iiii iiii', 'RI', 'U'], // $t=imm<<16
        'lw': ['1000 11ss ssst tttt iiii iiii iiii iiii', 'RC', 'S'], // $t=(word)mem[$s+imm]
        'sb': ['1010 00ss ssst tttt iiii iiii iiii iiii', 'RC', 'S'], // (byte)mem[$s+imm]=$t
        'sh': ['1010 01ss ssst tttt iiii iiii iiii iiii', 'RC', 'S'], // (halfword)mem[$s+imm]=$t, must align
        'sw': ['1010 11ss ssst tttt iiii iiii iiii iiii', 'RC', 'S'], // (word)mem[$s+imm]=$t, must align
        'mfhi': ['0000 0000 0000 0000 dddd d000 0001 0000', 'RT', 'S'],
        'mflo': ['0000 0000 0000 0000 dddd d000 0001 0010', 'RT', 'S'],
        'mthi': ['0000 00ss sss0 0000 0000 0000 0001 0001', 'RS', 'S'],
        'mtlo': ['0000 00ss sss0 0000 0000 0000 0001 0011', 'RS', 'S'],
        'mtc0': ['0100 0000 100s ssss dddd d000 0000 0iii', 'RRI', 'N'], // CPR[0,rd,sel] ← data
        'mtc1': ['0100 0100 100t tttt ssss s000 0000 0000', 'RR', 'N'], //move word from rt to float reg fs;fs ← rt
        // arithmetic
        'addi': ['0010 00ss ssst tttt iiii iiii iiii iiii', 'RRI', 'S'], // $t=$s+imm with ov
        'addiu': ['0010 01ss ssst tttt iiii iiii iiii iiii', 'RRI', 'U'], // $t=$s+imm unsigned no ov
        'add': ['0000 00ss ssst tttt dddd d000 0010 0000', 'RRR', 'N'], // $d=$s+$t with ov
        'addu': ['0000 00ss ssst tttt dddd d000 0010 0001', 'RRR', 'N'], // $d=$s+$t unsigned no ov
        'div': ['0000 00ss ssst tttt 0000 0000 0001 1010', 'RR', 'S'], // $LO = $s / $t; $HI = $s % $t;
        'divu': ['0000 00ss ssst tttt 0000 0000 0001 1011', 'RR', 'U'], // $LO = $s / $t; $HI = $s % $t;
        'mult': ['0000 00ss ssst tttt 0000 0000 0001 1000', 'RR', 'N'], //$LO = $s * $t;
        'multu': ['0000 00ss ssst tttt 0000 0000 0001 1001', 'RR', 'N'],//$LO = $s * $t;
        'sub': ['0000 00ss ssst tttt dddd d000 0010 0010', 'RRR', 'N'], // $d=$s-$t with ov
        'subu': ['0000 00ss ssst tttt dddd d000 0010 0011', 'RRR', 'N'], // $d=$s-$t unsigned no ov
        'slt': ['0000 00ss ssst tttt dddd d000 0010 1010', 'RRR', 'N'], // $d=($s<$t)?1:0 signed
        'slti': ['0010 10ss ssst tttt iiii iiii iiii iiii', 'RRI', 'S'], // $t=($s<imm)?1:0 signed extend imm
        'sltu': ['0000 00ss ssst tttt dddd d000 0010 1011', 'RRR', 'N'], // $d=($s<$t)?1:0 unsigned
        'sltiu': ['0010 11ss ssst tttt iiii iiii iiii iiii', 'RRI', 'U'], // $t=($s<imm)?1:0 unsigned
        // logical
        'and': ['0000 00ss ssst tttt dddd d000 0010 0100', 'RRR', 'N'], // $d=$s&$t
        'andi': ['0011 00ss ssst tttt iiii iiii iiii iiii', 'RRI', 'U'], // $t=$s$imm zero extend
        'or': ['0000 00ss ssst tttt dddd d000 0010 0101', 'RRR', 'N'], // $d=$s|$t
        'ori': ['0011 01ss ssst tttt iiii iiii iiii iiii', 'RRI', 'U'], // $t=$s|imm zero extend
        'xor': ['0000 00ss ssst tttt dddd d000 0010 0110', 'RRR', 'N'], // $d=$s^$t
        'xori': ['0011 10ss ssst tttt iiii iiii iiii iiii', 'RRI', 'U'], // $t=$s^imm zero extend
        'nor': ['0000 00ss ssst tttt dddd d000 0010 0111', 'RRR', 'N'], // $d=$s nor $t
        'sll': ['0000 0000 000t tttt dddd daaa aa00 0000', 'RRA', 'N'], // $d=$t<<a
        'sllv': ['0000 00ss ssst tttt dddd d000 0000 0100', 'RRR', 'N'], // $d=$t<<($s&0x1f)
        'srl': ['0000 0000 000t tttt dddd daaa aa00 0010', 'RRA', 'N'], // $d=$t>>a logic
        'sra': ['0000 0000 000t tttt dddd daaa aa00 0011', 'RRA', 'N'], // $d=$t>>a arithmetic
        'srlv': ['0000 00ss ssst tttt dddd d000 0000 0110', 'RRR', 'N'], // $d=$t>>($s&0x1f) logic
        'srav': ['0000 00ss ssst tttt dddd d000 0000 0111', 'RRR', 'N'], // $d=$t>>($s&0x1f) arithmetic
        // jmp (HAVE DELAY SLOTS)
        'j': ['0000 10ii iiii iiii iiii iiii iiii iiii', 'I', 'U'], // imm<<2 specify low bits of pc
        'jal': ['0000 11ii iiii iiii iiii iiii iiii iiii', 'I', 'U'], // $31=pc+4; imm<<2 specify low bits of pc
        'jr': ['0000 00ss sss0 0000 0000 0000 0000 1000', 'RS', 'N'], // pc=$s
        // branch (HAVE DELAY SLOTS)
        'bal': ['0000 0100 0001 0001 iiii iiii iiii iiii', 'I', 'S'], // $31=pc+4; pc=pc+sign_ext(imm<<2)
        'beq': ['0001 00ss ssst tttt iiii iiii iiii iiii', 'RRI', 'S'], // branch when $s=$t
        'bne': ['0001 01ss ssst tttt iiii iiii iiii iiii', 'RRI', 'S'], // branch when $s!=$t
        'blez': ['0001 10ss sss0 0000 iiii iiii iiii iiii', 'RSDRTI', 'S'], // if $s<=0 pc=pc+sign_ext(imm<<2)
        'bgtz': ['0001 11ss sss0 0000 iiii iiii iiii iiii', 'RSDRTI', 'S'], // if $s>0 pc=pc+sign_ext(imm<<2)
        'bltz': ['0000 01ss sss0 0000 iiii iiii iiii iiii', 'RSDRTI', 'S'], // if $s<0 pc=pc+sign_ext(imm<<2)
        'bgez': ['0000 01ss sss0 0001 iiii iiii iiii iiii', 'RSDRTI', 'S'], // if $s>=0 pc=pc+sign_ext(imm<<2)
        'bltzal': ['0000 01ss sss1 0000 iiii iiii iiii iiii', 'RSDRTI', 'S'], //if $s<0; $31=pc+4; pc=pc+sign_ext(imm<<2)
        'bgezal': ['0000 01ss sss1 0001 iiii iiii iiii iiii', 'RSDRTI', 'S'], //if $s>=0; $31=PC+4; pc=pc+sign_ext(imm<<2)

        // misc
        'nop': ['0000 0000 0000 0000 0000 0000 0000 0000', 'N', 'N'], // no op
        'ssnop': ['0000 0000 0000 0000 0000 0000 0100 0000', 'N', 'N'], // no op
        'syscall': ['0000 00cc cccc cccc cccc cccc cc00 1100', 'N', 'N'], //syscall instruction
        'sdbbp': ['0111 00cc cccc cccc cccc cccc cc11 1111', 'N', 'N'], //software debug breakpoint
        'break': ['0000 00cc cccc cccc cccc cccc cc00 1101', 'N', 'N'], // break
        'print': ['1111 11ss sss0 0000 0000 0000 0000 0000', 'RS', 'N'], // print $s simulation
        'printm': ['1111 11ss sss0 0000 0000 0000 0000 0001', 'RS', 'N'], // print mem[$s] simulation
        'prints': ['1111 11ss sss0 0000 0000 0000 0000 0010', 'RS', 'N'],  // print string@$s
        // floating point stuff
        // @Todo
    };

    static floatingpoint_instructions() {
        let newbases = {};
        let instruction_bases = [
            //arithmatic
            ['abs.', '0100 01ff fff0 0000 ssss sddd dd00 0101', 'FSRR', 'N'],
            ['add.', '0100 01ff ffft tttt ssss sddd dd00 0000', 'FSRRR', 'N'],
            ['ceil.w.', '0100 01ff fff0 0000 ssss sddd dd00 1110', 'FSRR', 'N'],
            ['cvt.d.', '0100 01ff fff0 0000 ssss sddd dd10 0001', 'FSRR', 'N'],
            ['cvt.s.', '0100 01ff fff0 0000 ssss sddd dd10 0000', 'FSRR', 'N'],
            ['cvt.w.', '0100 01ff fff0 0000 ssss sddd dd10 0100', 'FSRR', 'N'],
            ['div.', '0100 01ff ffft tttt ssss sddd dd00 0011', 'FSRRR', 'N'],
            ['mul.', '0100 01ff ffft tttt ssss sddd dd00 0010', 'FSRRR', 'N'],
            ['floor.w.', '0100 01ff fff0 0000 ssss sddd dd00 1111', 'FSRR', 'N'],
            ['round.w.', '0100 01ff fff0 0000 ssss sddd dd00 1100', 'FSRR', 'N'],
            ['sqrt.', '0100 01ff fff0 0000 ssss sddd dd00 0100', 'FSRR', 'N'],
            ['sub.', '0100 01ff ffft tttt ssss sddd dd00 0001', 'FSRRR', 'N'],
            ['trunc.w.', '0100 01ff fff0 0000 ssss sddd dd00 1101', 'FSRR', 'N'],
            //movement
            ['mov.', '0100 01ff fff0 0000 ssss sddd dd00 0110', 'FSRR', 'N'],
            //logical
            ['neg.', '0100 01ff fff0 0000 ssss sddd dd00 0111', 'FSRR', 'N'],
            //comparison
            ['c.cond.', '0100 01ff ffft tttt ssss sCCC 0011 OOOO', 'FSCRR', 'N']
        ];
        for (let inst of instruction_bases) {
            if (inst[0].indexOf("c.cond") !== -1) {
                "f,un,eq,ueq,olt,ult,ole,ule,sf,ngle,sf,ngle,seq,ngl,lt,nge,le,ngt".split(',').forEach(function (cond, index, array) {
                    let newinst = inst.slice();
                    let rawinst = newinst[0].slice(0, 2) + cond + ".";
                    for (let datatype of 'd,s'.split(',')) {
                        let newinst = inst.slice();
                        newinst[0] = rawinst + datatype;
                        newbases[newinst[0]] = newinst.slice(1);
                    }
                });
            } else {
                for (let datatype of 'd,s'.split(',')) {
                    let newinst = inst.slice();
                    let rawinst = inst[0] + datatype;
                    newbases[rawinst] = newinst.slice(1);
                }
            }
        }
        //encode the double/single type into the instruction bit field
        for (let inst in newbases) {
            let datatypestring;
            if (inst.lastIndexOf(".d") !== -1) {
                let double_string = FPU_format.double.toString(2);
                datatypestring = double_string.slice(0, 2) + " " + double_string.slice(2);
            }
            if (inst.lastIndexOf(".s") !== -1) {
                let single_string = FPU_format.single.toString(2);
                datatypestring = single_string.slice(0, 2) + " " + single_string.slice(2);
            }
            if (inst.lastIndexOf(".w") !== -1) {
                let word_string = FPU_format.word.toString(2);
                datatypestring = word_string.slice(0, 2) + " " + word_string.slice(2);
            }
            newbases[inst][0] = newbases[inst][0].replace("ff fff", datatypestring);
        }
        return newbases;
    }

    static MakeCPUInstructionClasses() {
        return new CPUInstrclass()
    }

    static MakeInstructionTypeTable(cpuinstr) {
        let InstrTypeObject = {INST_TYPE_OPS: [], INST_TYPES: [], INST_TYPE_COUNT: 0};
        for (let curType in cpuinstr.INST_CAT) {
            InstrTypeObject.INST_TYPE_OPS[InstrTypeObject.INST_TYPE_COUNT] = cpuinstr.INST_CAT[curType];
            InstrTypeObject.INST_TYPES[curType] = InstrTypeObject.INST_TYPE_COUNT;
            InstrTypeObject.INST_TYPE_COUNT++;
        }
        return InstrTypeObject;
    }
}

export class CPUInstrclass {
    INST_CAT = {	// instruction categorized by assembly format
        RRR: [],
        RRI: [],
        RRA: [],
        //RRC : [],
        RR: [],
        RI: [],
        RSDRTI: [],
        RC: [],
        RS: [],
        I: [],
        RT: [],
        N: [],
        FSRRR: [],
        FSRR: [],
        FSCRR: []
    };
    INST_ALL = [];
    // instructions using relative PC
    INST_REL_PC = [];
    // instructions using immediate number for shifting
    INST_IMM_SHIFT = [];
    // instructions with unsigned imm
    INST_UNSIGNED = [];
    INST_SIGNED = [];
    translators = {};

    constructor() {
        let cur;
        let needRs;
        let needRd;
        let needRt;
        let needImm;
        let instructions = Lib.extend(Instructions.instructionTable, Instructions.floatingpoint_instructions());


        // instructions with signed imm (need convertion when encoding)
        // classify
        for (let inst in instructions) {
            cur = instructions[inst];
            if (cur[0] && cur[0].length > 0) {
                this.INST_CAT[cur[1]].push(inst);
                this.INST_ALL.push(inst);
                if (inst.charAt(0) == 'b') {
                    this.INST_REL_PC.push(inst);
                }
                if (cur[0].indexOf('a') > 0) {
                    this.INST_IMM_SHIFT.push(inst);
                }
                if (cur[2] == 'U') {
                    this.INST_UNSIGNED.push(inst);
                }
                if (cur[2] == 'S') {
                    this.INST_SIGNED.push(inst);
                }
            }
        }
        this.CreateTranslators(cur);
    }

    private TranslateInstruction(cur:InstructionNode) {
        let InstrInfo = Instructions.instructionTable[cur.inst];
        let InstrString = InstrInfo[0];
        let InstrCatagory = InstrInfo[1];
        let SignedOrUnsigned = InstrInfo[2];
    }

    private CreateTranslators(cur) {
// build translators
        let translators = {};
        let funcBody;
        let funcCode;
        let immStartIdx;
        let immEndIdx;
        let immLength;
        for (let inst in Instructions.instructionTable) {
            funcBody = '';
            let type = Instructions.instructionTable[inst][1];
            cur = Instructions.instructionTable[inst][0]
                .replace(/c/g, '0') // @TODO: break code support
                .replace(/a/g, 'i') // a is also i
                .replace(/-/g, '0')
                .replace(/f/g, '0')
                .replace(/ /g, ''); // no need for format
            let instCode = parseInt(cur.slice(0, 6), 2);
            let copCode = parseInt(cur.slice(26, 31), 2);
            let rs = parseInt(cur.slice(6, 11), 2);
            let rt = parseInt(cur.slice(11, 16), 2);
            let fmt = parseInt(cur.slice(6,11),2);
            // NOTE: becareful with JavaScripts casting here
            // 0xffffffff > 0
            // 0xffffffff & 0xffffffff = -1
            funcBody += `var base = (${instCode} << 26);\n`;
            // rs, rd, rt, fmt
            if (type.lastIndexOf('FS', 0) == 0) {
                funcBody += `base |= (${fmt} << 21);\n`;
                if (cur.indexOf('t') > 0) {
                    funcBody += 'base |= (info.ft << 16);\n';
                }
                if (cur.indexOf('s') > 0) {
                    funcBody += 'base |= (info.fs << 11);\n';
                } else {
                    funcBody += `base |= (${rs} << 11);\n`;
                }
                if (cur.indexOf('d') > 0) {
                    funcBody += 'base |= (info.fd << 6);\n';
                }

                funcBody += `base |= (${copCode} << 0);\n`; // coprocessor code

            } else {

                if (cur.indexOf('s') > 0) {
                    funcBody += 'base |= (info.rs << 21);\n';
                } else {
                    funcBody += `base |= (${rs} << 21);\n`
                }
                if (cur.indexOf('d') > 0) {
                    funcBody += 'base |= (info.rd << 11);\n';
                }
                if (cur.indexOf('t') > 0) {
                    funcBody += 'base |= (info.rt << 16);\n';
                }
            }

            if (type === 'RSDRTI') {
                funcBody += `base |= (${rt} << 16);\n`;
            }
            // imm
            immStartIdx = cur.indexOf('i');
            immEndIdx = cur.lastIndexOf('i');
            immLength = immEndIdx - immStartIdx;
            if (immLength > 0) {
                if (this.INST_SIGNED.indexOf(inst) >= 0) {
                    // convert signed immediate number to complement form
                    funcBody += 'base |= (((info.imm<0)?' + (1 << (immLength + 1)) + '+info.imm:info.imm) << ' + (31 - immEndIdx) + ');\n';
                } else {
                    funcBody += 'base |= (info.imm << ' + (31 - immEndIdx) + ');\n';
                }
            }
            // function code
            if (immEndIdx < 26) {
                //console.log(cur.slice(26, 32));
                funcCode = parseInt(cur.slice(26, 32), 2);
                funcBody += 'base |= ' + (funcCode) + ';\n';
            }
            funcBody += 'if (base < 0) base = 4294967296 + base;\n';
            funcBody += 'return base;';
            translators[inst] = new Function('info', funcBody);
        }
        this.translators = translators;
    }
}
