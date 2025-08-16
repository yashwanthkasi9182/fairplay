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
}

export function PlayerInput({ 
  players, 
  onAddPlayer, 
  onRemovePlayer, 
  onAddPlayersFromList 
}: PlayerInputProps) {
  const [playerName, setPlayerName] = useState('');
  const [playerList, setPlayerList] = useState('');

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      onAddPlayer(playerName);
      setPlayerName('');
    }
  };

  const handleAddFromList = () => {
    if (playerList.trim()) {
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
                className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-2 rounded-full border border-blue-200 shadow-sm"
              >
                <span className="text-sm font-medium">{player.name}</span>
                <button
                  onClick={() => onRemovePlayer(player.id)}
                  className="flex-shrink-0 p-0.5 rounded-full hover:bg-red-200 transition-colors"
                  aria-label={`Remove ${player.name}`}
                >
                  <X className="h-3 w-3 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}