export {CPUInternal} from "./CPU";


export enum STALL_SET {
    PC = 1,
    IF = 2,
    ID = 4,
    EX = 8,
    MA = 16,
    WB = 32
}

export enum EXCEPTION_CODE {
    INVALID_INST = 1,
    INT_OVERFLOW = 2,
    PC_ALIGN = 4,
    DATA_ALIGN = 8,
    BRANCH_IN_DELAY_SLOT = 16,
    BREAK = 32,
    PC_LIMIT = 64
}

const enum STALL_CLEAR {
    PC = ~STALL_SET.PC,
    IF = ~STALL_SET.IF,
    ID = ~STALL_SET.ID,
    EX = ~STALL_SET.EX,
    MA = ~STALL_SET.MA,
    WB = ~STALL_SET.WB
}

export const MAX_PC = 0x10000000; // limit pc range in simulator
export const STALL_FLAGS = STALL_SET;

export enum ALU_OP {
    ADD = 0,
    SUB = 1,
    AND = 2,
    OR = 3,
    XOR = 4,
    NOR = 5,
    SLL = 6,
    SRL = 7,
    SRA = 8,
    SLT = 9,
    SLTU = 10,
    NOP = 11
}


export enum MEM_OP {
    NOP = 0,
    RB = 1,
    RHW = 2,
    RW = 3,
    WB = 4,
    WHW = 5,
    WW = 6
}

export enum BRANCH_COND {
    N = 0,
    LTZ = 1,
    GTZ = 2,
    LTEZ = 3,
    GTEZ = 4,
    EQ = 5,
    NEQ = 6
}

export enum REGISTERS {
    $ZERO = 0,
    $AT = 1,
    $V0 = 2,
    $V1 = 3,
    $A0 = 4,
    $A1 = 5,
    $A2 = 6,
    $A3 = 7,
    $T0 = 8,
    $T1 = 9,
    $T2 = 10,
    $T3 = 11,
    $T4 = 12,
    $T5 = 13,
    $T6 = 14,
    $T7 = 15,
    $S0 = 16,
    $S1 = 17,
    $S2 = 18,
    $S3 = 19,
    $S4 = 20,
    $S5 = 21,
    $S6 = 22,
    $S7 = 23,
    $T8 = 24,
    $T9 = 25,
    $K0 = 26,
    $K1 = 27,
    $GP = 28,
    $SP = 29,
    $FP = 30,
    $RA = 31,
    $HI = 32,
    $LO = 33
}

export enum Opcodes {
    Special = 0,
    bcond = 1,
    jmp = 2,
    jal = 3,
    beq = 4,
    bne = 5,
    blez = 6,
    bgtz = 7,
    addi = 8,
    addiu = 9,
    slti = 10,
    sltiu = 11,
    andi = 12,
    ori = 13,
    xori = 14,
    lui = 15,
    cop0 = 16,
    cop1 = 17,
    cop2 = 18,
    cop3 = 19,
    lb = 32,
    lh = 33,
    lwl = 34,
    lw = 35,
    lbu = 36,
    lhu = 37,
    lwr = 38,
    sb = 40,
    sh = 41,
    swl = 42,
    sw = 43,
    swr = 46,
    lwc0 = 48,
    lwc1 = 49,
    lwc2 = 50,
    lwc3 = 51,
    swc0 = 56,
    swc1 = 57,
    swc2 = 58,
    swc3 = 59,
    SimSpecial = 63
}

export enum Func {
    sll = Opcodes.Special | 0,
    srl = Opcodes.Special | 2,
    sra = Opcodes.Special | 3,
    sllv = Opcodes.Special | 4,
    srlv = Opcodes.Special | 6,
    srav = Opcodes.Special | 7,
    jr = Opcodes.Special | 8,
    jalr = Opcodes.Special | 9,
    syscall = Opcodes.Special | 12,
    mips_break = Opcodes.Special | 13,
    mfhi = Opcodes.Special | 16,
    mthi = Opcodes.Special | 17,
    mflo = Opcodes.Special | 18,
    mtlo = Opcodes.Special | 19,
    mult = Opcodes.Special | 24,
    multu = Opcodes.Special | 25,
    div = Opcodes.Special | 26,
    divu = Opcodes.Special | 27,
    add = Opcodes.Special | 32,
    addu = Opcodes.Special | 33,
    sub = Opcodes.Special | 34,
    subu = Opcodes.Special | 35,
    and = Opcodes.Special | 36,
    or = Opcodes.Special | 37,
    xor = Opcodes.Special | 38,
    nor = Opcodes.Special | 39,
    slt = Opcodes.Special | 42,
    sltu = Opcodes.Special | 43,
    printr = Opcodes.SimSpecial | 0,
    printm = Opcodes.SimSpecial | 1,
    prints = Opcodes.SimSpecial | 2,

}

export {FunctionalCPU} from "./Functional"