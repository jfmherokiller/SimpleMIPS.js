import {Memory} from "./src/Memory";
import {CPU} from "./src/CPU";
import {Assembler} from "./src/Assembler";
import {Lib} from "./src/Lib";

function createMIPSSIM() {
    let testcode = `
# hello world program
# support .data and .text
.data
str: .asciiz "hello world!"
.text
main:
        li $v0,4
        mthi $v0
        mtlo $v0
        break
 `;
    let assembler = new Assembler();
    let mem = new Memory();
    let cpu = new CPU.FunctionalCPU(mem);
    let exCode = CPU.EXCEPTION_CODE;
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
        if(exception === CPU.EXCEPTION_CODE.BREAK)
        {
            break;
        }
    }
}

createMIPSSIM();