
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
    result:string;
}
let memoryaccess_opcodelist:opcodeObject[] = [
    {instruction:"lb $v0,0($v1)", result:"80620000"},
    {instruction:"lbu $v0,0($v1)",result:"90620000"},
    {instruction:"lh $v0,0($v1)",result:"84620000"},
    {instruction:"lhu $v0,0($v1)",result:"94620000"},
    {instruction:"lui $v0,1",result:"3c020001"},
    {instruction:"lw $v0,0($v1)",result:"8c620000"},
    {instruction:"sb $v0,0($v1)",result:"a0620000"},
    {instruction:"sh $v0,0($v1)",result:"a4620000"},
    {instruction:"sw $v0,0($v1)",result:"ac620000"},
    {instruction:"mfhi $v0",result:"00001010"},
    {instruction:"mflo $v0",result:"00001012"},
    {instruction:"mthi $v0",result:"00400011"},
    {instruction:"mtlo $v0",result:"00400013"},

];
describe("Assembler Tests",function () {
    describe("Memory Access Opcodes",function () {
        memoryaccess_opcodelist.forEach(function (opcode) {
            it('correctly assembles the opcode ' + opcode.instruction, function() {
                let assemblout = new Assembler().assemble(ReturnTestAsm(opcode.instruction)).textMem[2].toString(16);
                let paddedOpcode = Lib.padLeft(assemblout,"0",8);
                assert.equal(paddedOpcode,opcode.result);
            });
        });
    })
});

