import {Lib} from "./Lib";
import {TokenList} from "./TokenList";
import {ParserNode, DataNode, InstructionNode} from "./TokenNode";
import {Instructions} from "./Instructions/Instructions";
import {PseudoInstructions} from "./Instructions/PseudoInstructions";
import {regexObject, TOKEN_TYPE} from "./Tokenizer";

export enum NODE_TYPE {DATA = 0, TEXT = 1}

export class Assembler {
    static STORAGE_TYPES = '.space .byte .word .halfword .asciiz .ascii .float .double'.split(' ');

    static INST_SIZE = 4;
    regexObject;
    InstructionClasses;
    PiObject;
    InstructionTypes;

    constructor() {
        this.regexObject = new regexObject();
        this.InstructionClasses = Instructions.MakeCPUInstructionClasses();
        this.PiObject = new PseudoInstructions(this.InstructionClasses);
        this.InstructionTypes = Instructions.MakeInstructionTypeTable(this.InstructionClasses);
    }


    static disassemble(inst) {
        // @todo
        let opcode = (inst & 0xfc000000) >>> 26,
            func = inst & 0x3f,
            rs = (inst & 0x03e00000) >>> 21,
            rt = (inst & 0x001f0000) >>> 16,
            rd = (inst & 0x0000f800) >>> 11,
            a = (inst & 0x000007c0) >>> 6,
            imm = inst & 0xffff,
            imms = (imm & 0x8000) ? (imm | 0xffff0000) : imm; // sign-extended imm
        let str;
        switch (opcode) {
            case 0:
                switch (func) {
                    case 0:
                        if (rd == 0 && rt == 0 && a == 0) {
                            str = 'nop (sll $r0, $r0, 0)';
                        } else {
                            str = 'sll rd, rt, sa';
                        }
                        break;
                    case 2:
                        str = 'srl rd, rt, sa';
                        break;
                    case 3:
                        str = 'sra rd, rt, sa';
                        break;
                    case 4:
                        str = 'sllv rd, rt, rs';
                        break;
                    case 6:
                        str = 'srlv rd, rt, rs';
                        break;
                    case 7:
                        str = 'srav rd, rt, rs';
                        break;
                    case 8:
                        str = 'jr rs';
                        break;
                    case 13:
                        str = 'mips_break';
                        break;
                    //case 16: // mfhi
                    //case 17: // mthi
                    //case 18: // mflo
                    //case 19: // mtlo
                    //case 24: // mult
                    //case 25: // multu
                    //case 26: // div
                    //case 27: // divu
                    case 32:
                        str = 'add rd, rs, rt';
                        break;
                    case 33:
                        str = 'addu rd, rs, rt';
                        break;
                    case 34:
                        str = 'sub rd, rs, rt';
                        break;
                    case 35:
                        str = 'subu rd, rs, rt';
                        break;
                    case 36:
                        str = 'and rd, rs, rt';
                        break;
                    case 37:
                        str = 'or rd, rs, rt';
                        break;
                    case 38:
                        str = 'xor rd, rs, rt';
                        break;
                    case 39:
                        str = 'nor rd, rs, rt';
                        break;
                    case 42:
                        str = 'slt rd, rs, rt';
                        break;
                    case 43:
                        str = 'sltu rd, rs, rt';
                        break;
                    default:
                        str = 'unknown';
                        break;
                }
                break;
            case 1:
                switch (rt) {
                    case 0:
                        str = 'bltz rs, offset';
                        break;
                    case 1:
                        str = 'bgez rs, offset';
                        break;
                    default:
                        str = 'unknown';
                        break;
                }
                break;
            case 2:
                str = 'j addr';
                imm = inst & 0x03ffffff;
                if (imm < 0) imm = imm + 4294967296;
                break;
            case 4:
                str = 'beq rs, rt, offset';
                break;
            case 5:
                str = 'bne rs, rt, offset';
                break;
            case 6:
                str = 'blez rs, offset';
                break;
            case 7:
                str = 'bgtz rs, offset';
                break;
            case 8:
                str = 'addi rt, rs, imm';
                break;
            case 9:
                str = 'addiu rt, rs, imm';
                break;
            case 10:
                str = 'slti rt, rs, imm';
                break;
            case 11:
                str = 'sltiu rt, rs, imm';
                break;
            case 12:
                str = 'andi rt, rs, imm';
                break;
            case 13:
                str = 'ori rt, rs, imm';
                break;
            case 14:
                str = 'xori rt, rs, imm';
                break;
            case 15:
                str = 'lui rt, imm';
                break;
            case 32:
                str = 'lb rt, offset(rs)';
                break;
            case 33:
                str = 'lh rt, offset(rs)';
                break;
            case 35:
                str = 'lw';
                break;
            case 36:
                str = 'lbu rt, offset(rs)';
                break;
            case 37:
                str = 'lhu rt, offset(rs)';
                break;
            case 40:
                str = 'sb rt, offset(rs)';
                break;
            case 41:
                str = 'sh rt, offset(rs)';
                break;
            case 43:
                str = 'sw rt, offset(rs)';
                break;
            case 63: // simulator special
                switch (func) {
                    case 0:
                        str = 'print rs';
                        break;
                    case 1:
                        str = 'printm rs';
                        break;
                    case 2:
                        str = 'prints rs';
                        break;
                    default:
                        str = 'unknown';
                        break;
                }
                break;
            default:
                str = 'unknown';
                break;
        }
        return str.replace('rs', '$r' + rs)
            .replace('rt', '$r' + rt)
            .replace('rd', '$r' + rd)
            .replace('sa', a)
            .replace('addr', '0x' + imm.toString(16))
            .replace('offset', '0x' + imm.toString(16))
            .replace('imm', imm);
    }

