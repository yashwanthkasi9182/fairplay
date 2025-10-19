'use client';

import { useState } from 'react';
import { PlayerInput } from '@/components/PlayerInput';
import { MatchResults } from '@/components/MatchResults';
import { AIMatchGenerator } from '@/lib/matchGenerator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Users, Zap } from 'lucide-react';

export interface Player {
  id: string;
  name: string;
  skillLevel: number;
}

export interface Match {
  id: number;
  playersPlaying: Player[];
  teamA?: Player[];
  teamB?: Player[];
  doubleSider?: Player;
  tossWinner?: 'A' | 'B';
  playerSequence?: Player[];
  playersOut: Player[];
  mode: 'Singles' | 'Teams';
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState<'Singles' | 'Teams'>('Singles');
  const [teamSize, setTeamSize] = useState<number>(2);
  const [numberOfMatches, setNumberOfMatches] = useState<number>(1);
  const [doubleSider, setDoubleSider] = useState<boolean>(false);
  const [generatedMatches, setGeneratedMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string>('');

  const addPlayer = (name: string) => {
    if (name.trim() && !players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      const newPlayer: Player = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        skillLevel: 5 // Default skill level
      };
      setPlayers([...players, newPlayer]);
    }
  };

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const updateSkillLevel = (playerId: string, skillLevel: number) => {
    setPlayers(players.map(p => 
      p.id === playerId ? { ...p, skillLevel } : p
    ));
  };

  const addPlayersFromList = (playerList: string) => {
    const names = playerList.split(',').map(name => name.trim()).filter(name => name);
    const uniqueNames = names.filter(name => 
      name && !players.some(p => p.name.toLowerCase() === name.toLowerCase())
    );
    
    const newPlayers: Player[] = uniqueNames.map(name => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + name,
      name,
      skillLevel: 5 // Default skill level
    }));
    
    setPlayers([...players, ...newPlayers]);
  };

  const validateInputs = (): string | null => {
    if (players.length < 2) {
      return 'At least 2 players are required';
    }
    
    if (mode === 'Teams') {
      if (teamSize < 1) {
        return 'Team size must be at least 1';
      }
      const requiredPlayers = doubleSider ? (teamSize * 2) + 1 : teamSize * 2;
      if (players.length < requiredPlayers) {
        return `Need at least ${requiredPlayers} players for teams of ${teamSize}${doubleSider ? ' with double sider' : ''}`;
      }
    }
    
    if (numberOfMatches < 1) {
      return 'Number of matches must be at least 1';
    }
    
    return null;
  };

  const generateMatches = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError('');
    const generator = new AIMatchGenerator(
        players,
        mode,
        teamSize, // team size
        doubleSider, // double sider mode
        process.env.NEXT_PUBLIC_GROQ_API_KEY
      );

    const matches = await generator.generateMatches(numberOfMatches);
    setGeneratedMatches(matches);
    
    // Auto-scroll to results after a short delay
    setTimeout(() => {
      const resultsElement = document.getElementById('match-results');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const getRequiredPlayers = () => {
    if (mode === 'Singles') return 2;
    return doubleSider ? (teamSize * 2) + 1 : teamSize * 2;
  };

  const canGenerate = players.length >= getRequiredPlayers() && numberOfMatches >= 1 && teamSize >= 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FairMatch Generator
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate fair and random matches for games. No more arguments over team formation or coin tosses!
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          {/* Player Input Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Add Players
            </h2>
            <PlayerInput 
              players={players}
              onAddPlayer={addPlayer}
              onRemovePlayer={removePlayer}
              onAddPlayersFromList={addPlayersFromList}
              onUpdateSkillLevel={updateSkillLevel}
            />
          </div>

          {/* Match Configuration */}
          {players.length >= 2 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Zap className="h-6 w-6 text-purple-600" />
                Match Configuration
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="mode" className="text-sm font-medium text-gray-700">
                    Game Mode
                  </Label>
                  <Select value={mode} onValueChange={(value: 'Singles' | 'Teams') => setMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Singles">Singles (Player Sequence)</SelectItem>
                      <SelectItem value="Teams">Teams</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mode === 'Teams' && (
                  <div className="space-y-2">
                    <Label htmlFor="teamSize" className="text-sm font-medium text-gray-700">
                      Team Size
                    </Label>
                    <Input
                      id="teamSize"
                      type="number"
                      value={teamSize}
                      onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                      className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                )}

                {mode === 'Teams' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Special Options
                    </Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="doubleSider"
                        checked={doubleSider}
                        onChange={(e) => setDoubleSider(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="doubleSider" className="text-sm text-gray-700 cursor-pointer">
                        Double Sider (one player plays for both teams)
                      </Label>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="numberOfMatches" className="text-sm font-medium text-gray-700">
                    Number of Matches
                  </Label>
                  <Input
                    id="numberOfMatches"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    
                    value={numberOfMatches}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setNumberOfMatches(parseInt(value) || 1);
                    }}
                    className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {error && (
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="mt-6">
                <Button
                  onClick={generateMatches}
                  disabled={!canGenerate}
                  className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-8 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Matches
                </Button>
              </div>
            </div>
          )}

          {/* Match Results */}
          {generatedMatches.length > 0 && (
            <div id="match-results">
              <MatchResults matches={generatedMatches} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}