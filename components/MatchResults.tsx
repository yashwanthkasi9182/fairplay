'use client';

import { Match } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface MatchResultsProps {
  matches: Match[];
}

export function MatchResults({ matches }: MatchResultsProps) {
  const [copied, setCopied] = useState(false);

  const formatMatchesText = (): string => {
    return matches.map((match, index) => {
      let text = `Match ${index + 1}: `;
      
      if (match.mode === 'Teams') {
        const teamANames = match.teamA?.map(p => p.name).join(', ') || '';
        const teamBNames = match.teamB?.map(p => p.name).join(', ') || '';
        text += `Team A (${teamANames}) vs Team B (${teamBNames})`;
        if (match.doubleSider) {
          text += `. Double Sider: ${match.doubleSider.name}`;
        }
        text += `. Toss Winner: Team ${match.tossWinner}`;
      } else {
        const sequence = match.playerSequence?.map((p, i) => `${i + 1}. ${p.name}`).join(', ') || '';
        text += `Player Sequence: ${sequence}`;
      }
      
      if (match.playersOut.length > 0) {
        text += `. Sitting Out: ${match.playersOut.map(p => p.name).join(', ')}`;
      }
      
      return text;
    }).join('\n\n');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatMatchesText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(formatMatchesText());
    window.open(`https://web.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShare = async () => {
    const text = formatMatchesText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FairMatch Generator Results',
          text: text
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Generated Matches ({matches.length})
        </h2>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={copyToClipboard}
            variant="outline" 
            size="sm"
            className="text-gray-600 hover:text-gray-800"
          >
            <Copy className="h-4 w-4 mr-1" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          
          <Button 
            onClick={shareViaWhatsApp}
            variant="outline" 
            size="sm"
            className="text-green-600 hover:text-green-700 border-green-200"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            WhatsApp
          </Button>
          
          <Button 
            onClick={handleShare}
            variant="outline" 
            size="sm"
            className="text-blue-600 hover:text-blue-700 border-blue-200"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {matches.map((match, index) => (
          <Card key={index} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-2">
                Match {index + 1}
                <Badge variant="outline" className="ml-auto">
                  {match.mode}
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Teams/Players */}
              <div className="space-y-3">
                {match.mode === 'Teams' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">Team A</h4>
                      <div className="flex flex-wrap gap-1">
                        {match.teamA?.filter(p => p.id !== match.doubleSider?.id).map((player) => (
                          <Badge key={player.id} variant="secondary" className="bg-blue-100 text-blue-800">
                            {player.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <h4 className="font-medium text-red-800 mb-2">Team B</h4>
                      <div className="flex flex-wrap gap-1">
                        {match.teamB?.filter(p => p.id !== match.doubleSider?.id).map((player) => (
                          <Badge key={player.id} variant="secondary" className="bg-red-100 text-red-800">
                            {player.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    </div>
                    
                    {/* Double Sider Display */}
                    {match.doubleSider && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                        <h4 className="font-medium text-yellow-800 mb-2 text-center">Double Sider (Plays for Both Teams)</h4>
                        <div className="flex justify-center">
                          <Badge variant="secondary" className="bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800">
                            {match.doubleSider.name}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-800 mb-3 text-center">Player Sequence</h4>
                    <div className="flex flex-wrap justify-center gap-2">
                      {match.playerSequence?.map((player, index) => (
                        <div key={player.id} className="flex items-center gap-1">
                          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1">
                            {index + 1}. {player.name}
                          </Badge>
                          {index < (match.playerSequence?.length || 0) - 1 && (
                            <span className="text-gray-400">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Toss Winner (Teams only) */}
              {match.mode === 'Teams' && (
                <div className="flex items-center justify-center">
                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800">
                    Toss Winner: Team {match.tossWinner}
                  </Badge>
                </div>
              )}

              {/* Sitting Out */}
              {match.playersOut.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-2">Sitting Out</h4>
                  <div className="flex flex-wrap gap-1">
                    {match.playersOut.map((player) => (
                      <Badge key={player.id} variant="secondary" className="bg-gray-200 text-gray-700">
                        {player.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}