    // return data, memory array, their size and offset,
    // and source map
    assemble(src, config?) {
        let lines = Assembler.preprocess(src);
        let symbolTable = {};
        let statusTable = {
            section: 'text',
            textSize: 0,
            dataSize: 0,
            dataStartAddr: 0,	// data section start address
            dataCurrentAddr: 0,	// data section current address
            textStartAddr: 0,	// text section start address
            textCurrentAddr: 0		// text section current address
        };
        let aliasTable = {};
        let curTokenList;
        let infoList = [];
        config = Lib.extend({}, config);
        // apply user defined properties
        statusTable.dataStartAddr = (config.dataStartAddr != undefined) ? config.dataStartAddr : 0x10000000;
        statusTable.textStartAddr = (config.textStartAddr != undefined) ? config.textStartAddr : 0x00040000;
        statusTable.dataCurrentAddr = statusTable.dataStartAddr;
        statusTable.textCurrentAddr = statusTable.textStartAddr;
        // generate infomation list
        for (let i = 0; i < lines.length; i++) {
            try {
                curTokenList = this.tokenize(lines[i]);
                infoList.push.apply(infoList, this.parseLine(curTokenList, i + 1, symbolTable, statusTable));
            } catch (err) {
                throw new Error('L' + (i + 1) + ':' + err.message);
            }
        }
        //console.log(infoList);
        // resolve symbols and alias
        this.resolveSymbols(infoList, symbolTable, statusTable);

        // translate
        // check section confliction
        let dStart = statusTable.dataStartAddr;
        let dEnd = statusTable.dataStartAddr + statusTable.dataSize;
        let tStart = statusTable.textStartAddr;
        let tEnd = statusTable.textStartAddr + statusTable.textSize;
        if (!(dEnd < tStart || dStart > tEnd)) {
            throw new Error('Overlap detected between data section and text section.');
        }
        let dataMem = [];
        let textMem = [];
        this.translate(infoList, textMem, dataMem, statusTable);

        return {
            dataStart: statusTable.dataStartAddr,
            textStart: statusTable.textStartAddr,
            dataSize: statusTable.dataSize,
            textSize: statusTable.textSize,
            dataMem: dataMem,
            textMem: textMem,
            sourceMap: Assembler.generateSourceMap(infoList, statusTable),
            symbolTable: symbolTable
        };
    }

