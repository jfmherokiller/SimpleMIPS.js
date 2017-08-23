
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
        lw   $t3,0($t3)     # get x
        la   $t0,a
        lw   $t0,0($t0)     # get a
        la   $t1,bb
        lw   $t1,0($t1)     # get bb
        la   $t2,c
        lw   $t2,0($t2)     # get c

        mult $t3,$t3        # x2
        mflo $t4            # $t4 = x2
        nop
        nop
        mult $t4,$t0        # low  = ax2
        mflo $t4            # $t4  = ax2
        nop
        nop

        mult $t1,$t3        # low  = bx
        mflo $t5            # $t5  = bx
        addu $t5,$t4,$t5    # $t5  = ax2 + bx

        addu $t5,$t5,$t2    # $t5 = ax2 + bx + c
        la   $t5,value
        sw   $t5,0($t5)      # value = polynomial

        .data
x:      .word   4 
value:  .word   1 
a:      .word  20
bb:     .word  -2           # the SPIM assembler does not allow the label "b"
c:      .word   5
 
 `;
        let mem = new Memory();
        let cpu = new CPU(mem, CPU.SIM_MODE.FUNCTIONAL);
        let exCode = CPU.EXCEPTION_CODE;
        let assembler = new Assembler();
        let hexstring = "";
        let tokeny =assembler.assemble(testcode);
        tokeny.textMem.forEach(function (value) {
            hexstring += value.toString(16);
        });
        let hexbuffer = Buffer.from(hexstring,'hex');
        writeFileSync('./code.bin',hexbuffer);
        console.log(tokeny)

}
createMIPSSIM();