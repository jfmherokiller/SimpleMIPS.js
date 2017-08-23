
import {Memory} from "./src/Memory";
import {CPU} from "./src/CPU";
import {Assembler} from "./src/Assembler";
import {writeFileSync} from "fs";

function createMIPSSIM() {
    let testcode = `
## pseudoPoly.asm
## evaluate the polynomial ax2 + bx + c
##
        .text
        .globl  main

main:
        la   $t3,x
        la   $t0,a
        la   $t1,b
        la   $t2,c
        lw   $t3,0($t3)     # get x
        lw   $t0,0($t0)     # get a
        lw   $t1,0($t1)     # get bb
        lw   $t2,0($t2)     # get c

        multu $t3,$t3        # x2
        mflo $t4            # $t4 = x2
        nop
        nop
        multu $t4,$t0        # low  = ax2
        mflo $t4            # $t4  = ax2
        nop
        nop

        multu $t1,$t3        # low  = bx
        mflo $t5            # $t5  = bx
        add $t5,$t4,$t5    # $t5  = ax2 + bx

        add $t5,$t5,$t2    # $t5 = ax2 + bx + c
        print $t5

        .data
x:      .word   4 
a:      .word  20
b:     .word   -2           
c:      .word   5
 
 `;
        let mem = new Memory();
        let cpu = new CPU(mem, CPU.SIM_MODE.FUNCTIONAL);
        let exCode = CPU.EXCEPTION_CODE;
        let assembler = new Assembler();
        let assembleres =assembler.assemble(testcode);
        mem.importAsm(assembleres);
        cpu.reset();
        console.log(assembleres);

    cpu.eventBus.register('print', function (src, type, val) {
        switch (type) {
            case 's':
                console.log('[CPU]' + val, 'info');
                break;
            default:
                console.log('[CPU]' + src + ' = 0x' + val.toString(16), 'info');
        }
    });
        for(let i=0;i<100;i++)
        {
            cpu.step();
        }

        //

}
createMIPSSIM();