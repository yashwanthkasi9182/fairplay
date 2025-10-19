import { Player, Match } from '@/app/page';

interface GroqMatchResponse {
  matches: {
    matchNumber: number;
    teamA: string[]; // Player IDs
    teamB: string[]; // Player IDs
    doubleSider?: string; // Player ID
    playersOut: string[]; // Player IDs
    tossWinner?: 'A' | 'B';
    reasoning: string;
  }[];
}

export class AIMatchGenerator {
  private players: Player[];
  private mode: 'Singles' | 'Teams';
  private teamSize: number;
  private doubleSider: boolean;
  private playCount: Map<string, number>;
  private previousMatches: Match[];
  private groqApiKey: string;

  constructor(
    players: Player[],
    mode: 'Singles' | 'Teams',
    teamSize: number = 2,
    doubleSider: boolean = false,
    groqApiKey: string = process.env.NEXT_PUBLIC_GROQ_API_KEY || ''
  ) {
    this.players = players;
    this.mode = mode;
    this.teamSize = teamSize;
    this.doubleSider = doubleSider;
    this.playCount = new Map();
    this.previousMatches = [];
    this.groqApiKey = groqApiKey;

    // Initialize play count for each player
    this.players.forEach(player => {
      this.playCount.set(player.id, 0);
    });
  }

  async generateMatches(numberOfMatches: number): Promise<Match[]> {
    if (this.mode === 'Singles') {
      return this.generateSinglesMatches(numberOfMatches);
    } else {
      return this.generateTeamsMatchesWithAI(numberOfMatches);
    }
  }

  private generateSinglesMatches(numberOfMatches: number): Match[] {
    const matches: Match[] = [];
    let rotationOffset = 0;

    for (let i = 0; i < numberOfMatches; i++) {
      const rotatedPlayers = this.rotateArray([...this.players], rotationOffset);

      const match: Match = {
        id: i + 1,
        playersPlaying: rotatedPlayers,
        playerSequence: rotatedPlayers,
        playersOut: [],
        mode: this.mode
      };

      this.players.forEach(player => {
        const currentCount = this.playCount.get(player.id) || 0;
        this.playCount.set(player.id, currentCount + 1);
      });

      matches.push(match);
      this.previousMatches.push(match);
      rotationOffset = (rotationOffset + 1) % this.players.length;
    }

    return matches;
  }

  private async generateTeamsMatchesWithAI(numberOfMatches: number): Promise<Match[]> {
    try {
      const prompt = this.buildGroqPrompt(numberOfMatches);
      const groqResponse = await this.callGroqAPI(prompt);
      const matches = this.parseGroqResponse(groqResponse);
      return matches;
    } catch (error) {
      console.error('Error generating matches with AI:', error);
      // Fallback to basic generation if AI fails
      return this.generateTeamsMatchesFallback(numberOfMatches);
    }
  }

