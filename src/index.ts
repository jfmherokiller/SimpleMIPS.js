import {Memory} from "./Memory";
import {EXCEPTION_CODE, FunctionalCPU} from "./CPU"
import {Assembler, AsssembledCode, AssemblerConfigObject} from "./Assembler";

export function AssembleCode(ASMCode: String,Config?:AssemblerConfigObject): AsssembledCode {
    let _Assembler = new Assembler();
    return _Assembler.assemble(ASMCode,Config);
}

export function SetupBasicFunctionalCpu(Code: AsssembledCode|String): FunctionalCPU {
    let assembler = new Assembler();
    let mem = new Memory();
    let cpu = new FunctionalCPU(mem);
    let exCode = EXCEPTION_CODE;
    if(typeof Code === "string") {
        let assembledCode = assembler.assemble(Code);
        mem.importAsm(assembledCode);
    }else {
        mem.importAsm(Code);
    }
    cpu.reset();
    registerEvents(cpu);
    return cpu;
}

function registerEvents(cpu) {
    cpu.eventBus.register('print', function (src, type, val) {
        switch (type) {
            case 's':
                console.log('[CPU]' + val, 'info');
                break;
            default:
                console.log('[CPU]' + src + ' = 0x' + val.toString(16), 'info');
        }
    });
}