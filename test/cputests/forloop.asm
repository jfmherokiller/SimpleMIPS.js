.text
	addi $sp,$sp,-424
	sw	$fp,420($sp)
	add	$fp,$zero,$sp
	sw	$0,8($fp)
	beq $r0, $r0,L2
	add	$31,$31,$0
	nop

L3:
	lw	$2,8($fp)
	nop
	sll	$2,$2,2
	addiu	$3,$fp,8
	addu	$2,$3,$2
	li	$3,255			# 0xff
	sw	$3,8($2)
	lw	$2,8($fp)
	nop
	addiu	$2,$2,1
	sw	$2,8($fp)
L2:
	lw	$2,8($fp)
	nop
	slti	$2,$2,100
	bne	$2,$0,L3
	nop

	lw	$2,16($fp)
	nop
	sw	$2,12($fp)
	lw	$2,12($fp)
	add $sp,$zero,$fp
	lw	$fp,420($sp)
	addiu	$sp,$sp,424
	jr	$31
	nop
