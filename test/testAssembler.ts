
import {Assembler} from '../src/Assembler';
 import 'mocha';
import * as assert from "assert";

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
describe("Assembler Tests",function () {
    describe("Memory Access Opcodes",function () {
        describe("load byte test",function () {
            it("should return correctly assembled binary code for the load byte opcode",function () {
                let assemblout = new Assembler().assemble(ReturnTestAsm("lb $v0,0($v1)"));
                assert.equal(assemblout.textMem[2].toString(16),"80620000");
            })
        })
    })
});

