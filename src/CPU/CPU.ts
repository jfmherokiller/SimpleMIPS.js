import {EventBus} from "../EventBus";
import {Lib} from "../Lib";


export class CPUInternal {
    mem;
    pc;
    cycle;
    registerFile;
    callbacks;
    step;
    eventBus;
    reset;
    branchTarget;

    constructor(mem, callbacks?) {
        this.eventBus = new EventBus();
        this.mem = mem;
        this.pc = 0;
        this.cycle = 0;
        //this contains the basic registers and hi,lo which are 32 and 33 respectively
        this.registerFile = new Uint32Array(34);
        this.callbacks = callbacks || {};
    }

    dumpRegisterFile(buffer?) {
        if (!buffer) {
            let str = '';
            for (let i = 0; i < 34; i++) {
                str += 'r' + i + '\t: 0x' + Lib.padLeft(this.registerFile[i].toString(16), '0', 8) + '\n';
            }
            return str;
        } else {
            for (let i = 0; i < 34; i++) {
                buffer[i] = this.registerFile[i];
            }
        }
    }
}




