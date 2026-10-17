import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pPrior, isCorrect, pTransit = 0.20, pSlip = 0.10, pGuess = 0.20 } = body;

    const prior = Math.max(0.001, Math.min(0.999, pPrior !== undefined ? pPrior : 0.10));

    // Step 1: Bayes Update conditioned on observation
    let pObs: number;
    if (isCorrect) {
      const num = prior * (1.0 - pSlip);
      const den = num + (1.0 - prior) * pGuess;
      pObs = num / (den || 0.001);
    } else {
      const num = prior * pSlip;
      const den = num + (1.0 - prior) * (1.0 - pGuess);
      pObs = num / (den || 0.001);
    }

    // Step 2: Learning Transition
    const pPosterior = pObs + (1.0 - pObs) * pTransit;
    const clampedPosterior = Number(Math.max(0.001, Math.min(0.999, pPosterior)).toFixed(4));

    return NextResponse.json({
      prior,
      posterior: clampedPosterior,
      isMastered: clampedPosterior >= 0.85,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Invalid request body' },
      { status: 400 }
    );
  }
}
