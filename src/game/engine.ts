// src/game/engine.ts
import { Character, ConstructionStage, GAME_CONFIG, GameState, Player, BoxNumber } from '../types/game';

// The ordered sequence of construction stages
const STAGE_ORDER: ConstructionStage[] = ['HEAD', 'BODY', 'HANDS', 'LEGS', 'FACE', 'GUN'];

/**
 * Creates the 5 independent characters for a player starting at 'HEAD'.
 */
export function createInitialCharacters(): Character[] {
  return GAME_CONFIG.CHARACTER_BOXES.map((boxNumber) => ({
    boxNumber,
    stage: 'HEAD',
    isGunComplete: false,
    isAlive: true,
    loadedAmmo: 0,
    reserveAmmo: 0,
    isLoaded: false,
    hasVest: false,
  }));
}

/**
 * Initializes a new match with the given player names.
 */
export function initializeGame(playerNames: string[]): GameState {
  const players: Player[] = playerNames.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    isHost: index === 0,
    isConnected: true,
    characters: createInitialCharacters(),
  }));

  return {
    status: 'PLAYING',
    players,
    currentTurnPlayerId: players[0].id,
    currentRoll: null,
    winnerId: null,
  };
}

/**
 * Processes a single matching digit opportunity for a character:
 * - If construction is ongoing, advances to the next stage.
 * - If the Gun stage is complete, collects ammunition according to our rules.
 */
export function processCharacterOpportunity(character: Character): void {
  if (!character.isAlive) return;

  if (!character.isGunComplete) {
    const currentIndex = STAGE_ORDER.indexOf(character.stage);
    if (currentIndex < STAGE_ORDER.length - 1) {
      character.stage = STAGE_ORDER[currentIndex + 1];
      if (character.stage === 'GUN') {
        character.isGunComplete = true;
      }
    }
  } else {
    // If magazine is already loaded/locked in (isLoaded === true),
    // any additional ammo collected goes strictly to reserve so the 3-shot cycle isn't broken.
    if (character.isLoaded) {
      character.reserveAmmo += 1;
      return;
    }

    // Ammunition collection rule while unloaded (isLoaded === false):
    // If magazine isn't full and reserve is 0, load directly. Otherwise, put in reserve.
    if (character.loadedAmmo < GAME_CONFIG.MAGAZINE_CAPACITY && character.reserveAmmo === 0) {
      character.loadedAmmo += 1;
      if (character.loadedAmmo === GAME_CONFIG.MAGAZINE_CAPACITY) {
        character.isLoaded = true;
      }
    } else {
      character.reserveAmmo += 1;
    }
  }
}
/**
 * Reloads a character's gun:
 * - Magazine must be completely empty (loaded === 0)
 * - Must have at least 3 bullets in reserve
 */
export function reloadCharacter(character: Character): boolean {
  if (!character.isAlive || !character.isGunComplete) return false;

  if (character.loadedAmmo === 0 && character.reserveAmmo >= 3) {
    character.isLoaded = true;
    character.reserveAmmo -= 3;
    character.loadedAmmo += 3;
    return true;
  }
  return false;
}

/**
 * Checks if a player has lost all 5 characters.
 */
export function isPlayerEliminated(player: Player): boolean {
  player.characters.forEach(char => {
    // Ensure TypeScript knows we check status
  });
  return player.characters.every((char) => !char.isAlive);
}

/**
 * Checks if only one player remains alive. Returns winner ID or null.
 */
export function checkWinner(state: GameState): string | null {
  const alivePlayers = state.players.filter((p) => !isPlayerEliminated(p));
  if (alivePlayers.length === 1) {
    return alivePlayers[0].id;
  }
  return null;
}