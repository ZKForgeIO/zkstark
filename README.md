# ZKForge zkSTARK

A TypeScript implementation of a **zkSTARK-style, transparent, hash-based argument of knowledge** specialized for **user authentication**.


---

## Installation

```bash
npm install @zkforge/zkstark
```

## Overview

This library implements a STARK-style argument for a very specific statement:

> “I know a secret `s` such that, if you iteratively apply a field hash `H` to `s` for `steps` rounds, the final value equals a stored public commitment `Y`.”

Formally:

- Work in a prime field **Fₚ** (`STARK_PRIME`).
- Define a simple algebraic hash:
  - `H(x) = x³ + 7 (mod p)` (toy hash, *not* a real crypto hash).
- Build a **hash chain** (trace):

```text
t[0]   = H(s)
t[i+1] = H(t[i])    for i = 0..steps-2
Y      = t[steps-1] (public commitment stored by the server)
```

## Usage

Here is a complete example of how to generate and verify a proof for a Fibonacci sequence:

```typescript
import {
  FieldElement,
  STARK_PRIME,
  StarkProver,
  StarkVerifier,
  Statement,
  Constraint,
  Witness
} from '@zkforge/zkstark';

// 1. Define the trace generation (Fibonacci)
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

// 2. Define the constraint
const fibonacciConstraint: Constraint = {
  evaluate: (trace: FieldElement[]): FieldElement => {
    if (trace.length < 3) return FieldElement.zero(STARK_PRIME);
    const expected = trace[0].add(trace[1]);
    return trace[2].sub(expected);
  }
};

// 3. Setup Statement and Witness
const traceLength = 16;
const trace = fibonacciTrace(traceLength);
const statement: Statement = {
  publicInput: [trace[0], trace[trace.length - 1]],
  constraints: [fibonacciConstraint]
};
const witness: Witness = { privateInput: [], trace: trace };

// 4. Generate Proof
const prover = new StarkProver(statement, witness);
const proof = prover.generateProof();
console.log('Proof generated!');

// 5. Verify Proof
const verifier = new StarkVerifier(statement);
const isValid = verifier.verify(proof);
console.log(`Proof verified: ${isValid}`);
```

## Testing

Run the test suite using:

```bash
npm run test
```

Expected output:

```text
> @zkforge/zkstark@1.0.0 test
> jest --config jest.config.cjs

 PASS  tests/zkstark-auth.test.ts
  zkSTARK-style auth prototype
    ✓ accepts a valid auth proof for the correct secret (15 ms)
    ✓ rejects a proof if the public finalHash is tampered (3 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        2.499 s, estimated 3 s
Ran all test suites.
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
