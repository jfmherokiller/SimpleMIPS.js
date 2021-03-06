import {Assembler} from '../../src/Assembler';
import 'mocha';
import {assert} from "chai";
import {EXCEPTION_CODE,FunctionalCPU} from "../../src/CPU";
import {Memory} from "../../src/Memory";
import {readFileSync} from "fs";


describe("Functional CPU Testing", function () {
    let assembler;
    let mem;
    let cpu;
    before("Setup CPU/Memory and register events", function () {
        assembler = new Assembler();
        mem = new Memory();
        cpu = new FunctionalCPU(mem);
        registerEvents(cpu);
    });
    describe("run test programs", function () {
        const program_path = __dirname;
        it("it should correctly run the hello world code", function () {
            let program_path_Inner = program_path + "/helloworld.asm";
            let assembleres = assembler.assemble(readFileSync(program_path_Inner, "utf8"));
            mem.importAsm(assembleres);
            cpu.reset();
            Runcpu(cpu);
        });
        it("it should run the forloop code", function () {
            let program_path_Inner = program_path + "/forloop.asm";
            let assembleres = assembler.assemble(readFileSync(program_path_Inner, "utf8"));
            mem.importAsm(assembleres);
            cpu.reset();
            Runcpu(cpu);
        });
    });

});

function Runcpu(cpu) {
    for (let i = 0; i < 12500; i++) {
        let exception = cpu.step();
        if (exception === EXCEPTION_CODE.BREAK) {
            break;
        }
        if (exception === EXCEPTION_CODE.INVALID_INST)
        {
            throw Error(`Invalid Instruction Info:${cpu}`)
        }
    }
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