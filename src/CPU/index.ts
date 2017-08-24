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
    $ZERO=0,
    $AT=1,
    $V0=2,
    $V1=3,
    $A0=4,
    $A1=5,
    $A2=6,
    $A3=7,
    $T0=8,
    $T1=9,
    $T2=10,
    $T3=11,
    $T4=12,
    $T5=13,
    $T6=14,
    $T7=15,
    $S0=16,
    $S1=17,
    $S2=18,
    $S3=19,
    $S4=20,
    $S5=21,
    $S6=22,
    $S7=23,
    $T8=24,
    $T9=25,
    $K0=26,
    $K1=27,
    $GP=28,
    $SP=29,
    $FP=30,
    $RA=31,
    $HI=32,
    $LO=33
}

export {FunctionalCPU} from "./Functional"