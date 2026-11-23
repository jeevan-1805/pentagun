// src/types/game.ts

// The 6 construction stages a character must go through in order
export type ConstructionStage = 'HEAD' | 'BODY' | 'HANDS' | 'LEGS' | 'FACE' | 'GUN';

// The 5 valid character box numbers
export type BoxNumber = 0 | 2 | 4 | 6 | 8;

// State of an individual character (each player has 5 of these)
export interface Character {
  boxNumber: BoxNumber;         // 0, 2, 4, 6, or 8
  stage: ConstructionStage;     // Current construction progress
  isGunComplete: boolean;       // True once the gun stage is built
  isAlive: boolean;             // False if permanently destroyed by a shot
  loadedAmmo: number;           // 0 to 3 bullets in the magazine
  reserveAmmo: number;          // Extra bullets in reserve
  isLoaded: boolean;
  hasVest: boolean;             // Protected from 1 incoming shot
}

// State of a single player
export interface Player {
  id: string;                   // Unique identifier for the player/device
  name: string;                 // Display name (e.g., "Player 1", "Player 2")
  isHost: boolean;              // True if this device is hosting the room
  isConnected: boolean;         // Connection status
  characters: Character[];      // Exactly 5 independent characters
}

// Match phase statuses
export type MatchStatus = 'WAITING' | 'PLAYING' | 'ENDED';

// The master game state maintained by the host
export interface GameState {
  status: MatchStatus;          // Current phase of the match
  players: Player[];            // List of all connected players
  currentTurnPlayerId: string;  // ID of the player whose turn it is
  currentRoll: string | null;   // The 3-digit roll for the current turn (e.g., "246")
  winnerId: string | null;      // ID of the winning player when the game ends
}

// Global configuration rules for the game
export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  RELEASE_MAX_PLAYERS: 2,       // First APK release limit
  CHARACTER_BOXES: [0, 2, 4, 6, 8] as BoxNumber[],
  MAGAZINE_CAPACITY: 3,
  VEST_COST: 5,
};