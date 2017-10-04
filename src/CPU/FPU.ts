
import {Lib} from "../Lib";

export class FPU {
    registerFile:Float32Array;
    //function which should split the double format used by javascript into 2 single precision floats
    static split_double(input)
    {
        let hipart = new Float32Array([input])[0];
        let delta = input - hipart;
        let lopart = new Float32Array([delta])[0];
        return [hipart,lopart];
    }
    extract_double(registerVal)
    {
        return this.registerFile[registerVal] + this.registerFile[registerVal-1];
    }
    inject_double(registerVal,value)
    {
        let spitval = FPU.split_double(value);
        this.registerFile[registerVal] = spitval[0];
        this.registerFile[registerVal-1] = spitval[1];
    }
    extract_single(registerVal)
    {
        return this.registerFile[registerVal];
    }
    inject_single(registerVal,value)
    {
        this.registerFile[registerVal] = value;
    }

    constructor() {
        this.registerFile = new Float32Array(32);
    }

//double ops
    //rd = rs + rt
    add_double(rd,rt,rs)
    {
        let arg1 = this.extract_double(rs);
        let arg2 = this.extract_double(rt);
        let ans = (arg1 + arg2);
        this.inject_double(rd,ans);
    }
    //rd = rs - rt
    sub_double(rd,rt,rs)
    {
        let arg1 = this.extract_double(rs);
        let arg2 = this.extract_double(rt);
        let ans = (arg1 - arg2);
        this.inject_double(rd,ans);
    }
    //rd = rs * rt
    mul_double(rd,rt,rs)
    {
        let arg1 = this.extract_double(rs);
        let arg2 = this.extract_double(rt);
        let ans = (arg1 * arg2);
        this.inject_double(rd,ans);
    }
    //rd = rs / rt
    div_double(rd,rt,rs)
    {
        let arg1 = this.extract_double(rs);
        let arg2 = this.extract_double(rt);
        let ans = (arg1 / arg2);
        this.inject_double(rd,ans);
    }
    //fd = abs(fs)
    abs_double(rd,rs)
    {
        let arg1 = this.extract_double(rs);
        let ans = Math.abs(arg1);
        this.inject_double(rd,ans);
    }
    //fd = sqrt(fs)
    sqrt_double(rd,rs)
    {
        let arg1 = this.extract_double(rs);
        let ans = Math.sqrt(arg1);
        this.inject_double(rd,ans);
    }
    //fd = neg(fs)
    neg_double(rd,rs)
    {
        let arg1 = this.extract_double(rs);
        let ans = -(arg1);
        this.inject_double(rd,ans);
    }
    //single ops
    //rd = rs + rt
    add_single(rd,rt,rs)
    {
        let arg1 = this.extract_single(rs);
        let arg2 = this.extract_single(rt);
        let ans = (arg1 + arg2);
        this.inject_single(rd,ans);
    }
    //rd = rs - rt
    sub_single(rd,rt,rs)
    {
        let arg1 = this.extract_single(rs);
        let arg2 = this.extract_single(rt);
        let ans = (arg1 - arg2);
        this.inject_single(rd,ans);
    }
    //rd = rs * rt
    mul_single(rd,rt,rs)
    {
        let arg1 = this.extract_single(rs);
        let arg2 = this.extract_single(rt);
        let ans = (arg1 * arg2);
        this.inject_single(rd,ans);
    }
    //rd = rs / rt
    div_single(rd,rt,rs)
    {
        let arg1 = this.extract_single(rs);
        let arg2 = this.extract_single(rt);
        let ans = (arg1 / arg2);
        this.inject_single(rd,ans);
    }
    //fd = abs(fs)
    abs_single(rd,rs)
    {
        let arg1 = this.extract_single(rs);
        let ans = Math.abs(arg1);
        this.inject_single(rd,ans);
    }
    //fd = sqrt(fs)
    sqrt_single(rd,rs)
    {
        let arg1 = this.extract_single(rs);
        let ans = Math.sqrt(arg1);
        this.inject_single(rd,ans);
    }
    //fd = neg(fs)
    neg_single(rd,rs)
    {
        let arg1 = this.extract_single(rs);
        let ans = -(arg1);
        this.inject_single(rd,ans);
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