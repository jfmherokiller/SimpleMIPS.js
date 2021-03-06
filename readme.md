Simple MIPS Simulator in JavaScript (Experimental)
==================================================
<!---
This is an experimental project after taking the computer architecture course during my undergraduate study. Basically it provides a basic playground for MIPS assembly. However, only a limited set of instructions are available due to limited time:
-->
[![Build Status](https://travis-ci.org/jfmherokiller/SimpleMIPS.js.svg?branch=master)](https://travis-ci.org/jfmherokiller/SimpleMIPS.js)[![codecov](https://codecov.io/gh/jfmherokiller/SimpleMIPS.js/branch/master/graph/badge.svg)](https://codecov.io/gh/jfmherokiller/SimpleMIPS.js)

List of Currently Implemented instructions:
- **Memory access**: lb, lbu, lh, lhu, lui, lw, sb, sh, sw, mfhi, mflo, mthi, mtlo
- **Arithmetic operations**: addi, addiu, add, addu, sub, subu, slt, slti, sltu, sltiu, mult, multu, div, divu
- **Logical operations**: and, andi, or, ori, xor, xori, nor, sll, sllv, srl, sra, srlv, srav
- **Jump**: j, jr,jal,
- **Conditional branch**: beq, bne, blez, bgtz, bltz, bgez,bltzal,bgezal
- **Misc/Pseudo instructions**: nop, break, print prints, printm,b,la,popr,pushr,li
<!---
It should be noted that the detailed 5-stage pipeline implementation does not reflect any real MIPS processor. It is my own implantation for my course project, where the branching logic was put in the instruction decoding stage. The memory model is also ideal so there is no additional delay in the writeback stage.

I have implemented both the functional simulator and the pipeline simulator, both of which can be found in SimpleMIPS.js. A mini-assembler is also included. While the basic "to upper case" program works well, it is not guaranteed to be bug-free (probably lots of bugs). [jQuery](http://jquery.com/) and [Normalize.css](http://necolas.github.io/normalize.css/) was used when implementing the interface.

**IMPORTANT: Unfortunately, since I no longer work in this area, I will no longer maintain this project (so please no pull request). I released it here for anyone interested. Feel free to check the code and modify it as you wish. Have fun :)**
-->