  private buildGroqPrompt(numberOfMatches: number): string {
    const playCountData = Array.from(this.playCount.entries()).map(([id, count]) => ({
      playerId: id,
      playerName: this.players.find(p => p.id === id)?.name || id,
      timesPlayed: count
    }));

    const previousMatchSummary = this.previousMatches.slice(-5).map(m => ({
      matchId: m.id,
      teamA: m.teamA?.map(p => p.id) || [],
      teamB: m.teamB?.map(p => p.id) || [],
      doubleSider: m.doubleSider?.id
    }));

    const prompt = `You are an expert sports match scheduler tasked with creating the MOST FAIR and DIVERSE team combinations possible.

# CONTEXT
Players: ${JSON.stringify(this.players.map(p => ({
  id: p.id,
  name: p.name,
  skillLevel: p.skillLevel
})), null, 2)}

Current Play Count: ${JSON.stringify(playCountData, null, 2)}

Previous Matches (last 5): ${JSON.stringify(previousMatchSummary, null, 2)}

# CONFIGURATION
- Mode: ${this.mode}
- Team Size: ${this.teamSize} players per team
- Double Sider Mode: ${this.doubleSider ? 'ENABLED (one skilled player plays on both teams)' : 'DISABLED'}
- Total Matches to Generate: ${numberOfMatches}

# YOUR MISSION: MAXIMIZE DIVERSITY & FAIRNESS

## PRIMARY OBJECTIVES (In Order of Importance):

1. **PLAYER ROTATION FAIRNESS** (CRITICAL)
   - Players with FEWER games played MUST be prioritized
   - Distribute playing time as evenly as possible across ALL matches
   - Never let the same players dominate multiple consecutive matches
   - Track cumulative play counts and balance them

2. **TEAM DIVERSITY** (CRITICAL)
   - AVOID repeating the same team compositions
   - Each match should feature DIFFERENT player combinations
   - Players who played together recently should be separated when possible
   - Create fresh, varied matchups that keep the tournament interesting

3. **SKILL BALANCE** (HIGH PRIORITY)
   - Both teams should have roughly equal total skill levels
   - Distribute high-skill and low-skill players evenly across teams
   - Aim for competitive, close matches
   - Calculate: |Avg(TeamA Skills) - Avg(TeamB Skills)| should be < 0.5 ideally

4. **DOUBLE SIDER SELECTION** (If enabled)
   - Choose the HIGHEST skilled player as the double sider
   - This player counts as playing TWICE (once for each team)
   - Ensure they're not overused compared to others

## GENERATION STRATEGY:

For EACH match:
1. Check play counts - prioritize players with lowest counts
2. Review previous 3-5 matches - avoid similar team compositions
3. Select players ensuring variety and fairness
4. Distribute by skill level for balanced teams
5. If not enough players, some sit out (choose those who played most recently)

## OUTPUT FORMAT:

You MUST respond with ONLY a valid JSON object (no markdown, no code blocks, no explanations):

{
  "matches": [
    {
      "matchNumber": 1,
      "teamA": ["player-id-1", "player-id-2"],
      "teamB": ["player-id-3", "player-id-4"],
      ${this.doubleSider ? '"doubleSider": "player-id-5",' : ''}
      "playersOut": ["player-id-6"],
      "tossWinner": "A",
      "reasoning": "Brief explanation of why this composition is fair and diverse"
    }
  ]
}

## CRITICAL RULES:

- Player IDs must EXACTLY match the IDs provided
- TeamA and TeamB must each have EXACTLY ${this.teamSize} players${this.doubleSider ? ' (plus double sider on both)' : ''}
- Double sider player (if enabled) appears in BOTH teams but listed separately
- Players sitting out should be those with highest play counts
- Every match must be UNIQUE in team composition
- tossWinner must be either "A" or "B" (random but balanced across matches)
- DO NOT output anything except the JSON object
- NO markdown code blocks, NO explanations outside the JSON

Generate ${numberOfMatches} diverse, fair, and competitive matches NOW.`;

    return prompt;
  }

