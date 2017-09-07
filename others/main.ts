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
.text
# main program
main:
# support basic pseudo instruction
# including la, pushr, popr
la $s0, str
add $a0, $r0, $s0
pushr $ra
la $ra, $main_ret
j convert
nop
$main_ret:
# debug print, not true instruction
prints $s0
break
nop

# subroutine
# convert to upper case
# $a0 - address of the string
convert:
    loop:
        # get byte
        lb $t0, 0($a0)
        andi $t0, $t0, 0xff
        beq $t0, $r0, conv_end
        # check range
        sltiu $t1, $t0, 97
        bne $t1, $r0, conv_next
        nop
        addi $t1, $t0, -123
        slti $t1, $t1, 0
        beq $t1, $r0, conv_next
        nop
        # convert
        addi $t0, $t0, -32
        sb $t0, 0($a0)
    conv_next:
        addi $a0, $a0, 1
        j loop
        nop
    conv_end:
        lw $t0, 4($sp)
        jr $ra
        add $ra, $r0, $t0 # delay slot
        nop

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