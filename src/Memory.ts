import {Lib} from "./Lib";

export class Memory {
    CHUNKSIZE = 65536; // in bytes
    MASK = this.CHUNKSIZE - 1;
    CHUNKWIDTH = 16;
    latencyCtr: number;
    latency: number;
    busy: boolean;
    chunks:Uint8Array[];

    constructor() {
        this.chunks = [];
        // for cycle-acurrate simulation
        this.latencyCtr = 0;
        this.latency = 1;
        this.busy = false;
    }

    // alignment check should be done in CPU
    // big-endian
    // 0x11223344 -> LAddr 11 22 33 44 HAddr
    getChunk(addr) {
        let chunk = this.chunks[addr >>> this.CHUNKWIDTH];
        if (!chunk) {
            chunk = new Uint8Array(this.CHUNKSIZE);
            this.chunks[addr >>> this.CHUNKWIDTH] = chunk;
        }
        // assert busy flag here as all other operations
        // need to call this function first
        // no need to care about this during functional
        // simulation
        this.busy = true;
        return chunk;
    }

    getWord(addr) {
        let chunk = this.getChunk(addr);
        addr &= this.MASK;
        // big-endian, low address = high bits
        let tmp = (chunk[addr] << 24) |
            (chunk[addr + 1] << 16) |
            (chunk[addr + 2] << 8) |
            (chunk[addr + 3]);
        if (tmp < 0) {
            return 4294967296 + tmp;
        } else {
            return tmp;
        }
    }

    getHalfword(addr) {
        let chunk = this.getChunk(addr);
        addr &= this.MASK;
        return ((chunk[addr] << 8) |
            (chunk[addr + 1]));
    }

    getByte(addr) {
        return (this.getChunk(addr)[(addr & this.MASK)]);
    }

    setWord(addr, val) {
        let chunk = this.getChunk(addr);
        addr &= this.MASK;
        chunk[addr] = (val & 0xff000000) >>> 24;
        chunk[addr + 1] = (val & 0x00ff0000) >>> 16;
        chunk[addr + 2] = (val & 0x0000ff00) >>> 8;
        chunk[addr + 3] = (val & 0x000000ff);
    }

    setHalfword(addr, val) {
        let chunk = this.getChunk(addr);
        addr &= this.MASK;
        val &= 0xffff;
        chunk[addr] = (val & 0xff00) >>> 8;
        chunk[addr + 1] = (val & 0x00ff);
    }

    setByte(addr, val) {
        this.getChunk(addr)[addr & this.MASK] = (val & 0xff);
    }

    // cycle-accurate simulation related methods
    // called every clock cycle
    // cpu should check busy flag before read/write
    step() {
        if (this.busy) {
            this.latencyCtr++;
            if (this.latencyCtr >= this.latency) {
                this.latencyCtr = 0;
                this.busy = false;
            }
        }
    }

    // debug methods
    dump(start, nrow, ncol) {
        let n = nrow * ncol;
        let offset;
        let result = '';
        for (let i = 0; i < n; i++) {
            offset = start + (i << 1);
            if (i % ncol == 0) {
                result += '0x' + Lib.padLeft(offset.toString(16), '0', 8) + ' :';
            }
            result += ' ' + Lib.padLeft(this.getByte(offset).toString(16), '0', 2)
                + Lib.padLeft(this.getByte(offset + 1).toString(16), '0', 2);
            if (i % ncol == (ncol - 1)) {
                result += '\n';
            }
        }
        return result;
    }

    // dump to array, length in bytes
    // unpacked dump
    dumpToBuffer(start, length, buffer) {
        let si = start;
        let ei = si + length;
        for (let j = 0; si < ei; si++, j++) {
            buffer[j] = this.getByte(si);
        }
    }

    importAsm(asmResult) {
        let startIndex = asmResult.dataStart;
        let endIndex = startIndex + asmResult.dataSize;
        for (let i = startIndex; i < endIndex; i += 4) {
            let memory_block = ((i - startIndex) / 4);
            this.setWord(i, asmResult.dataMem[memory_block]);
        }
        startIndex = asmResult.textStart;
        endIndex = startIndex + asmResult.textSize;
        for (let i = startIndex; i < endIndex; i += 4) {
            let memory_block = ((i - startIndex) / 4);
            this.setWord(i, asmResult.textMem[memory_block]);
        }
    }
}