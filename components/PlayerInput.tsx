'use client';

import { useState } from 'react';
import { Player } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, UserPlus, Users } from 'lucide-react';

interface PlayerInputProps {
  players: Player[];
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onAddPlayersFromList: (playerList: string) => void;
  onUpdateSkillLevel: (playerId: string, skillLevel: number) => void;
}

export function PlayerInput({ 
  players, 
  onAddPlayer, 
  onRemovePlayer, 
  onAddPlayersFromList,
  onUpdateSkillLevel
}: PlayerInputProps) {
  const [playerName, setPlayerName] = useState('');
  const [playerList, setPlayerList] = useState('');
  const [inputError, setInputError] = useState('');

  const handleAddPlayer = () => {
    const trimmedName = playerName.trim();
    if (trimmedName) {
      if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        setInputError('This player name is already added');
        return;
      }
      setInputError('');
      onAddPlayer(trimmedName);
      setPlayerName('');
    }
  };

  const handleAddFromList = () => {
    if (playerList.trim()) {
      const names = playerList.split(',').map(name => name.trim()).filter(name => name);
      const duplicates = names.filter(name => 
        players.some(p => p.name.toLowerCase() === name.toLowerCase())
      );
      
      if (duplicates.length > 0) {
        setInputError(`The following names are already added: ${duplicates.join(', ')}`);
        return;
      }
      
      setInputError('');
      onAddPlayersFromList(playerList);
      setPlayerList('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPlayer();
    }
  };

  return (
    <div className="space-y-6">
      {/* Single Player Input */}
      <div className="space-y-3">
        <Label htmlFor="playerName" className="text-sm font-medium text-gray-700">
          Add Player
        </Label>
        <div className="flex gap-2">
          <Input
            id="playerName"
            type="text"
            placeholder="Enter player name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={handleAddPlayer}
            disabled={!playerName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        {inputError && (
          <p className="text-sm text-red-600 mt-1">{inputError}</p>
        )}
      </div>

      {/* Bulk Input */}
      <div className="space-y-3">
        <Label htmlFor="playerList" className="text-sm font-medium text-gray-700">
          Add Multiple Players (comma-separated)
        </Label>
        <Textarea
          id="playerList"
          placeholder="Shiva, Vishnu, Brahma"
          value={playerList}
          onChange={(e) => setPlayerList(e.target.value)}
          className="min-h-[80px] resize-none"
        />
        <Button 
          onClick={handleAddFromList}
          disabled={!playerList.trim()}
          variant="outline"
          className="w-full border-blue-200 hover:bg-blue-50"
        >
          <Users className="h-4 w-4 mr-2" />
          Add from List
        </Button>
      </div>

      {/* Player List */}
      {players.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Players ({players.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex flex-col w-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 p-3 rounded-lg border border-blue-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{player.name}</span>
                  <button
                    onClick={() => onRemovePlayer(player.id)}
                    className="flex-shrink-0 p-0.5 rounded-full hover:bg-red-200 transition-colors"
                    aria-label={`Remove ${player.name}`}
                  >
                    <X className="h-3 w-3 text-red-600" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Skill Level:</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={player.skillLevel}
                    onChange={(e) => onUpdateSkillLevel(player.id, parseInt(e.target.value))}
                    className="flex-grow h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-medium w-6">{player.skillLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}