  private async callGroqAPI(prompt: string): Promise<GroqMatchResponse> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Fast and capable model
        messages: [
          {
            role: 'system',
            content: 'You are a professional sports scheduling AI. You output ONLY valid JSON, never markdown or explanations. Your goal is to create the most fair, diverse, and balanced team matchups possible.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // Higher creativity for diverse combinations
        max_tokens: 4000,
        response_format: { type: 'json_object' } // Force JSON output
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Clean up any markdown artifacts
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(content);
  }

  private parseGroqResponse(groqResponse: GroqMatchResponse): Match[] {
    const matches: Match[] = [];

    for (const matchData of groqResponse.matches) {
      // Find player objects by ID
      const teamAPlayers = matchData.teamA.map(id => 
        this.players.find(p => p.id === id)!
      ).filter(Boolean);

      const teamBPlayers = matchData.teamB.map(id => 
        this.players.find(p => p.id === id)!
      ).filter(Boolean);

      const doubleSiderPlayer = matchData.doubleSider
        ? this.players.find(p => p.id === matchData.doubleSider)
        : undefined;

      const playersOutList = matchData.playersOut.map(id => 
        this.players.find(p => p.id === id)!
      ).filter(Boolean);

      // Determine all players playing (excluding duplicates for double sider)
      const playersPlayingSet = new Set([
        ...teamAPlayers,
        ...teamBPlayers
      ]);
      const playersPlaying = Array.from(playersPlayingSet);

      // Update play counts
      playersPlaying.forEach(player => {
        const currentCount = this.playCount.get(player.id) || 0;
        const increment = (this.doubleSider && player.id === doubleSiderPlayer?.id) ? 2 : 1;
        this.playCount.set(player.id, currentCount + increment);
      });

      const match: Match = {
        id: matchData.matchNumber,
        playersPlaying,
        teamA: teamAPlayers,
        teamB: teamBPlayers,
        doubleSider: doubleSiderPlayer,
        playersOut: playersOutList,
        mode: this.mode,
        tossWinner: matchData.tossWinner
      };

      matches.push(match);
      this.previousMatches.push(match);
    }

    return matches;
  }

  private generateTeamsMatchesFallback(numberOfMatches: number): Match[] {
    // Fallback to deterministic algorithm if AI fails
    const matches: Match[] = [];

    for (let i = 0; i < numberOfMatches; i++) {
      const match = this.generateSingleTeamMatch(i + 1);
      matches.push(match);
      this.previousMatches.push(match);
    }

    return matches;
  }

  private generateSingleTeamMatch(matchNumber: number): Match {
    const effectiveTeamSize = this.teamSize;
    const requiredPlayers = this.doubleSider ? (effectiveTeamSize * 2) + 1 : effectiveTeamSize * 2;

    const selectedPlayers = this.selectPlayersForMatch(requiredPlayers);

    let teamA: Player[];
    let teamB: Player[];
    let doubleSiderPlayer: Player | undefined;

    if (this.doubleSider) {
      doubleSiderPlayer = [...selectedPlayers].sort((a, b) => b.skillLevel - a.skillLevel)[0];
      const regularPlayers = selectedPlayers.filter(p => p.id !== doubleSiderPlayer!.id);
      const sortedPlayers = regularPlayers.sort((a, b) => b.skillLevel - a.skillLevel);

      teamA = [];
      teamB = [];
      sortedPlayers.forEach((player, index) => {
        if (index % 2 === 0) {
          if (teamA.length < effectiveTeamSize) teamA.push(player);
          else teamB.push(player);
        } else {
          if (teamB.length < effectiveTeamSize) teamB.push(player);
          else teamA.push(player);
        }
      });

      teamA.push(doubleSiderPlayer);
      teamB.push(doubleSiderPlayer);
    } else {
      const sortedPlayers = [...selectedPlayers].sort((a, b) => b.skillLevel - a.skillLevel);

      teamA = [];
      teamB = [];
      sortedPlayers.forEach((player, index) => {
        if (index % 2 === 0) {
          if (teamA.length < effectiveTeamSize) teamA.push(player);
          else teamB.push(player);
        } else {
          if (teamB.length < effectiveTeamSize) teamB.push(player);
          else teamA.push(player);
        }
      });
    }

    const playersOut = this.players.filter(player =>
      !selectedPlayers.some(selected => selected.id === player.id)
    );

    selectedPlayers.forEach(player => {
      const currentCount = this.playCount.get(player.id) || 0;
      const increment = (this.doubleSider && player.id === doubleSiderPlayer?.id) ? 2 : 1;
      this.playCount.set(player.id, currentCount + increment);
    });

    const match: Match = {
      id: matchNumber,
      playersPlaying: selectedPlayers,
      teamA,
      teamB,
      doubleSider: doubleSiderPlayer,
      playersOut,
      mode: this.mode,
      tossWinner: Math.random() < 0.5 ? 'A' : 'B'
    };

    return match;
  }

  private selectPlayersForMatch(requiredPlayers: number): Player[] {
    const avgSkillLevel = this.players.reduce((sum, p) => sum + p.skillLevel, 0) / this.players.length;

    const playersByFairness = [...this.players].sort((a, b) => {
      const countA = this.playCount.get(a.id) || 0;
      const countB = this.playCount.get(b.id) || 0;

      if (countA === countB) {
        const diffA = Math.abs(a.skillLevel - avgSkillLevel);
        const diffB = Math.abs(b.skillLevel - avgSkillLevel);
        return diffA - diffB;
      }

      return countA - countB;
    });

    const selectedCount = Math.min(requiredPlayers, playersByFairness.length);
    return playersByFairness.slice(0, selectedCount);
  }

  private rotateArray<T>(array: T[], offset: number): T[] {
    if (array.length === 0) return array;
    const normalizedOffset = offset % array.length;
    return [...array.slice(normalizedOffset), ...array.slice(0, normalizedOffset)];
  }
}

// Export for backward compatibility
export class MatchGenerator extends AIMatchGenerator {
  constructor(players: Player[], mode: 'Singles' | 'Teams', teamSize: number = 2, doubleSider: boolean = false) {
    super(players, mode, teamSize, doubleSider);
  }
}