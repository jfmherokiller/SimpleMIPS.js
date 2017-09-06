
export class FPU {
    registerfile:Float32Array;
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
        return this.registerfile[registerVal] + this.registerfile[registerVal-1];
    }
    inject_double(registerVal,value)
    {
        let spitval = FPU.split_double(value);
        this.registerfile[registerVal] = spitval[0];
        this.registerfile[registerVal-1] = spitval[1];
    }

    constructor() {
        this.registerfile = new Float32Array(32);
    }
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

}