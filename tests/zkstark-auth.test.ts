// tests/zkstark-auth.test.ts
import {
  createField,
  authHash,
  Statement,
  Witness,
  AuthParams,
  StarkProver,
  StarkVerifier,
  buildAuthTrace
} from '../src';

describe('zkSTARK-style auth prototype', () => {
  it('accepts a valid auth proof for the correct secret', () => {
    const secret = createField(123456789n);

    const params: AuthParams = {
      steps: 16,
      queries: 5
    };

    // Build trace and derive the public value the backend would store
    const trace = buildAuthTrace({ secret }, params);
    const finalHash = trace[params.steps - 1];

    const statement: Statement = {
      steps: params.steps,
      finalHash
    };

    const witness: Witness = { secret };

    const prover = new StarkProver(statement, witness, params);
    const proof = prover.generateProof();

    const verifier = new StarkVerifier(statement, params);
    expect(verifier.verify(proof)).toBe(true);
  });

  it('rejects a proof if the public finalHash is tampered', () => {
    const secret = createField(42n);

    const params: AuthParams = {
      steps: 16,
      queries: 5
    };

    const trace = buildAuthTrace({ secret }, params);
    const finalHash = trace[params.steps - 1];

    const statement: Statement = {
      steps: params.steps,
      finalHash
    };

    const witness: Witness = { secret };

    const prover = new StarkProver(statement, witness, params);
    const proof = prover.generateProof();

    // Tamper with the final hash in the statement
    const wrongStatement: Statement = {
      steps: params.steps,
      finalHash: authHash(finalHash)
    };

    const verifier = new StarkVerifier(wrongStatement, params);
    expect(verifier.verify(proof)).toBe(false);
  });
});
