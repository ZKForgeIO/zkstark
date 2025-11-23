/**
 * Fibonacci Sequence Example
 *
 * Demonstrates zkSTARK proof generation and verification for a Fibonacci
 * sequence computation. Proves knowledge of the sequence without revealing it.
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

function fibonacciTrace(n: number): FieldElement[] {
  const trace: FieldElement[] = [];
  trace.push(new FieldElement(0n, STARK_PRIME));
  trace.push(new FieldElement(1n, STARK_PRIME));

  for (let i = 2; i < n; i++) {
    const next = trace[i - 1].add(trace[i - 2]);
    trace.push(next);
  }

  return trace;
}

const fibonacciConstraint: Constraint = {
  evaluate: (trace: FieldElement[]): FieldElement => {
    if (trace.length < 3) {
      return FieldElement.zero(STARK_PRIME);
    }

    const expected = trace[0].add(trace[1]);
    return trace[2].sub(expected);
  }
};

export function runFibonacciExample() {
  console.log('=== Fibonacci zkSTARK Example ===\n');

  const traceLength = 16;
  console.log(`Computing Fibonacci sequence of length ${traceLength}...`);

  const trace = fibonacciTrace(traceLength);

  console.log('First few values:', trace.slice(0, 5).map(f => f.value.toString()).join(', '));
  console.log(`Last value: ${trace[trace.length - 1].value}\n`);

  const statement: Statement = {
    publicInput: [trace[0], trace[trace.length - 1]],
    constraints: [fibonacciConstraint]
  };

  const witness: Witness = {
    privateInput: [],
    trace: trace
  };

  console.log('Generating zkSTARK proof...');
  const startProve = Date.now();
  const prover = new StarkProver(statement, witness);
  const proof = prover.generateProof();
  const proveTime = Date.now() - startProve;

  console.log(`✓ Proof generated in ${proveTime}ms`);
  console.log(`  - Commitment: ${Buffer.from(proof.commitment).toString('hex').slice(0, 16)}...`);
  console.log(`  - Queries: ${proof.queryIndices.length}`);
  console.log(`  - FRI layers: ${proof.friCommitments.length}\n`);

  console.log('Verifying proof...');
  const startVerify = Date.now();
  const verifier = new StarkVerifier(statement);
  const isValid = verifier.verify(proof);
  const verifyTime = Date.now() - startVerify;

  console.log(`${isValid ? '✓' : '✗'} Proof ${isValid ? 'verified' : 'failed'} in ${verifyTime}ms`);

  const proofSize = verifier.getProofSize(proof);
  const complexity = verifier.getVerificationComplexity(proof);

  console.log(`\nProof Statistics:`);
  console.log(`  - Size: ${(proofSize / 1024).toFixed(2)} KB`);
  console.log(`  - Complexity: ${complexity}`);
  console.log(`  - Security: ${Math.log2(STARK_PRIME).toFixed(0)} bits\n`);

  return isValid;
}

if (require.main === module) {
  runFibonacciExample();
}
