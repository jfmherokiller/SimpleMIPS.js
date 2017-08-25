import {Memory} from "../src/Memory";
import {Assembler} from "../src/Assembler";
import {Lib} from "../src/Lib";
import {EXCEPTION_CODE, FunctionalCPU} from "../src/CPU";

function createMIPSSIM() {
    let testcode = `
# hello world program
# support .data and .text
.data
str: .asciiz "hello world!"
byteme: .byte 53
.text
main:
        nop
        jal main
        mtlo $v0
        break
 `;
    let assembler = new Assembler();
    let mem = new Memory();
    let cpu = new FunctionalCPU(mem);
    let exCode = EXCEPTION_CODE;
    registerEvents(cpu);
    //

    let assembleres = assembler.assemble(testcode);
    mem.importAsm(assembleres);
    cpu.reset();
    console.log(assembleres);

    assembleres.textMem.forEach(function (value) {
        console.log(Lib.padLeft(value.toString(16),"0",8))
    });
    Runcpu(cpu,exCode);
    console.log(cpu.dumpRegisterFile());
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

function Runcpu(cpu,excode) {
    for (let i = 0; i < 12500; i++) {
        let exception =cpu.step();
        if(exception === EXCEPTION_CODE.BREAK)
        {
            break;
        }
    }
}

createMIPSSIM();