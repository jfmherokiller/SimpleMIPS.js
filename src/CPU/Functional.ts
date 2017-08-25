import {CPUInternal} from "./CPU";
import {EXCEPTION_CODE, MAX_PC, REGISTERS} from "./index";
import {Lib} from "../Lib";


export class FunctionalCPU extends CPUInternal {
    constructor(mem, callbacks?) {
        super(mem, callbacks);
        this.reset = this._fReset;
        this.step = this._fStep;
    }

    _fReset() {
        this.cycle = 0;
        this.pc = 0x00040000;
        this.branchTarget = undefined;
        this.registerFile[28] = 0x10008000; // $gp
        this.registerFile[29] = 0x7ffffffc; // $sp
    }

    _fStep(inDelaySlot) {
        //console.log(this);
        let mem = this.mem,
            r = this.registerFile,
            inst = mem.getWord(this.pc);
        r[0] = 0; // $r0 is always 0
        // decode
        let tmp = 0,
            hasDelaySlot = false,
            nextPC = this.pc + 4,
            exception = 0,
            breaking = false,
            opcode = (inst & 0xfc000000) >>> 26,
            func = inst & 0x3f,
            rs = (inst & 0x03e00000) >>> 21,
            rt = (inst & 0x001f0000) >>> 16,
            rd = (inst & 0x0000f800) >>> 11,
            a = (inst & 0x000007c0) >>> 6,
            imm = inst & 0xffff,
            imms = (imm & 0x8000) ? (imm | 0xffff0000) : imm; // sign-extended imm

        this.cycle++;
        switch (opcode) {
            case 0:
                switch (func) {
                    case 0: // sll rd, rt, sa
                        r[rd] = r[rt] << a;
                        break;
                    case 2: // srl rd, rt, sa
                        r[rd] = r[rt] >>> a;
                        break;
                    case 3: // sra rd, rt, sa
                        r[rd] = r[rt] >> a;
                        break;
                    case 4: // sllv rd, rt, rs
                        r[rd] = r[rt] << (r[rs] & 0x1f);
                        break;
                    case 6: // srlv rd, rt, rs
                        r[rd] = r[rt] >>> (r[rs] & 0x1f);
                        break;
                    case 7: // srav rd, rt, rs
                        r[rd] = r[rt] >> (r[rs] & 0x1f);
                        break;
                    case 8: // jr rs
                        nextPC = r[rs];
                        hasDelaySlot = true;
                        break;
                    case 13: // break;
                        // @TODO Break
                        exception |= EXCEPTION_CODE.BREAK;
                        break;
                    case 16: // mfhi
                        tmp = r[REGISTERS.$HI];
                        r[rd] = tmp;
                        break;
                    case 17: // mthi
                        tmp = r[rs];
                        r[REGISTERS.$HI] = tmp;
                        break;
                    case 18: // mflo
                        r[rd] = r[REGISTERS.$LO];
                        break;
                    case 19: // mtlo
                        r[REGISTERS.$LO] = r[rs];
                        break;
                    case 24: // mult
                        tmp = (r[rs] | 0) * (r[rt] | 0);
                        if (tmp > 0x7fffffff || tmp < -0x80000000) {
                            exception |= EXCEPTION_CODE.INT_OVERFLOW;
                        }
                        r[REGISTERS.$LO] = tmp;

                        break;
                    case 25: // multu
                        tmp = (r[rs]) * (r[rt]);
                        r[REGISTERS.$LO] = tmp;
                        break;
                    case 26: // div
                        tmp = (r[rs] | 0) % (r[rt] | 0);
                        r[REGISTERS.$HI] = tmp;
                        tmp = Math.floor(((r[rs] | 0) / (r[rt] | 0)));
                        r[REGISTERS.$LO] = tmp;
                        break;
                    case 27: // divu
                        tmp = (r[rs] | 0) % (r[rt] | 0);
                        r[REGISTERS.$HI] = tmp;
                        tmp = Math.floor(((r[rs] | 0) / (r[rt] | 0)));
                        r[REGISTERS.$LO] = tmp;
                        break;
                    case 32: // add rd, rs, rt with overflow check
                        // JavaScript casting trick here
                        // 0xffffffff | 0 = -1 --> get signed from unsigned
                        tmp = (r[rs] | 0) + (r[rt] | 0);
                        if (tmp > 0x7fffffff || tmp < -0x80000000) {
                            exception |= EXCEPTION_CODE.INT_OVERFLOW;
                        }
                        r[rd] = tmp;
                        break;
                    case 33: // addu rd, rs, rt
                        r[rd] = r[rs] + r[rt];
                        break;
                    case 34: // sub rd, rs, rt with overflow check
                        tmp = (r[rs] | 0) - (r[rt] | 0);
                        if (tmp > 0x7fffffff || tmp < -0x80000000) {
                            exception |= EXCEPTION_CODE.INT_OVERFLOW;
                        }
                        r[rd] = tmp;
                        break;
                    case 35: // subu rd, rs, rt
                        r[rd] = r[rs] - r[rt];
                        break;
                    case 36: // and rd, rs, rt
                        r[rd] = r[rs] & r[rt];
                        break;
                    case 37: // or rd, rs, rt
                        r[rd] = r[rs] | r[rt];
                        break;
                    case 38: // xor rd, rs, rt
                        r[rd] = r[rs] ^ r[rt];
                        break;
                    case 39: // nor rd, rs, rt
                        r[rd] = ~(r[rs] | r[rt]);
                        break;
                    case 42: // slt rd, rs, rt
                        r[rd] = (r[rs] | 0) < (r[rt] | 0);
                        break;
                    case 43: // sltu rd, rs, rt
                        r[rd] = (r[rs] < r[rt]);
                        break;
                    default:
                        exception |= EXCEPTION_CODE.INVALID_INST;
                }
                break;
            case 1:
                switch (rt) {
                    case 0: // bltz rs, offset
                        if ((r[rs] | 0) < 0) {
                            nextPC = this.pc + (imms << 2);
                            hasDelaySlot = true;
                        }
                        break;
                    case 1: // bgez rs, offset
                        if ((r[rs] | 0) >= 0) {
                            nextPC = this.pc + (imms << 2);
                            hasDelaySlot = true;
                        }
                        break;
                    case 16: // bgezal rs, offset
                        if ((r[rs] | 0) < 0) {
                            r[31] = this.pc + 4;
                            nextPC = this.pc + (imms << 2);
                            hasDelaySlot = true;
                        }
                        break;
                    case 17: // bgezal rs, offset
                        if ((r[rs] | 0) >= 0) {
                            r[31] = this.pc + 4;
                            nextPC = this.pc + (imms << 2);
                            hasDelaySlot = true;
                        }
                        break;
                    default:
                        exception |= EXCEPTION_CODE.INVALID_INST;
                }
                break;
            case 2: // J imm
                tmp = this.pc;
                tmp = (tmp & 0xf0000000) | ((inst & 0x03ffffff) << 2);
                if (tmp < 0) tmp = tmp + 4294967296;
                nextPC = tmp;
                hasDelaySlot = true;
                break;
            case 3: // JAL imm
                tmp = this.pc;
                r[REGISTERS.$RA] = this.pc +4;
                tmp = (tmp & 0xf0000000) | ((inst & 0x03ffffff) << 2);
                if (tmp < 0) tmp = tmp + 4294967296;
                nextPC = tmp;
                hasDelaySlot = true;
                break;
            case 4: // beq rs, rt, offset
                if (r[rs] == r[rt]) {
                    nextPC = this.pc + (imms << 2);
                    hasDelaySlot = true;
                }
                break;
            case 5: // bne rs, rt, offset
                if (r[rs] != r[rt]) {
                    nextPC = this.pc + (imms << 2);
                    hasDelaySlot = true;
                }
                break;
            case 6: // blez rs, offset
                if ((r[rs] | 0) <= 0) {
                    nextPC = this.pc + (imms << 2);
                    hasDelaySlot = true;
                }
                break;
            case 7: // bgtz rs, offset
                if ((r[rs] | 0) > 0) {
                    nextPC = this.pc + (imms << 2);
                    hasDelaySlot = true;
                }
                break;
            case 8: // addi rt, rs, imm with overflow check
                tmp = (r[rs] | 0) + imms;
                if (tmp > 0x7fffffff || tmp < -0x80000000) {
                    exception |= EXCEPTION_CODE.INT_OVERFLOW;
                }
                r[rt] = tmp;
                break;
            case 9: // addiu rt, rs, imm
                if (imm & 0x8000) {
                    r[rt] = r[rs] + imm + 0xffff0000;
                } else {
                    r[rt] = r[rs] + imm;
                }
                break;
            case 10: // slti rt, rs, imm
                r[rt] = ((r[rs] | 0) < imms);
                break;
            case 11: // sltiu
                tmp = imm & 0x7fff;
                if (imm & 0x8000) {
                    // [max_unsigned-32767, max_unsigned]
                    r[rt] = (r[rs] < (tmp + 0xffff0000));
                } else {
                    // [0, 32767]
                    r[rt] = (r[rs] < tmp);
                }
                break;
            case 12: // andi rt, rs, imm
                r[rt] = r[rs] & imm;
                break;
            case 13: // ori rt, rs, imm
                r[rt] = r[rs] | imm;
                break;
            case 14: // xori rt, rs, imm
                r[rt] = r[rs] ^ imm;
                break;
            case 15: // lui rt, imm
                r[rt] = imm << 16;
                break;
            case 32: // lb rt, offset(rs) sign extended
                tmp = mem.getByte(r[rs] + imms);
                if (tmp < 128) {
                    r[rt] = tmp;
                } else {
                    r[rt] = tmp | 0xffffff00;
                }
                break;
            case 33: // lh rt, offset(rs) sign extended
                tmp = r[rs] + imms; // effective address
                if (tmp & 0x01) {
                    exception |= EXCEPTION_CODE.DATA_ALIGN;
                } else {
                    tmp = mem.getHalfword(tmp);
                    if (tmp < 32768) {
                        r[rt] = tmp;
                    } else {
                        r[rt] = tmp | 0xffff0000;
                    }
                }
                break;
            case 35: // lw
                tmp = r[rs] + imms; // effective address
                if (tmp & 0x03) {
                    exception |= EXCEPTION_CODE.DATA_ALIGN;
                } else {
                    r[rt] = mem.getWord(tmp);
                }
                break;
            case 36: // lbu rt, offset(rs)
                r[rt] = mem.getByte(r[rt] + imms);
                break;
            case 37: // lhu rt, offset(rs)
                tmp = r[rs] + imms; // effective address
                if (tmp & 0x01) {
                    exception |= EXCEPTION_CODE.DATA_ALIGN;
                } else {
                    r[rt] = mem.getHalfword(tmp);
                }
                break;
            case 40: // sb rt, offset(rs)
                mem.setByte(r[rs] + imms, r[rt] & 0xff);
                break;
            case 41: // sh rt, offset(rs)
                tmp = r[rs] + imms;
                if (tmp & 0x01) {
                    exception |= EXCEPTION_CODE.DATA_ALIGN;
                } else {
                    mem.setHalfword(tmp, r[rt] & 0xffff);
                }
                break;
            case 43: // sw rt, offset(rs)
                tmp = r[rs] + imms;
                if (tmp & 0x03) {
                    exception |= EXCEPTION_CODE.DATA_ALIGN;
                } else {
                    mem.setWord(tmp, r[rt]);
                }
                break;
            case 63: // simulator special
                switch (func) {
                    case 0: // print register
                        this.eventBus.post('print', 'r' + rs, 'r', r[rs]);
                        break;
                    case 1: // print memory
                        this.eventBus.post('print', '0x' + Lib.padLeft(r[rs].toString(16), '0', 8), 'm', mem.getByte(r[rs]))
                        break;
                    case 2: // print string
                        tmp = r[rs];
                        let str = '', curChar;
                        while ((curChar = mem.getByte(tmp)) != 0) {
                            str += String.fromCharCode(curChar);
                            tmp++;
                        }
                        this.eventBus.post('print', '0x' + Lib.padLeft(r[rs].toString(16), '0', 8), 's', str);
                        break;
                    default:
                }
                break;
            default:
                exception |= EXCEPTION_CODE.INVALID_INST;
        }

        // exec pending branch
        if (this.branchTarget) {
            this.pc = this.branchTarget;
            this.branchTarget = undefined;
            return exception;
        }

        if (nextPC < 0) nextPC += 0x100000000;
        if (nextPC & 0x3) {
            exception |= EXCEPTION_CODE.PC_ALIGN;
            nextPC += 4 - (nextPC & 0x3);
        }

        // exec instruction in delay slot in the next step
        // but save target PC here
        if (hasDelaySlot) {
            if (this.branchTarget) {
                exception |= EXCEPTION_CODE.BRANCH_IN_DELAY_SLOT;
            }
            this.branchTarget = nextPC;
        }


        this.pc += 4;
        if (this.pc > 0xffffffff) this.pc -= 0x100000000;
        if (this.pc > MAX_PC) {
            this.pc = MAX_PC;
            exception |= EXCEPTION_CODE.PC_LIMIT;
        }

        return exception;
    }
}