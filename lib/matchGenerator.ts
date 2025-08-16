import { Player, Match } from '@/app/page';

export class MatchGenerator {
  private players: Player[];
  private mode: 'Singles' | 'Teams';
  private teamSize: number;
  private doubleSider: boolean;
  private playCount: Map<string, number>;

  constructor(players: Player[], mode: 'Singles' | 'Teams', teamSize: number = 2, doubleSider: boolean = false) {
    this.players = players;
    this.mode = mode;
    this.teamSize = teamSize;
    this.doubleSider = doubleSider;
    this.playCount = new Map();
    
    // Initialize play count for each player
    this.players.forEach(player => {
      this.playCount.set(player.id, 0);
    });
  }

  generateMatches(numberOfMatches: number): Match[] {
    const matches: Match[] = [];
    
    // For Singles mode, we need to track the rotation offset
    let rotationOffset = 0;
    
    for (let i = 0; i < numberOfMatches; i++) {
      const match = this.generateSingleMatch(i + 1, rotationOffset);
      matches.push(match);
      
      // For Singles mode, increment rotation offset for next match
      if (this.mode === 'Singles') {
        rotationOffset = (rotationOffset + 1) % this.players.length;
      }
    }
    
    return matches;
  }

  private generateSingleMatch(matchNumber: number, rotationOffset: number = 0): Match {
    if (this.mode === 'Singles') {
      return this.generateSinglesMatch(matchNumber, rotationOffset);
    } else {
      return this.generateTeamsMatch(matchNumber);
    }
  }

  private generateSinglesMatch(matchNumber: number, rotationOffset: number): Match {
    // For Singles mode, create a rotated sequence of all players
    const rotatedPlayers = this.rotateArray([...this.players], rotationOffset);
    
    const match: Match = {
      id: matchNumber,
      playersPlaying: rotatedPlayers,
      playerSequence: rotatedPlayers,
      playersOut: [], // No one sits out in singles mode
      mode: this.mode
    };
    
    // Update play count for all players (since everyone plays in singles)
    this.players.forEach(player => {
      const currentCount = this.playCount.get(player.id) || 0;
      this.playCount.set(player.id, currentCount + 1);
    });
    
    return match;
  }

  private generateTeamsMatch(matchNumber: number): Match {
    const effectiveTeamSize = this.teamSize;
    const requiredPlayers = this.doubleSider ? (effectiveTeamSize * 2) + 1 : effectiveTeamSize * 2;
    
    // Get players sorted by play count (fairness priority)
    const selectedPlayers = this.selectPlayersForMatch(requiredPlayers);
    
    // Randomly shuffle selected players
    const shuffledPlayers = this.shuffleArray([...selectedPlayers]);
    
    let teamA: Player[];
    let teamB: Player[];
    let doubleSiderPlayer: Player | undefined;
    
    if (this.doubleSider) {
      // Last player is the double sider
      doubleSiderPlayer = shuffledPlayers[shuffledPlayers.length - 1];
      const regularPlayers = shuffledPlayers.slice(0, -1);
      
      // Split regular players into teams
      teamA = regularPlayers.slice(0, effectiveTeamSize);
      teamB = regularPlayers.slice(effectiveTeamSize);
      
      // Add double sider to both teams
      teamA.push(doubleSiderPlayer);
      teamB.push(doubleSiderPlayer);
    } else {
      // Normal team split
      teamA = shuffledPlayers.slice(0, effectiveTeamSize);
      teamB = shuffledPlayers.slice(effectiveTeamSize, requiredPlayers);
    }
    
    // Players sitting out
    const playersOut = this.players.filter(player => 
      !selectedPlayers.some(selected => selected.id === player.id)
    );
    
    // Update play count
    selectedPlayers.forEach(player => {
      const currentCount = this.playCount.get(player.id) || 0;
      // Double sider gets +2 since they play for both teams
      const increment = (this.doubleSider && player.id === doubleSiderPlayer?.id) ? 2 : 1;
      this.playCount.set(player.id, currentCount + increment);
    });
    
    // Generate match result
    const match: Match = {
      id: matchNumber,
      playersPlaying: selectedPlayers,
      teamA,
      teamB,
      doubleSider: doubleSiderPlayer,
      playersOut,
      mode: this.mode
    };
    
    // Random toss winner for teams
    match.tossWinner = Math.random() < 0.5 ? 'A' : 'B';
    
    return match;
  }

  private selectPlayersForMatch(requiredPlayers: number): Player[] {
    // Sort players by play count (ascending - those who played less first)
    const playersByPlayCount = [...this.players].sort((a, b) => {
      const countA = this.playCount.get(a.id) || 0;
      const countB = this.playCount.get(b.id) || 0;
      
      if (countA === countB) {
        // If same play count, random order for fairness
        return Math.random() - 0.5;
      }
      
      return countA - countB;
    });
    
    // Take the required number of players, or all if not enough
    const selectedCount = Math.min(requiredPlayers, playersByPlayCount.length);
    return playersByPlayCount.slice(0, selectedCount);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private rotateArray<T>(array: T[], offset: number): T[] {
    if (array.length === 0) return array;
    const normalizedOffset = offset % array.length;
    return [...array.slice(normalizedOffset), ...array.slice(0, normalizedOffset)];
  }
}