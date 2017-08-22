
import {Memory} from "./src/Memory";
import {CPU} from "./src/CPU";
import {Assembler} from "./src/Assembler";

function createMIPSSIM() {
    let testcode = `## addEm.asm
# program to add two integers
.data
val0:   .word   0 
val1:   .word   1 
val2:   .word   2 
val3:   .word   3 
val4:   .word   4 
val5:   .word   5 
.text
main:
        la    $t0,val2     
        #  put a 32-bit address into $t0
        lw    $t1,0($t0)   
        #  load value 2
        lw    $t2,4($t0)   
        #  load value 3
        sll   $0,$0,0      
        #  load delay slot
        addu  $t1,$t1,$t2  #  calc. sum

`;
        let mem = new Memory();
        let cpu = new CPU(mem, CPU.SIM_MODE.FUNCTIONAL);
        let exCode = CPU.EXCEPTION_CODE;
        let assembler = new Assembler();
        let tokeny =assembler.assemble(testcode);
        tokeny.textMem.forEach(function (value) {
            console.log(value.toString(16));
        });
        console.log(tokeny)

}
createMIPSSIM();