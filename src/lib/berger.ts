export interface BergerMatch {
  p1Idx: number; // 0-based index in the sorted players array
  p2Idx: number;
}

export interface BergerRound {
  round: number;
  matches: BergerMatch[];
}

/**
 * Generates a round-robin schedule using the Berger Table (Circle Method).
 * Ensures that if players are seeded by index (0, 1, 2...), the match 
 * between 0 and 1 occurs in the final round.
 * 
 * @param n Number of participants
 * @returns Array of rounds with their corresponding matches
 */
export function generateBergerSchedule(n: number): BergerRound[] {
  if (n < 2) return [];

  const schedule: BergerRound[] = [];
  const players = Array.from({ length: n }, (_, i) => i);
  
  // If odd, add a dummy player (-1 represents BYE)
  if (n % 2 !== 0) {
    players.push(-1);
  }
  
  const nPrime = players.length;
  const numRounds = nPrime - 1;
  const matchesPerRound = nPrime / 2;
  
  const currentPlayers = [...players];
  
  for (let r = 0; r < numRounds; r++) {
    const roundMatches: BergerMatch[] = [];
    for (let i = 0; i < matchesPerRound; i++) {
        const p1 = currentPlayers[i];
        const p2 = currentPlayers[nPrime - 1 - i];
        
        // Only add matches between real players
        if (p1 !== -1 && p2 !== -1) {
            roundMatches.push({ p1Idx: p1, p2Idx: p2 });
        }
    }
    
    // In ITTF standards, we sometimes want to reverse the order of rounds 
    // or matches so that 1 vs 2 is the very last match.
    // The current rotation already puts 1 vs 2 in the last round if 1 is players[0] and 2 is players[1].
    schedule.push({ round: r + 1, matches: roundMatches });
    
    // Rotate: keep index 0 fixed, move last to index 1, shift others
    const last = currentPlayers.pop()!;
    currentPlayers.splice(1, 0, last);
  }
  
  return schedule;
}
