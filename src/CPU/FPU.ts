
export class FPU {
    registerfile:Float32Array;
    //function which should split the double format used by javascript into 2 single precision floats
    split_double(input)
    {
        var hipart = new Float32Array([ input])[0];
        var delta = input - hipart;
        var lopart = new Float32Array([delta])[0];
        return [hipart,lopart];
    }

    constructor() {
        this.registerfile = new Float32Array(32);
    }
}