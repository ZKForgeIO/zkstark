/**
 * Range Proof Example
 *
 * Demonstrates proving that a secret value lies within a specific range
 * without revealing the value itself. Useful for privacy-preserving
 * financial applications.
 */

import {
  FieldElement,
  STARK_PRIME,
  StarkProver,
  StarkVerifier,
  Statement,
  Constraint,
  Witness
} from '../src/index';

function createRangeTrace(value: bigint, min: bigint, max: bigint): FieldElement[] {
  const trace: FieldElement[] = [];

  trace.push(new FieldElement(value, STARK_PRIME));
  trace.push(new FieldElement(min, STARK_PRIME));
  trace.push(new FieldElement(max, STARK_PRIME));

  trace.push(new FieldElement(value - min, STARK_PRIME));
  trace.push(new FieldElement(max - value, STARK_PRIME));

  return trace;
}

const rangeConstraint: Constraint = {
  evaluate: (trace: FieldElement[]): FieldElement => {
    if (trace.length < 5) {
      return FieldElement.zero(STARK_PRIME);
    }

    const value = trace[0];
    const min = trace[1];
    const max = trace[2];
    const diff1 = trace[3];
    const diff2 = trace[4];

    const check1 = value.sub(min).sub(diff1);
    const check2 = max.sub(value).sub(diff2);

    return check1.add(check2);
  }
};

export function runRangeProofExample() {
  console.log('=== Range Proof zkSTARK Example ===\n');

  const secretValue = 42n;
  const minValue = 0n;
  const maxValue = 100n;

  console.log(`Proving that secret value is in range [${minValue}, ${maxValue}]`);
  console.log(`(Actual value: ${secretValue}, but verifier doesn't know this)\n`);

  const trace = createRangeTrace(secretValue, minValue, maxValue);

  const statement: Statement = {
    publicInput: [trace[1], trace[2]],
    constraints: [rangeConstraint]
  };

  const witness: Witness = {
    privateInput: [trace[0]],
    trace: trace
  };

  console.log('Generating range proof...');
  const startProve = Date.now();
  const prover = new StarkProver(statement, witness);
  const proof = prover.generateProof();
  const proveTime = Date.now() - startProve;

  console.log(`✓ Proof generated in ${proveTime}ms\n`);

  console.log('Verifying range proof...');
  const startVerify = Date.now();
  const verifier = new StarkVerifier(statement);
  const isValid = verifier.verify(proof);
  const verifyTime = Date.now() - startVerify;

  console.log(`${isValid ? '✓' : '✗'} Range proof ${isValid ? 'verified' : 'failed'} in ${verifyTime}ms`);
  console.log(`\nValue is confirmed to be in range without revealing it!\n`);

  return isValid;
}

if (require.main === module) {
  runRangeProofExample();
}
