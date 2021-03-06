///<reference path="index.ts"/>
///<reference path="CPU.ts"/>
// cycle-accurate simulation
// 5-stage pipeline : IF > ID > EX > MA > WB
// branch is calculated in ID stage
// delay slot is needed
// all stages have 1 cycle delay

    import {CPUInternal} from "./CPU";
import {ALU_OP, BRANCH_COND, EXCEPTION_CODE, MEM_OP, STALL_SET} from "./index";
import {Lib} from "../Lib";

class Pipeline extends CPUInternal {
        if_id;
        id_ex;
        ex_ma;
        ma_wb;
        retiredPC;
        retiredInst;
        debugInfo;
        regStatus;
        stalls;

        constructor(mem, callbacks) {
            super(mem, callbacks);
            this.if_id = {pc: 0, inst: 0};
            this.id_ex = {
                // hardware
                aluOp: ALU_OP.NOP,		// alu function select
                memOp: 0,		// memory operation 0=nop
                //					1=rByte 2=rHalfword 3=rWord
                //					4=wByte 5=wHalfword 6=wWord
                memLdSgn: false,	// memory load sign extension flag
                memSrc: 32,	// memory write source, 0~31=r0~r32, 32=imm
                memVal: 0,		// value to be written to memory
                oprA: 0,		// alu input a
                oprB: 0,		// alu input b
                oprASrc: 0,
                oprBSrc: 33,
                ovEn: false,	// set to true to enable overflow handling
                regDst: -1,		// destination register address in WB stage, -1=nop
                regSrc: 0,		// writeback value source, 0=alu, 1=mem
                sa: 0,			// shift amount
                // debug
                rs: 0,
                rt: 0,
                rd: 0,
                imm: 0,
                pc: 0,
                inst: 0
            };
            this.ex_ma = {
                // hardware
                aluOut: 0,		// alu output, can be memory addr
                memOp: 0,
                memLdSgn: false,
                memSrc: 32,
                memVal: 0,
                regDst: -1,
                regSrc: 0,
                // debug
                pc: 0,
                inst: 0
            };
            this.ma_wb = {
                // hardware
                regVal: 0,		// writeback value
                regDst: -1,
                // debug
                pc: 0,
                inst: 0
            };
            this.retiredPC = 0;
            this.retiredInst = 0;
            this.debugInfo = {
                stallFlag: 0,
                bCond: -1,
                bCondAVal: 0,
                bCondBVal: 0,
                bCondASrc: 0,
                bCondBSrc: 0,
                bCondAFwd: undefined,
                bCondBFwd: undefined,
                bBaseSrc: 0,
                bBaseFwd: undefined,
                bTarget: 0,
                bTaken: false,
                memWSrc: undefined,
                memWVal: 0,
                memWFwd: undefined,
                aluOp: ALU_OP.NOP,
                aluA: 0,
                aluB: 0,
                aluASrc: 0,
                aluBSrc: 0,
                aluAFwd: undefined,
                aluBFwd: undefined,
                memVal: 0,
                memOp: MEM_OP.NOP,
                memAddr: 0,
                regVal: 0,
                regOp: false,
                regDst: -1,
                regSrc: 0
            };
            // register writeback status table
            // bit 0 : pending writeback
            // bit 1 : value ready
            this.regStatus = [];
            for (let i = 0; i < 32; i++) {
                this.regStatus[i] = 0;
            }

        }


        _aReset() {
            //this.constructor(this.mem,this.mode,this.callbacks);
            this.cycle = 0;
            this.stalls = 0;
            this.pc = 0x00040000;
            this.branchTarget = undefined;
            this.registerFile[28] = 0x10008000; // $gp
            this.registerFile[29] = 0x7ffffffc; // $sp
        }

