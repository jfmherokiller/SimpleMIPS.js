enum Coprocessor_0_Registers {
    Status = 12,
    Cause = 13,
    EPC = 14,
    PRId = 15,
    Cycle_count = 9,
    Config = 16,
}
class Coprocessor_0 {
    registerfile;
    constructor() {
        this.registerfile = new Uint32Array(32);
        this.setPridRegister();
    }
    setPridRegister() {
        let company_options = 0x0;
        let company_id = 0x000000; //Legacy
        let cpu_id = 0xff00; // unknown
        let revision = 0;
        let output = 0;
        output |= company_options << 7;
        output |= company_id << 7;
        output |= cpu_id << 7;
        output |= revision << 7;
        this.registerfile[Coprocessor_0_Registers.PRId] = output;
    }
    GetCycleCount() {
        return this.registerfile[Coprocessor_0_Registers.Cycle_count];
    }
    UpdateCycleCount() {
        this.registerfile[Coprocessor_0_Registers.Cycle_count] += 1;
    }
}