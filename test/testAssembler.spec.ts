import {Assembler} from '../src/Assembler';
import 'mocha';
import {assert} from "chai";
import {Lib} from "../src/Lib";

function ReturnTestAsm(asmline) {
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
    instruction: string;
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

    let operations: opcodeObject[] = [];
    let memoryaccess_opcodelist: opcodeObject[] = [
        {instruction: `lb $at,0($at)`},
        {instruction: `lbu $at,0($at)`},
        {instruction: `lh $at,0($at)`},
        {instruction: `lhu $at,0($at)`},
        {instruction: `lui $at,0`},
        {instruction: `lw $at,0($at)`},
        {instruction: `sb $at,0($at)`},
        {instruction: `sh $at,0($at)`},
        {instruction: `sw $at,0($at)`},
        {instruction: `mfhi $at`},
        {instruction: `mflo $at`},
        {instruction: `mthi $at`},
        {instruction: `mtlo $at`},
    ];
    operations = operations.concat(memoryaccess_opcodelist);
    return operations;
}

describe("Assembler Tests", function () {
    let assembler = new Assembler();
    describe("Assembler initialization", function () {
        it("should not be a null object", function () {
            assert.isNotNull(assembler);
        });
    });
    describe("Memory Access Opcodes", function () {
        GenerateTest_Instructions().forEach(function (opcode) {
            it('correctly assembles the opcode ' + opcode.instruction, function () {
                let assemblout = assembler.assemble(ReturnTestAsm(opcode.instruction)).textMem[2].toString(16);
                assert.isNotNull(assemblout);
            });
        });
    })
});