        _aStep() {
            let self = this;
            let mem = self.mem;
            let r = self.registerFile;
            let curPC = self.pc;
            let num;
            let tmp;
            let uint32tmp = new Uint32Array(2);

            // pipeline shortname
            var if_id = self.if_id;
            var id_ex = self.id_ex;
            var ex_ma = self.ex_ma;
            var ma_wb = self.ma_wb;
            var debugInfo = self.debugInfo;

            // fowarding related values
            let writtenRegisterValue;
            let loadedMemoryContent;
            let updatedALUResult;
            var valueToWrite;
            var aluA;
            var aluB;
            var curMemOpEXMA = ex_ma.memOp;
            var curRegDstEXMA = ex_ma.regDst;
            var curRegSrcEXMA = ex_ma.regSrc;
            var curAluOutEXMA = ex_ma.aluOut;
            var curRegDstMAWB = ma_wb.regDst;
// saved writeback target
            var curRegValMAWB = ma_wb.regVal;
            // saved writeback value

            // instruction decode
            // oprand source : 0~31 registers, 32 mem, 33 imm
            var curInstIFID, opCode, funcCode, rs, rt, rd, imm, imms, sa,
                newMemLdSgn = false,
                newMemSrc = 0,
                newMemOp = 0,
                newMemVal = 0,
                newAluOp = ALU_OP.NOP,
                newOprA = 0,
                newOprB = 0,
                newOprASrc,
                newOprBSrc,
                newOvEn = false,
                newRegSrc = 0,
                newRegDst = -1,
                cmpSigned = false,
                saInReg = false;

            // branch & exception
            var prepareBranch = false;
            var confirmBranch: number | boolean = false;
            var branchTarget;
            var branchTargetBase;
            var branchTargetOffset = 0;
            var branchTargetSrc = 0;
            // 0~31 registers, 32 pc, 33 pc & 0xf0000000
            var branchCond = 0;
            // 0:unconditional, 1:<, 2:>, 3:<=, 4:>=, 5:=, 6:!=
            var branchCondValA;
            var branchCondValB;
            var branchCondSrcA = 0;
            var branchCondSrcB = 0;
            var stopPCUpdate = false;
            var insertNOP = false;


            var exception = 0;

            debugInfo.stallFlag = 0;

            // ---------------
            // update WB stage
            // ---------------
            if (ma_wb.regDst >= 0) {
                // do things when no branch taken
                // r0 is always 0
                writtenRegisterValue = (ma_wb.regDst != 0) ? ma_wb.regVal : 0;
                r[ma_wb.regDst] = writtenRegisterValue;
                // debug info
                debugInfo.regOp = true;
                debugInfo.regDst = ma_wb.regDst;
                debugInfo.regVal = writtenRegisterValue;
            } else {
                debugInfo.regOp = false;
            }
            self.retiredPC = ma_wb.pc;
            self.retiredInst = ma_wb.inst;

            // ---------------
            // update MA stage
            // ---------------
            // forwarding mux
            // add $r1, $r1, $r1	IF ID EX MA S[WB]
            // sw $r1, 0($r2)		   IF ID EX S[MA] WB
            //
            // ma_wb not modified here, still valid
            if (ma_wb.regDst == ex_ma.memSrc) {
                valueToWrite = (ma_wb.regDst == 0) ? 0 : ma_wb.regVal;
            } else {
                // alway reg --> mem, so memVal cannot come from aluOut
                valueToWrite = ex_ma.memVal;
            }
            // update stage
            // do things when no branch taken
            switch (ex_ma.memOp) {
                case 1: // read byte
                    loadedMemoryContent = mem.getByte(ex_ma.aluOut);
                    if (ex_ma.memLdSgn && loadedMemoryContent > 127) {
                        loadedMemoryContent |= 0xffffff00;
                    }
                    break;
                case 2: // read halfword
                    loadedMemoryContent = mem.getHalfword(ex_ma.aluOut);
                    if (ex_ma.memLdSgn && loadedMemoryContent > 32767) {
                        loadedMemoryContent |= 0xffff0000;
                    }
                    break;
                case 3: // read word
                    loadedMemoryContent = mem.getWord(ex_ma.aluOut);
                    break;
                case 4: // write byte
                    mem.setByte(ex_ma.aluOut, valueToWrite);
                    break;
                case 5: // write halfword
                    mem.setHalfword(ex_ma.aluOut, valueToWrite);
                    break;
                case 6: // write word
                    mem.setWord(ex_ma.aluOut, valueToWrite);
                    break;
                default:
                // do nothing
            }
            // pass register value
            if (ex_ma.regSrc) {
                ma_wb.regVal = loadedMemoryContent;
            } else {
                ma_wb.regVal = ex_ma.aluOut;
            }
            ma_wb.regDst = ex_ma.regDst;
            ma_wb.pc = ex_ma.pc;
            ma_wb.inst = ex_ma.inst;
            // debug info
            debugInfo.memVal = valueToWrite;
            debugInfo.memOp = ex_ma.memOp;
            debugInfo.memSrc = ex_ma.memSrc;
            debugInfo.memAddr = ex_ma.aluOut;
            debugInfo.regSrc = ex_ma.regSrc;

            // ---------------
            // update EX stage
            // ---------------
            // forwarding mux
            //
            // situation I aluOut --> ALUOpr
            // add $r1, $r2, $r0   IF ID EX S[MA] WB
            // add $r3, $r1, $r0      IF ID S[EX] MA WB
            //
            // add $r1, $r1, $r1	IF ID EX S[MA] WB
            // sw $r3, 0($r1)		   IF ID S[EX] MA WB
            //
            // situation II regVal --> ALUOpr (possible RAW hazard here)
            // lw $r1, 0($r2)      IF ID EX MA S[WB]
            // nop                    IF ID EX   MA  WB
            // add $r2, $r1, $r0         IF ID S[EX] MA WB
            //
            // ma_wb modified, use copied old value
            // ex_ma not modified here, still valid
            if (id_ex.oprASrc == ex_ma.regDst &&
                ex_ma.regSrc == 0) {
                aluA = (ex_ma.regDst == 0) ? 0 : ex_ma.aluOut;
                debugInfo.aluAFwd = 'EX_MA';
            } else if (id_ex.oprASrc == curRegDstMAWB) {
                aluA = writtenRegisterValue;
                debugInfo.aluAFwd = 'MA_WB';
            } else {
                aluA = id_ex.oprA;
                debugInfo.aluAFwd = undefined;
            }
            if (id_ex.oprBSrc == ex_ma.regDst &&
                ex_ma.regSrc == 0) {
                aluB = (ex_ma.regDst == 0) ? 0 : ex_ma.aluOut;
                debugInfo.aluBFwd = 'EX_MA';
            } else if (id_ex.oprBSrc == curRegDstMAWB) {
                aluB = writtenRegisterValue;
                debugInfo.aluBFwd = 'MA_WB';
            } else {
                aluB = id_ex.oprB;
                debugInfo.aluBFwd = undefined;
            }
            // update stage
            switch (id_ex.aluOp) {
                // in simulator, aluA and aluB are unsigned number
                // conversion is done in ID stage
                // aluA - reg
                // aluB - reg, imm, sa
                case ALU_OP.ADD: // add
                    tmp = ((aluA & 0x80000000) ? 0x100000000 + aluA : aluA) +
                        ((aluB & 0x80000000) ? 0x100000000 + aluB : aluB);
                    break;
                case ALU_OP.SUB: // sub
                    tmp = ((aluA & 0x80000000) ? 0x100000000 + aluA : aluA) -
                        ((aluB & 0x80000000) ? 0x100000000 + aluB : aluB);
                    break;
                case ALU_OP.AND: // and
                    tmp = aluA & aluB;
                    break;
                case ALU_OP.OR: // or
                    tmp = aluA | aluB;
                    break;
                case ALU_OP.XOR: // xor
                    tmp = aluA ^ aluB;
                    break;
                case ALU_OP.NOR: // nor
                    tmp = ~(aluA | aluB);
                    break;
                case ALU_OP.SLL: // sll
                    tmp = aluA << (aluB & 0x1f);
                    break;
                case ALU_OP.SRL: // srl
                    tmp = aluA >>> (aluB & 0x1f);
                    break;
                case ALU_OP.SRA: // sra
                    tmp = aluA >> (aluB & 0x1f);
                    break;
                case ALU_OP.SLT: // less than cmp signed
                    tmp = ((aluA | 0) < (aluB | 0));
                    break;
                case ALU_OP.SLTU: // less than cmp unsigned
                    tmp = (aluA < aluB);
                    break;
                case ALU_OP.NOP:
                default: // pass through
                    tmp = aluA;
            }
            if (id_ex.ovEn && (tmp / 2 >>> 31) ^ (tmp >>> 31)) {
                exception |= EXCEPTION_CODE.INT_OVERFLOW;
                // writeback is not performed when exception happend
                ex_ma.regDst = -1;
            } else {
                uint32tmp[0] = tmp;
                ex_ma.aluOut = uint32tmp[0];
                ex_ma.regDst = id_ex.regDst;
            }
            ex_ma.memVal = id_ex.memVal;
            ex_ma.memLdSgn = id_ex.memLdSgn;
            ex_ma.memSrc = id_ex.memSrc;
            ex_ma.memOp = id_ex.memOp;
            ex_ma.regSrc = id_ex.regSrc;
            ex_ma.pc = id_ex.pc;
            ex_ma.inst = id_ex.inst;
            // debug info
            debugInfo.aluA = aluA;
            debugInfo.aluB = aluB;
            debugInfo.aluASrc = id_ex.oprASrc;
            debugInfo.aluBSrc = id_ex.oprBSrc;
            debugInfo.aluOp = id_ex.aluOp;

            // ---------------
            // update ID stage
            // ---------------
            r[0] = 0; // r0 is always 0
            // raw decode
            curInstIFID = if_id.inst;
            opCode = (curInstIFID & 0xfc000000) >>> 26;
            funcCode = curInstIFID & 0x3f;
            rs = (curInstIFID & 0x03e00000) >>> 21;
            rt = (curInstIFID & 0x001f0000) >>> 16;
            rd = (curInstIFID & 0x0000f800) >>> 11;
            sa = (curInstIFID & 0x000007c0) >>> 6;
            imm = curInstIFID & 0xffff;
            imms = (imm & 0x8000) ? (imm | 0xffff0000) : imm;
            switch (opCode) {
                case 0:
                    switch (funcCode) {
                        case 0: // sll rd, rt, sa
                            newAluOp = ALU_OP.SLL;
                            newOprASrc = rt;
                            newOprBSrc = 33;
                            newRegDst = rd;
                            imm = sa; // override imm with sa
                            break;
                        case 2: // srl rd, rt, sa
                            newAluOp = ALU_OP.SRL;
                            newOprASrc = rt;
                            newOprBSrc = 33;
                            newRegDst = rd;
                            imm = sa; // override imm with sa
                            break;
                        case 3: // sra rd, rt, sa
                            newAluOp = ALU_OP.SRA;
                            newOprASrc = rt;
                            newOprBSrc = 33;
                            newRegDst = rd;
                            imm = sa; // override imm with sa
                            break;
                        case 4: // sllv rd, rt, rs
                            newAluOp = ALU_OP.SLL;
                            newOprASrc = rt;
                            newOprBSrc = rs;
                            newRegDst = rd;
                            saInReg = true;
                            break;
                        case 6: // srlv rd, rt, rs
                            newAluOp = ALU_OP.SRL;
                            newOprASrc = rt;
                            newOprBSrc = rs;
                            newRegDst = rd;
                            saInReg = true;
                            break;
                        case 7: // srav rd, rt, rs
                            newAluOp = ALU_OP.SRA;
                            newOprASrc = rt;
                            newOprBSrc = rs;
                            newRegDst = rd;
                            saInReg = true;
                            break;
                        case 8: // jr rs
                            prepareBranch = true;
                            branchTargetSrc = rs;
                            break;
                        case 13: // mips_break;
                            // @TODO Break, current nop
                            exception |= EXCEPTION_CODE.BREAK;
                            break;
                        //case 16: // mfhi
                        //case 17: // mthi
                        //case 18: // mflo
                        //case 19: // mtlo
                        //case 24: // mult
                        //case 25: // multu
                        //case 26: // div
                        //case 27: // divu
                        case 32: // add rd, rs, rt with overflow check
                            newAluOp = ALU_OP.ADD;
                            newOprASrc = rs;
                            newOprBSrc = rt;
                            newRegDst = rd;
                            newOvEn = true;
                            break;
                        case 33: // addu rd, rs, rt
                            newAluOp = ALU_OP.ADD;
                            newOprASrc = rs;
                            newOprBSrc = rt;
                            newRegDst = rd;
                            break;
                        case 34: // sub rd, rs, rt with overflow check
                            newAluOp = ALU_OP.SUB;
                            newOprASrc = rs;
                            newOprBSrc = rt;
                            newRegDst = rd;
                            newOvEn = true;
                            break;
                        case 35: // subu rd, rs, rt
                            newAluOp = ALU_OP.SUB;
                            newOprASrc = rs;
                            newOprBSrc = rt;
                            newRegDst = rd;
                            break;
                        case 36: // and rd, rs, rt
                            newAluOp = ALU_OP.AND;
                            newOprASrc = rs;
                            newOprBSrc = rt;
                            newRegDst = rd;
                            break;
                        case 37: // or rd, rs, rt
                            newAluOp = ALU_OP.OR;
                            newOprASrc = rs;
                            newOprBSrc = rt;
                            newRegDst = rd;
                            break;
                        case 38: // xor rd, rs, rt
                            newAluOp = ALU_OP.XOR;
                            newOprASrc = rs;
                            newOprBSrc = rt;
                            newRegDst = rd;
                            break;
                        case 39: // nor rd, rs, rt
                            newAluOp = ALU_OP.NOR;
                            newOprASrc = rs;
                            newOprBSrc = rt;
                            newRegDst = rd;
                            break;
                        case 42: // slt rd, rs, rt
                            newAluOp = ALU_OP.SLT;
                            newOprASrc = rs;
                            newOprBSrc = rt;
                            newRegDst = rd;
                            break;
                        case 43: // sltu rd, rs, rt
                            newAluOp = ALU_OP.SLTU;
                            newOprASrc = rs;
                            newOprBSrc = rt;
                            newRegDst = rd;
                            break;
                        default:
                            exception |= EXCEPTION_CODE.INVALID_INST;
                    }
                    break;
                case 1:
                    switch (rt) {
                        case 0: // bltz rs, offset
                            prepareBranch = true;
                            branchTargetOffset = imms << 2;
                            branchCondSrcA = rs;
                            branchCond = BRANCH_COND.LTZ;
                            break;
                        case 1: // bgez rs, offset
                            prepareBranch = true;
                            branchTargetOffset = imms << 2;
                            branchCondSrcA = rs;
                            branchCond = BRANCH_COND.GTEZ;
                            break;
                        default:
                            exception |= EXCEPTION_CODE.INVALID_INST;
                    }
                    break;
                case 2: // J imm
                    prepareBranch = true;
                    imm = (curInstIFID & 0x03ffffff) << 2;
                    if (imm < 0) imm = imm + 4294967296;
                    branchTargetOffset = imm;
                    branchTargetSrc = 33; // pc
                    break;
                case 4: // beq rs, rt, offset
                    prepareBranch = true;
                    branchTargetSrc = 32;
                    branchTargetOffset = imms << 2;
                    branchCond = BRANCH_COND.EQ;
                    branchCondSrcA = rs;
                    branchCondSrcB = rt;
                    break;
                case 5: // bne rs, rt, offset
                    prepareBranch = true;
                    branchTargetSrc = 32;
                    branchTargetOffset = imms << 2;
                    branchCond = BRANCH_COND.NEQ;
                    branchCondSrcA = rs;
                    branchCondSrcB = rt;
                    break;
                case 6: // blez rs, offset
                    prepareBranch = true;
                    branchTargetSrc = 32;
                    branchTargetOffset = imms << 2;
                    branchCond = BRANCH_COND.LTEZ;
                    branchCondSrcA = rs;
                    branchCondSrcB = 0;
                    break;
                case 7: // bgtz rs, offset
                    prepareBranch = true;
                    branchTargetSrc = 32;
                    branchTargetOffset = imms << 2;
                    branchCond = BRANCH_COND.GTEZ;
                    branchCondSrcA = rs;
                    branchCondSrcB = 0;
                    break;
                case 8: // addi rt, rs, imm with overflow check
                    newAluOp = ALU_OP.ADD;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    newRegDst = rt;
                    newOvEn = true;
                    // extend sign
                    if (imm & 0x8000) {
                        imm += 0xffff0000;
                    }
                    break;
                case 9: // addiu rt, rs, imm
                    newAluOp = ALU_OP.ADD;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    newRegDst = rt;
                    // extend sign
                    if (imm & 0x8000) {
                        imm += 0xffff0000;
                    }
                    break;
                case 10: // slti rt, rs, imm
                    newAluOp = ALU_OP.SLT;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    newRegDst = rt;
                    // extend sign
                    if (imm & 0x8000) {
                        imm += 0xffff0000;
                    }
                    break;
                case 11: // sltiu
                    newAluOp = ALU_OP.SLTU;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    newRegDst = rt;
                    // extend sign
                    if (imm & 0x8000) {
                        imm += 0xffff0000;
                    }
                    break;
                case 12: // andi rt, rs, imm
                    newAluOp = ALU_OP.AND;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    newRegDst = rt;
                    break;
                case 13: // ori rt, rs, imm
                    newAluOp = ALU_OP.OR;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    newRegDst = rt;
                    break;
                case 14: // xori rt, rs, imm
                    newAluOp = ALU_OP.XOR;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    newRegDst = rt;
                    break;
                case 15: // lui rt, imm
                    newAluOp = ALU_OP.ADD;
                    newOprASrc = 0;
                    newOprBSrc = 33;
                    newRegDst = rt;
                    imm <<= 16;
                    break;
                case 32: // lb rt, offset(rs) sign extended
                    newAluOp = ALU_OP.ADD;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    // extend sign
                    if (imm & 0x8000) {
                        imm += 0xffff0000;
                    }
                    newRegDst = rt;
                    newMemOp = MEM_OP.RB;
                    newRegSrc = 1;
                    newMemLdSgn = true;
                    break;
                case 33: // lh rt, offset(rs) sign extended
                    newAluOp = ALU_OP.ADD;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    // extend sign
                    if (imm & 0x8000) {
                        imm += 0xffff0000;
                    }
                    newRegDst = rt;
                    newMemOp = MEM_OP.RHW;
                    newRegSrc = 1;
                    newMemLdSgn = true;
                    break;
                case 35: // lw
                    newAluOp = ALU_OP.ADD;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    // extend sign
                    if (imm & 0x8000) {
                        imm += 0xffff0000;
                    }
                    newRegDst = rt;
                    newMemOp = MEM_OP.RW;
                    newRegSrc = 1;
                    newMemLdSgn = true;
                    break;
                case 36: // lbu rt, offset(rs)
                    newAluOp = ALU_OP.ADD;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    // extend sign
                    if (imm & 0x8000) {
                        imm += 0xffff0000;
                    }
                    newRegDst = rt;
                    newMemOp = MEM_OP.RB;
                    newRegSrc = 1;
                    break;
                case 37: // lhu rt, offset(rs)
                    newAluOp = ALU_OP.ADD;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    // extend sign
                    if (imm & 0x8000) {
                        imm += 0xffff0000;
                    }
                    newRegDst = rt;
                    newMemOp = MEM_OP.RHW;
                    newRegSrc = 1;
                    break;
                case 40: // sb rt, offset(rs)
                    newAluOp = ALU_OP.ADD;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    // extend sign
                    if (imm & 0x8000) {
                        imm += 0xffff0000;
                    }
                    newMemSrc = rt;
                    newMemOp = MEM_OP.WB;
                    break;
                case 41: // sh rt, offset(rs)
                    newAluOp = ALU_OP.ADD;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    // extend sign
                    if (imm & 0x8000) {
                        imm += 0xffff0000;
                    }
                    newMemSrc = rt;
                    newMemOp = MEM_OP.WHW;
                    break;
                case 43: // sw rt, offset(rs)
                    newAluOp = ALU_OP.ADD;
                    newOprASrc = rs;
                    newOprBSrc = 33;
                    // extend sign
                    if (imm & 0x8000) {
                        imm += 0xffff0000;
                    }
                    newMemSrc = rt;
                    newMemOp = MEM_OP.WW;
                    break;
                case 63: // simulator special
                    switch (funcCode) {
                        case 0: // print register
                            this.eventBus.post('print', 'r' + rs, 'r', r[rs]);
                            break;
                        case 1: // print memory
                            this.eventBus.post('print', '0x' + Lib.padLeft(r[rs].toString(16), '0', 8), 'm', mem.getByte(r[rs]))
                            break;
                        case 2: // print string
                            tmp = r[rs];
                            var str = '', curChar;
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

            // forwarding mux
            //
            // situation I         aluOut --> memVal
            // add $r1, $r0, $r2   IF ID EX S[MA] WB
            // ...
            // sw  $r1, 0($r2)           IF S[ID] EX MA WB
            //
            // situation II      regVal --> memVal
            // ld $r1, 0($r2)    IF ID EX MA S[WB]
            // ...
            // sw $r1, 0($r1)             IF S[ID] EX MA WB
            //
            // situation III        aluOut --> branchCondValA
            // add $r1, $r0, $r2    IF ID EX S[MA] WB
            // ...
            // bne $r1, $r2, label        IF S[ID] EX MA WB
            //
            // situation IV         regVal --> branchCondValA
            // ld $r1, 0($r2)       IF ID EX MA S[WB]
            // ...
            // bne $r1, $r2, label           IF S[ID] EX MA WB
            if (newMemOp > 3) {
                // write memory & source register match
                if (curRegDstMAWB == newMemSrc) {
                    newMemVal = curRegValMAWB;
                    debugInfo.memWFwd = 'MA_WB';
                } else if (curRegDstEXMA == newMemSrc && curRegSrcEXMA == 0) {
                    newMemVal = (curRegDstEXMA == 0) ? 0 : curAluOutEXMA;
                    debugInfo.memWFwd = 'EX_MA';
                } else {
                    newMemVal = r[newMemSrc];
                    debugInfo.memWFwd = undefined;
                }
                debugInfo.memWSrc = newMemSrc;
                debugInfo.memWVal = newMemVal;
            } else {
                debugInfo.memWSrc = undefined;
            }

            if (prepareBranch) {
                if (branchCondSrcA == curRegDstMAWB) {
                    branchCondValA = curRegValMAWB;
                    debugInfo.bCondAFwd = 'MA_WB';
                } else if (branchCondSrcA == curRegDstEXMA && curRegSrcEXMA == 0) {
                    branchCondValA = (curRegDstEXMA == 0) ? 0 : curAluOutEXMA;
                    debugInfo.bCondAFwd = 'EX_MA';
                } else {
                    branchCondValA = r[branchCondSrcA];
                    debugInfo.bCondAFwd = undefined;
                }
                if (branchCondSrcB == curRegDstMAWB) {
                    branchCondValB = curRegValMAWB;
                    debugInfo.bCondBFwd = 'MA_WB';
                } else if (branchCondSrcB == curRegDstEXMA && curRegSrcEXMA == 0) {
                    branchCondValB = (curRegDstEXMA == 0) ? 0 : curAluOutEXMA;
                    debugInfo.bCondBFwd = 'EX_MA';
                } else {
                    branchCondValB = r[branchCondSrcB];
                    debugInfo.bCondAFwd = undefined;
                }
                if (branchTargetSrc == curRegDstMAWB) {
                    branchTargetBase = curRegValMAWB;
                    debugInfo.bBaseFwd = 'MA_WB';
                } else if (branchTargetBase == curRegDstEXMA && curRegSrcEXMA == 0) {
                    branchTargetBase = (curRegDstEXMA == 0) ? 0 : curAluOutEXMA;
                    debugInfo.bBaseFwd = 'EX_MA';
                } else {
                    if (branchTargetSrc < 32) {
                        branchTargetBase = r[branchTargetSrc];
                    } else if (branchTargetSrc == 32) {
                        branchTargetBase = if_id.pc;
                    } else {
                        branchTargetBase = if_id.pc & 0xf0000000;
                    }
                    debugInfo.bBaseFwd = undefined;
                }
            }
            // branch calculation
            if (prepareBranch) {
                // confirm branch
                switch (branchCond) {
                    case BRANCH_COND.LTZ:
                        confirmBranch = (branchCondValA & 0x80000000);
                        break;
                    case BRANCH_COND.GTZ:
                        confirmBranch = (branchCondValA > 0 && branchCondValA < 0x80000000);
                        break;
                    case BRANCH_COND.LTEZ:
                        confirmBranch = (branchCondValA & 0x80000000) || (branchCondValA == 0);
                        break;
                    case BRANCH_COND.GTEZ:
                        confirmBranch = (branchCondValA < 0x80000000);
                        break;
                    case BRANCH_COND.EQ:
                        confirmBranch = (branchCondValA == branchCondValB);
                        break;
                    case BRANCH_COND.NEQ:
                        confirmBranch = (branchCondValA != branchCondValB);
                        break;
                    case BRANCH_COND.N:
                    default: // do nothing
                        confirmBranch = true;
                }
                // branch confirmed
                // calc target pc
                if (confirmBranch) {
                    branchTarget = branchTargetOffset + branchTargetBase;
                    // check alignment
                    // will not branch if exception occurred
                    if (branchTarget & 0x03) {
                        exception |= EXCEPTION_CODE.PC_ALIGN;
                        confirmBranch = false;
                    }
                }
            }
            debugInfo.bBaseSrc = branchTargetSrc;
            debugInfo.bCond = prepareBranch ? branchCond : -1;
            debugInfo.bCondAVal = branchCondValA;
            debugInfo.bCondBVal = branchCondValB;
            debugInfo.bCondASrc = branchCondSrcA;
            debugInfo.bCondBSrc = branchCondSrcB;
            debugInfo.bTarget = branchTargetOffset + branchTargetBase;
            debugInfo.bTaken = false;
            // hazard detection
            // global stall on decode stage
            // new instruction will not be fired when hazard detected
            //
            // RAW
            // situation I   1 bubble
            // lw  $r1, 0($r2)      IF ID EX MA [WB]
            // add $r1, $r0, $r1       IF ID ID [EX] MA WB
            //
            // situation II  2 bubble
            // lw  $r1, 0($r2)      IF ID EX MA [WB]
            // bne $r1, $r3, label     IF ID ID [ID] EX MA WB
            //
            // lw  $r1, 0($r2)      IF ID EX MA [WB]
            // sw  $r2, 0($r1)         IF ID ID [ID] EX MA WB
            //
            // lw  $r1, 0($r4)      IF ID EX MA [WB]
            // nop                     IF ID EX  MA WB
            // bne $r1, $r3, label        IF ID [ID] EX MA WB
            //
            // situation III 1 bubble
            // add $r1, $r2, $r3    IF ID EX [MA] WB
            // bne $r1, $r2, label     IF ID [ID] EX MA WB
            //
            // add $r1, $r2, $r3    IF ID EX [MA] WB
            // sw  $r1, 0($r1)         IF ID [ID] EX MA WB
            //
            // id_ex not updated, still valid


            if (id_ex.regDst != 0) {
                // if previous instruction performs memory load
                if (id_ex.memOp > 0 && id_ex.memOp < 4) {
                    // arithmetic depend on memory load
                    // sI
                    if (newOprASrc == id_ex.regDst ||
                        newOprBSrc == id_ex.regDst) {
                        stopPCUpdate = true;
                    }
                }
                // memVal depend
                // sII2, sIII2
                if (newMemOp > 3 &&
                    newMemSrc == id_ex.regDst) {
                    stopPCUpdate = true;
                }
                // branch depend on memory load, sII1
                // or arithmetic result, sIII1
                if (prepareBranch) {
                    if (branchCondSrcA == id_ex.regDst ||
                        branchCondSrcB == id_ex.regDst ||
                        branchTargetSrc == id_ex.regDst) {

                        confirmBranch = false;
                        stopPCUpdate = true;
                    }
                }
            } else if (curMemOpEXMA > 0 && curMemOpEXMA < 4 && curRegDstEXMA != 0) {
                // if pre-previous instruction performs memory load
                if (prepareBranch) {
                    if (branchCondSrcA == curRegDstEXMA ||
                        branchCondSrcB == curRegDstEXMA ||
                        branchTargetSrc == curRegDstEXMA) {
                        // branch depend on memory load, sII3
                        confirmBranch = false;
                        stopPCUpdate = true;
                    }
                }
                if (newMemOp > 3 &&
                    newMemSrc == curRegDstEXMA) {
                    stopPCUpdate = true;
                }
            }
            // write pipeline registers
            if (stopPCUpdate) {
                debugInfo.stallFlag |= STALL_SET.ID;
                // write nop
                id_ex.aluOp = ALU_OP.NOP;
                id_ex.memOp = MEM_OP.NOP;
                id_ex.oprA = 0;
                id_ex.oprB = 0;
                id_ex.oprASrc = 0;
                id_ex.oprBSrc = 0;
                id_ex.regDst = -1;
                id_ex.inst = 0;
                //id_ex.pc = if_id.pc;
                //console.log('Stall!');
            } else {
                newOprA = r[newOprASrc];
                newOprB = (newOprBSrc == 33) ? imm : r[newOprBSrc];
                newOprB = saInReg ? newOprB & 0x1f : newOprB;
                // write new value
                id_ex.aluOp = newAluOp;
                id_ex.memOp = newMemOp;
                id_ex.memLdSgn = newMemLdSgn;
                id_ex.memSrc = newMemSrc;
                id_ex.memVal = newMemVal;
                id_ex.oprA = newOprA;
                id_ex.oprB = newOprB;
                id_ex.oprASrc = newOprASrc;
                id_ex.oprBSrc = newOprBSrc;
                id_ex.ovEn = newOvEn;
                id_ex.regDst = newRegDst;
                id_ex.regSrc = newRegSrc;
                id_ex.sa = newOprB;
                id_ex.rs = rs;
                id_ex.rt = rt;
                id_ex.rd = rd;
                id_ex.imm = imm;
                id_ex.pc = if_id.pc;
                id_ex.inst = if_id.inst;
            }
            // ---------------
            // update IF stage
            // ---------------
            if (mem.busy) {
                // insert nop
                if_id.inst = 0;
                stopPCUpdate = true;
                debugInfo.stallFlag |= STALL_SET.IF;
            } else if (!stopPCUpdate) {
                if_id.inst = mem.getWord(self.pc);
                if_id.pc = self.pc;
            }
            // update pc
            if (confirmBranch) {
                uint32tmp[1] = branchTarget;
                branchTarget = uint32tmp[1];
                self.pc = branchTarget;
                debugInfo.bTaken = true;
            } else if (!stopPCUpdate) {
                self.pc = self.pc + 4;
                if (self.pc > 0xffffffff)
                    self.pc -= 0x100000000;
            } else {
                self.stalls++;
            }
            this.cycle++;

            return exception;

        }
    }



