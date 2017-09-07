
import {Assembler} from '../src/Assembler';
 import 'mocha';
import {assert} from "chai";
import {Lib} from "../src/Lib";

function ReturnTestAsm (asmline)
{
    return `
#testcode
.data
space: .space 23
.text
main:
        la $at,space
        ${asmline}
        `;
}
interface opcodeObject {
    instruction:string;
}


function GenerateTest_Instructions() {
    function range(j, k) {
        const targetLength = (k - j) + 1;
        const a = Array(targetLength);
        const b = Array.apply(null, a);
        return b.map(function (discard, n) {
            return n + j;
        });
    }
    let operations:opcodeObject[] = [];
    let GRP_regAliases = ('$0 $at $v0 $v1 $a0 $a1 $a2 $a3 ' +
        '$t0 $t1 $t2 $t3 $t4 $t5 $t6 $t7 ' +
        '$s0 $s1 $s2 $s3 $s4 $s5 $s6 $s7 ' +
        '$t8 $t9 $k0 $k1 $gp $sp $fp $ra').split(' ');
    GRP_regAliases.forEach(function (register) {
        GRP_regAliases.forEach(function (register2) {
                let memoryaccess_opcodelist:opcodeObject[] = [
                    {instruction:`lb ${register2},0(${register})`},
                    {instruction:`lbu ${register2},0(${register})`},
                    {instruction:`lh ${register2},0(${register})`},
                    {instruction:`lhu ${register2},0(${register})`},
                    {instruction:`lui ${register2},0`},
                    {instruction:`lw ${register2},0(${register})`},
                    {instruction:`sb ${register2},0(${register})`},
                    {instruction:`sh ${register2},0(${register})`},
                    {instruction:`sw ${register2},0(${register})`},
                    {instruction:`mfhi ${register2}`},
                    {instruction:`mflo ${register2}`},
                    {instruction:`mthi ${register2}`},
                    {instruction:`mtlo ${register2}`},
                ];
                operations = operations.concat(memoryaccess_opcodelist);
        });
    });
    return operations;
}

describe("Assembler Tests",function () {
    let assembler = new Assembler();
    describe("Assembler initialization",function () {
        it("should not be a null object",function () {
            assert.isNotNull(assembler);
        });
    });
    describe("Memory Access Opcodes",function () {
        GenerateTest_Instructions().forEach(function (opcode) {
            it('correctly assembles the opcode ' + opcode.instruction, function() {
                let assemblout = assembler.assemble(ReturnTestAsm(opcode.instruction)).textMem[2].toString(16);
                assert.isNotNull(assemblout);
            });
        });
    })
});

