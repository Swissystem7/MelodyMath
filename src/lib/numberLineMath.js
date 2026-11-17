function jumpForward(start, stepSize, numJumps) {
	return Number(start) + Number(stepSize) * Number(numJumps);
}

function jumpBackward(start, stepSize, numJumps) {
	const result = Number(start) - Number(stepSize) * Number(numJumps);
	return Math.max(result, 0);
}

function missingStepInSequence(sequence) {
	if (!Array.isArray(sequence) || sequence.length < 3) return null;
	const known = [];
	for (let i = 0; i < sequence.length; i++) {
		const v = sequence[i];
		if (v !== null && v !== undefined && Number.isFinite(Number(v))) {
			known.push({ index: i, value: Number(v) });
		}
	}
	if (known.length < 2) return null;
	let step = null;
	for (let i = 1; i < known.length; i++) {
		const gapIdx = known[i].index - known[i - 1].index;
		if (gapIdx <= 0) continue;
		const candidate = (known[i].value - known[i - 1].value) / gapIdx;
		if (Number.isFinite(candidate) && candidate !== 0) {
			step = candidate;
			break;
		}
	}
	if (step == null) return null;
	let missingIndex = -1;
	for (let i = 0; i < sequence.length; i++) {
		if (sequence[i] === null || sequence[i] === undefined) {
			missingIndex = i;
			break;
		}
	}
	if (missingIndex < 0) return null;
	const anchor = known[0];
	const missing = anchor.value + step * (missingIndex - anchor.index);
	return { step, missing, index: missingIndex };
}

function explainNumberLineJump(start, stepSize, numJumps, isForward) {
	const s = Number(start);
	const step = Number(stepSize);
	const n = Number(numJumps);
	const end = isForward ? jumpForward(s, step, n) : jumpBackward(s, step, n);
	const dir = isForward ? "קדימה" : "אחורה";
	return `מתחילים ב-${s} וקופצים ${n} קפיצות של ${step} ${dir}, מגיעים ל-${end}`;
}

module.exports = {
	jumpForward,
	jumpBackward,
	missingStepInSequence,
	explainNumberLineJump,
};
// round-17 CI nudge
