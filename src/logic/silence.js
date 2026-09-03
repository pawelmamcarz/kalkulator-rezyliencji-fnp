import { sigmoid } from './sigmoid.js';

export function silenceDecomposition(safety, autonomy = 0.5) {
  const defensive   = sigmoid(safety, 0.60, 0.05);
  const acquiescent = sigmoid(safety, 0.45, 0.15);
  const prosocial   = sigmoid(safety, 0.20, 0.10);

  // Adamska (2016): mechanism dimension - AUTHOR'S EXTENSION
  // automaticShare = "being silenced" (socialization-driven, below awareness)
  // tacticalShare  = "being silent" (conscious cost-benefit calculation)
  // Low safety + low autonomy → mostly automatic; high autonomy → more tactical
  const autonomyClamped = Math.max(0, Math.min(1, autonomy));
  const automaticShare = sigmoid(safety, 0.70, 0.30, 45, 0.06)
                       * (1 - 0.3 * autonomyClamped);
  const tacticalShare  = 1 - automaticShare;

  return { defensive, acquiescent, prosocial, automaticShare, tacticalShare };
}