    // strip off comments and split into tokens
    static preprocess(src) {
        let lines = src.split(/\n/);
        for (let i = 0, n = lines.length; i < n; i++) {
            lines[i] = lines[i].replace(/#.*$/, '')
                .trim();
        }
        return lines;
    }


    tokenize(line) {

        let matches;
        let flag;
        let curType;
        let tokenList = new TokenList();
        let newNode;
        while (line.length > 0) {
            flag = false;
            for (let i = 0; i < this.regexObject.tokenTypeCount; i++) {
                matches = line.match(this.regexObject.tokenRegexps[i]);
                if (matches && matches[0]) {
                    newNode = new ParserNode(i);
                    switch (i) {
                        case TOKEN_TYPE.STRING:
                            // preserve original case for string
                            newNode.value = matches[1];
                            break;
                        case TOKEN_TYPE.WORD:
                        case TOKEN_TYPE.LABEL:
                            newNode.value = matches[1].toLowerCase();
                            break;
                        case TOKEN_TYPE.COMOPR:
                            newNode.offset = parseInt(matches[1]);
                            newNode.value = matches[2].toLowerCase();
                            break;
                        case TOKEN_TYPE.INTEGER:
                            if (matches[2]) {
                                // preserve original case for char
                                newNode.value = matches[2].charCodeAt(0);
                            } else {
                                newNode.value = parseInt(matches[0]);
                            }
                            break;
                        default:
                            newNode.value = matches[0].toLowerCase();
                    }
                    tokenList.push(newNode);
                    line = line.slice(matches.index + matches[0].length);
                    flag = true;
                    break;
                }
            }
            // no matching syntax
            if (!flag) {
                throw new Error('Unexpected syntax at: ' + line);
            }
        }
        return tokenList;
    }
    static alignSize(size) {
        return 4 * (Math.floor((size - 0.1) / 4.0) + 1);
    }
    static convertDouble(n)
    {
        let buffer = Buffer.alloc(8);
        buffer.writeDoubleLE(n,0);
        return parseInt(buffer.toString('hex'),16)
    }
    static convertSingle(n)
    {
        let buffer = Buffer.alloc(4);
        buffer.writeFloatLE(n,0);
        return parseInt(buffer.toString('hex'),16)
    }

    static convertWord(n) {
        if (n > 2147483647) n = 2147483647;
        if (n < -2147483648) n = -2147483648;
        return (n < 0) ? 4294967296 + n : n;
    }

    static convertHalfword(n) {
        if (n > 32767) n = 32767;
        if (n < -32768) n = -32768;
        return (n < 0) ? 65536 + n : n;
    }

    static convertByte(n) {
        if (n > 127) n = 127;
        if (n < -128) n = -128;
        return (n < 0) ? 256 + n : n;
    }

    // pack string into memory binary
    static packString(str) {
        let i, n, res = [];
        n = str.length;
        for (i = 3; i < n; i += 4) {
            res.push((str.charCodeAt(i - 3) * 16777216) +
                (str.charCodeAt(i - 2) << 16) +
                (str.charCodeAt(i - 1) << 8) +
                (str.charCodeAt(i)));
        }
        i = n - i + 3;
        if (i == 0) {
            res.push(0);
        } else if (i == 1) {
            res.push(str.charCodeAt(n - 1) * 16777216);
        } else if (i == 2) {
            res.push(str.charCodeAt(n - 2) * 16777216 +
                str.charCodeAt(n - 1) << 16);
        } else {
            res.push(str.charCodeAt(n - 3) * 16777216 +
                (str.charCodeAt(n - 2) << 16) +
                (str.charCodeAt(n - 1) << 8));
        }
        return res;
    }

    // pack integer list into memory binary
    static packIntegers(list, unitSize) {
        let result = [], i, n, t;
        if (unitSize == 4) {
            n = list.length;
            for (i = 0; i < n; i++) {
                result.push(Assembler.convertWord(list[i]));
            }
        } else if (unitSize == 2) {
            n = list.length;
            if (n % 2 != 0) {
                list.push(0);
                n++;
            }
            for (i = 0; i < n; i += 2) {
                result.push(Assembler.convertHalfword(list[i]) * 65536 +
                    Assembler.convertHalfword(list[i + 1]));
            }
        } else if (unitSize == 1) {
            n = list.length;
            t = 4 - n % 4;
            if (t < 4) {
                for (i = 0; i < t; i++) {
                    list.push(0);
                }
                n += t;
            }
            for (i = 0; i < n; i += 4) {
                result.push(Assembler.convertByte(list[i]) * 16777216 +
                    (Assembler.convertByte(list[i + 1]) << 16) +
                    (Assembler.convertByte(list[i + 2]) << 8) +
                    Assembler.convertByte(list[i + 3]));
            }
        } else {
            throw new Error('Invaid unit size for alignment.')
        }
        return result;
    }

    // create a data node for future translation
    // alignment is automatically enforced
    static createDataNode(tokenList: TokenList, type, curAddr, lineno) {
        let curToken;
        let unitSize;
        let newSize;
        let newData;
        let result = new DataNode(lineno, curAddr);
        if (type == '.space') {
            // allocate new space, no specific data needed
            curToken = tokenList.expect(TOKEN_TYPE.INTEGER);
            if (curToken) {
                newSize = Assembler.alignSize(curToken.value);
                result.size = newSize;
                result.data = undefined;
            } else {
                throw new Error('No size specified for .space.');
            }
        } else if (type == '.asciiz' || type == '.ascii') {
            // string
            curToken = tokenList.expect(TOKEN_TYPE.STRING);
            if (curToken) {
                newData = Assembler.packString(curToken.value);
                result.size = newData.length * 4;
                result.data = newData;
            } else {
                throw new Error('No string specified for .asciiz');
            }
        } else {
            // other data
            switch (type) {
                case '.byte' :
                    unitSize = 1;
                    break;
                case '.halfword' :
                    unitSize = 2;
                    break;
                default :
                    unitSize = 4 // word
            }
            newData = tokenList.expectList(TOKEN_TYPE.INTEGER, TOKEN_TYPE.COMMA);
            if (newData) {
                newData = Assembler.packIntegers(newData, unitSize);
                result.size = newData.length * 4;
                result.data = newData;
            } else {
                throw new Error('No data found after ' + type);
            }
        }
        return result;
    }

    // check if immediate number is within valid range
    checkImmediateRange(imm, instName) {
        if (typeof(imm) == 'string') {
            // ignore label here
            // label should be resolved later
            return true;
        }
        if (this.InstructionClasses.INST_IMM_SHIFT.indexOf(instName) >= 0) {
            // shift 0~31
            if (imm < 0 || imm > 31) {
                throw new Error('Shift amount ' + imm + ' out of range (0~31)');
            }
        } else {
            // integer
            if (this.InstructionClasses.INST_UNSIGNED.indexOf(instName) >= 0) {
                // unsigned 0~65535
                if (imm < 0 || imm > 65535) {
                    throw new Error('Unsigned integer ' + imm + ' out of range (0~65535)');
                }
            } else {
                // signed -32768~32767
                if (imm < -32768 || imm > 32767) {
                    throw new Error('Signed integer ' + imm + ' out of range (-32768~32767)');
                }
            }
        }
        return true;
    }

    // create an instruction node for future translation
    createInstructionNode(tokenList, instName, curAddr, lineno) {
        let expectedTokens;
        let tmp;
        let type;
        let i;
        type = -1;
        let result = new InstructionNode(instName, curAddr, Assembler.INST_SIZE, lineno);
        // get instruction format type
        for (i = 0; i < this.InstructionTypes.INST_TYPE_COUNT; i++) {
            if (this.InstructionTypes.INST_TYPE_OPS[i].indexOf(instName) >= 0) {
                type = i;
                break;
            }
        }
        if (type < 0) {
            throw new Error('Unknown instruction ' + instName);
        }
        // interpret
        switch (type) {
            case this.InstructionTypes.INST_TYPES.RR: // e.g. mult rs, rt
                expectedTokens = tokenList.expect([
                    TOKEN_TYPE.REGOPR,
                    TOKEN_TYPE.COMMA,
                    TOKEN_TYPE.REGOPR
                ]);
                if (expectedTokens) {
                    result.rs = expectedTokens[0].value;
                    result.rt = expectedTokens[2].value;
                } else {
                    throw new Error('Expecting 2 register operands for ' + instName);
                }
                break;
            case this.InstructionTypes.INST_TYPES.RRR: // e.g. add rd, rs, rt
                expectedTokens = tokenList.expect([
                    TOKEN_TYPE.REGOPR,
                    TOKEN_TYPE.COMMA,
                    TOKEN_TYPE.REGOPR,
                    TOKEN_TYPE.COMMA,
                    TOKEN_TYPE.REGOPR
                ]);
                if (expectedTokens) {
                    result.rd = expectedTokens[0].value;
                    result.rs = expectedTokens[2].value;
                    result.rt = expectedTokens[4].value;
                } else {
                    throw new Error('Expecting 3 register operands for ' + instName);
                }
                break;
            case this.InstructionTypes.INST_TYPES.RRI: // e.g. addi rt, rs, imm
                expectedTokens = tokenList.expect([
                    TOKEN_TYPE.REGOPR,
                    TOKEN_TYPE.COMMA,
                    TOKEN_TYPE.REGOPR,
                    TOKEN_TYPE.COMMA,
                    [TOKEN_TYPE.WORD, TOKEN_TYPE.INTEGER]
                ]);
                if (expectedTokens) {
                    result.rt = expectedTokens[0].value;
                    result.rs = expectedTokens[2].value;
                    // check range
                    tmp = expectedTokens[4].value;
                    if (this.checkImmediateRange(tmp, instName)) {
                        result.imm = tmp;
                    }
                } else {
                    throw new Error('Expecting 2 register operands and 1 immediate for ' + instName);
                }
                break;
            case this.InstructionTypes.INST_TYPES.RRA: // e.g. sll rd, rt, amount
                expectedTokens = tokenList.expect([
                    TOKEN_TYPE.REGOPR,
                    TOKEN_TYPE.COMMA,
                    TOKEN_TYPE.REGOPR,
                    TOKEN_TYPE.COMMA,
                    TOKEN_TYPE.INTEGER
                ]);
                if (expectedTokens) {
                    result.rd = expectedTokens[0].value;
                    result.rt = expectedTokens[2].value;
                    // check range
                    tmp = expectedTokens[4].value;
                    if (this.checkImmediateRange(tmp, instName)) {
                        result.imm = tmp;
                    }
                } else {
                    throw new Error('Expecting 2 register operands and 1 immediate for ' + instName);
                }
                break;
            case this.InstructionTypes.INST_TYPES.RC: // e.g. lw rt, offset(base)
                expectedTokens = tokenList.expect([
                    TOKEN_TYPE.REGOPR,
                    TOKEN_TYPE.COMMA,
                    TOKEN_TYPE.COMOPR
                ]);
                if (expectedTokens) {
                    result.rt = expectedTokens[0].value;
                    result.rs = expectedTokens[2].value;
                    // check offset range
                    tmp = expectedTokens[2].offset;
                    if (tmp >= -32768 && tmp < 32768) {
                        result.imm = tmp;
                    } else {
                        throw new Error('Offset value ' + tmp + ' out of range (-32768~32767).');
                    }
                } else {
                    throw new Error('Expecting 1 register operand and 1 immediate for ' + instName);
                }
                break;
            case this.InstructionTypes.INST_TYPES.RSDRTI: // e.g. blez rs, imm
                expectedTokens = tokenList.expect([
                    TOKEN_TYPE.REGOPR,
                    TOKEN_TYPE.COMMA,
                    [TOKEN_TYPE.WORD, TOKEN_TYPE.INTEGER]
                ]);
                if (expectedTokens) {
                    result.rs = expectedTokens[0].value;
                    result.imm = expectedTokens[2].value;
                } else {
                    throw new Error('Expecting 1 register operand and 1 immediate for ' + instName);
                }
                break;
            case this.InstructionTypes.INST_TYPES.RI: // e.g. blez rs, imm
                expectedTokens = tokenList.expect([
                    TOKEN_TYPE.REGOPR,
                    TOKEN_TYPE.COMMA,
                    [TOKEN_TYPE.WORD, TOKEN_TYPE.INTEGER]
                ]);
                if (expectedTokens) {
                    result.rt = expectedTokens[0].value;
                    result.imm = expectedTokens[2].value;
                } else {
                    throw new Error('Expecting 1 register operand and 1 immediate for ' + instName);
                }
                break;
            case this.InstructionTypes.INST_TYPES.RS: // e.g. jr rs
                expectedTokens = tokenList.expect([
                    TOKEN_TYPE.REGOPR,
                ]);
                if (expectedTokens) {
                    result.rs = expectedTokens[0].value;
                } else {
                    throw new Error('Expecting 1 register operand for ' + instName);
                }
                break;
            case this.InstructionTypes.INST_TYPES.RT: // e.g. mflo rd
                expectedTokens = tokenList.expect([
                    TOKEN_TYPE.REGOPR,
                ]);
                if (expectedTokens) {
                    result.rd = expectedTokens[0].value;
                } else {
                    throw new Error('Expecting 1 register operand for ' + instName);
                }
                break;
            case this.InstructionTypes.INST_TYPES.I:
                expectedTokens = tokenList.expect([
                    [TOKEN_TYPE.WORD, TOKEN_TYPE.INTEGER]
                ]);
                if (expectedTokens) {
                    result.imm = expectedTokens[0].value;
                } else {
                    throw new Error('Expecting 1 immediate for ' + instName);
                }
                break;
            case this.InstructionTypes.INST_TYPES.FSRRR:
                expectedTokens = tokenList.expect([
                    TOKEN_TYPE.REGOPR,TOKEN_TYPE.COMMA,TOKEN_TYPE.REGOPR,TOKEN_TYPE.COMMA,TOKEN_TYPE.REGOPR
                ]);
                if (expectedTokens) {
                    result.fd = expectedTokens[0].value;
                    result.fs = expectedTokens[2].value;
                    result.ft = expectedTokens[4].value;
                } else {
                    throw new Error('Expecting 3 Registers for ' + instName);
                }
                break;
            case this.InstructionTypes.INST_TYPES.N:
                // nothing to expect, do nothing
                break;
            default:
                throw new Error('Unrecongnized instruction type ' + type);
        }
        result.addr = curAddr;
        return result;
    }

    expandPseudoInstruction(tokens, type) {
        let instName = this.PiObject.PI_NAMES[type],
            expectations = this.PiObject.PI_EXPECTS[type],
            newCode = this.PiObject.PI_TRANSLATION[type],
            expectedTokens;
        expectedTokens = tokens.expect(expectations);
        if (expectedTokens) {
            newCode = newCode.replace(/\{(\d+)\.*(.*?)\}/g, function (match, p1, p2) {
                var n = parseInt(p1), newVal;
                if (isNaN(n) || n < 0 || n >= expectedTokens.length) {
                    throw new Error('Invalid index ' + p1 + ' in format string.');
                }
                if (p2) {
                    // has sub attributes
                    if (p2 == 'L') {
                        newVal = parseInt(expectedTokens[n].value) & 0xffff;
                    } else if (p2 == 'H') {
                        newVal = parseInt(expectedTokens[n].value) >>> 16;
                    } else {
                        newVal = expectedTokens[n][p2];
                    }
                    if (newVal == undefined) {
                        throw new Error('Attribute ' + p2 + ' is undefined.');
                    }
                    return String(newVal);
                } else {
                    return String(expectedTokens[n].value);
                }
            });
            return this.tokenize(newCode).getList();
        } else {
            throw new Error('Syntax error near pseudo instruction ' + instName);
        }
    }

    // parse a TokenList
    // return {
    // 	type : 0 - data, 1 - text
    //  addr : actually the size here, in byte
    //  when data include data
    //  when text include inst, rs, rd, rt, imm
    // }
    parseLine(tokens, lineno, symbols, status) {
        let curToken;
        let flag;
        let tokenRecognized;
        let inst;
        let idx;
        let tmp;
        let result = [];
        while (tokens.getLength() > 0) {
            // consume white space
            tokens.expect(TOKEN_TYPE.SPACE);
            tokenRecognized = false;
            // label
            curToken = tokens.expect(TOKEN_TYPE.LABEL);
            if (curToken) {
                // consume white space
                tokens.expect(TOKEN_TYPE.SPACE);
                if (symbols[curToken.value]) {
                    throw new Error('Symbol "' + curToken.value + '" is redefined!');
                } else {
                    symbols[curToken.value] = (status.section == 'text') ?
                        status.textCurrentAddr : status.dataCurrentAddr;
                }
                tokenRecognized = true;
            }
            // specials
            curToken = tokens.expect(TOKEN_TYPE.SPECIAL);
            if (curToken) {
                // consume white space
                tokens.expect(TOKEN_TYPE.SPACE);
                if (curToken.value == '.globl') {
                    //consume the globl token in a noop
                    tokens.expect(TOKEN_TYPE.SPACE);
                    tokens.expect(TOKEN_TYPE.WORD);
                } else if (curToken.value == '.data' || curToken.value === '.kdata') {
                    // change to data section
                    status.section = 'data';
                } else if (curToken.value == '.text' || curToken.value === '.ktext') {
                    // change to text section
                    status.section = 'text';
                } else if (Assembler.STORAGE_TYPES.indexOf(curToken.value) >= 0) {
                    if (status.section != 'data') {
                        throw new Error('Cannot allocate data in text section.')
                    }
                    // allocate storage
                    tmp = Assembler.createDataNode(tokens, curToken.value, status.dataCurrentAddr, lineno);
                    status.dataCurrentAddr += tmp.size; // update global data pointer address
                    status.dataSize += tmp.size;
                    result.push(tmp);
                } else {
                    throw new Error('Unexpected syntax near ' + curToken.value);
                }
                tokenRecognized = true;
            }
            // instructions
            curToken = tokens.expect(TOKEN_TYPE.WORD);
            if (curToken) {
                if (status.section != 'text') {
                    throw new Error('Instructions cannot be put into data section.')
                }
                // consume white space
                tokens.expect(TOKEN_TYPE.SPACE);
                tokenRecognized = true;
                inst = curToken.value;
                flag = false;
                // check if it is pseudo instruction
                if ((idx = this.PiObject.PI_NAMES.indexOf(inst)) >= 0) {
                    if (this.PiObject.SHARED_INST.indexOf(inst) >= 0) {
                        // attempt to interpret as pseudo instruction first
                        // if name conflict found
                        if (tokens.expect(this.PiObject.PI_EXPECTS[idx], true)) {
                            tokens.prepend(this.expandPseudoInstruction(tokens, idx));
                            flag = true;
                        }
                        // unable to interpret as pseudo instruction
                        // pass to normal interpreter
                    } else {
                        // expand normal pseudo instruction
                        // prepend new tokens to the beginning
                        tokens.prepend(this.expandPseudoInstruction(tokens, idx));
                        flag = true;
                    }

                }
                if (!flag) {
                    // interpret as normal instruction
                    tmp = this.createInstructionNode(tokens, curToken.value, status.textCurrentAddr, lineno);
                    status.textCurrentAddr += tmp.size; // update global text pointer address
                    status.textSize += tmp.size;
                    result.push(tmp);
                }
            }
            if (!tokenRecognized) {
                throw new Error('Unexpected syntax near : ' + tokens.get(0).value);
            }
        }
        return result;
    }
    Float_regAliases = (
        '$f0,$f1,$f2,$f3,$f4,$f5,$f6,$f7,' +
        '$f8,$f9,$f10,$f11,$f12,$f13,$f14,$f15,' +
        '$f16,$f17,$f18,$f19,$f20,$f21,$f22,$f23,' +
        '$f24,$f25,$f26,$f27,$f28,$f29,$f30,$f31').split(',');
    GRP_regAliases = ('$zero $at $v0 $v1 $a0 $a1 $a2 $a3 ' +
        '$t0 $t1 $t2 $t3 $t4 $t5 $t6 $t7 ' +
        '$s0 $s1 $s2 $s3 $s4 $s5 $s6 $s7 ' +
        '$t8 $t9 $k0 $k1 $gp $sp $fp $ra').split(' ');
    convertRegName(regname) {
        // GPRs only
        let idx;
        if (regname == 'zero') {
            return 0;
        } else if ((idx = this.GRP_regAliases.indexOf(regname)) >= 0) {
            return idx;
        } else if  ((idx = this.Float_regAliases.indexOf(regname)) >= 0) {
            return idx;
        } else {
            let match = regname.match(/\d+/),
                n;
            if (match) {
                n = parseInt(match[0]);
                if (n >= 0 && n < 32) return n;
            }
        }
        // no match
        throw new Error('Invalid register name ' + regname);
    }

    resolveSymbols(list, symbols, aliases) {
        let n = list.length;
        let i;
        let cur;
        let newVal;
        let needHigh16Bits;
        let needLow16Bits;
        for (i = 0; i < n; i++) {
            cur = list[i];
            if (cur.type == NODE_TYPE.DATA) continue;
            if (typeof(cur.rt) == 'string') {
                cur.rt = this.convertRegName(cur.rt);
            }
            if (typeof(cur.rs) == 'string') {
                cur.rs = this.convertRegName(cur.rs);
            }
            if (typeof(cur.rd) == 'string') {
                cur.rd = this.convertRegName(cur.rd);
            }
            if (typeof(cur.ft) == 'string') {
                cur.ft = this.convertRegName(cur.ft);
            }
            if (typeof(cur.fs) == 'string') {
                cur.fs = this.convertRegName(cur.fs);
            }
            if (typeof(cur.fd) == 'string') {
                cur.fd = this.convertRegName(cur.fd);
            }
            if (typeof(cur.imm) == 'string') {
                // resolve label
                // check internal operator
                if (cur.imm.indexOf('__h16__') == 0) {
                    needHigh16Bits = true;
                    needLow16Bits = false;
                    cur.imm = cur.imm.slice(7);
                }
                if (cur.imm.indexOf('__l16__') == 0) {
                    needLow16Bits = true;
                    needHigh16Bits = false;
                    cur.imm = cur.imm.slice(7);
                }
                newVal = symbols[cur.imm];
                if (newVal == undefined) {
                    throw new Error('Undefined symbol ' + cur.imm);
                } else {
                    if (cur.inst == 'j') {
                        // special absolute jump
                        newVal = newVal >> 2;
                    } else if (this.InstructionClasses.INST_REL_PC.indexOf(cur.inst) >= 0) {
                        // check if using relative PC
                        // calculate relative offset
                        newVal = (newVal - cur.addr) >> 2;
                        if (newVal < -32768 || newVal > 32767) {
                            throw new Error('Target "' + cur.imm + '" too far way.');
                        }
                    } else {
                        // check if masking is needed
                        if (needLow16Bits) newVal = newVal & 0xffff;
                        if (needHigh16Bits) newVal = newVal >>> 16;
                    }
                    cur.imm = newVal;
                }
            }
        }
    }

    // translate into machine code
    translate(list, text, data, statusTable) {
        let startIndex;
        let endIndex;
        for (let i = 0; i < list.length; i++) {
            let currentToken: (DataNode | InstructionNode) = list[i];
            if (currentToken instanceof DataNode) {
                if (currentToken.data) {
                    // copy data
                    startIndex = (currentToken.addr - statusTable.dataStartAddr) >> 2;
                    endIndex = startIndex + (currentToken.size >> 2);
                    for (let k = 0, j = startIndex; j < endIndex; j++, k++) {
                        data[j] = currentToken.data[k];
                    }
                } else {
                    // other wise fill with zeros
                    startIndex = (currentToken.addr - statusTable.dataStartAddr) >> 2;
                    endIndex = startIndex + (currentToken.size >> 2);
                    for (let j = startIndex; j < endIndex; j++) {
                        data[j] = 0;
                    }
                }
            } else {
                startIndex = (currentToken.addr - statusTable.textStartAddr) >> 2;
                text[startIndex] = this.InstructionClasses.translators[currentToken.inst](currentToken);
            }
        }
    }

    // generate source map
    static generateSourceMap(list, statusTable) {
        let ListOfLineNumbers: number[] = [];
        for (let i = 0; i < list.length; i++) {
            let cur = list[i];
            if (cur instanceof InstructionNode) {
                ListOfLineNumbers[(cur.addr - statusTable.textStartAddr) >> 2] = cur.line;
            }
        }
        return ListOfLineNumbers;
    }


}