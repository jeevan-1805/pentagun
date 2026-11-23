// src/app/game.tsx
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Shield,
  Zap,
  RotateCcw,
  ArrowLeft,
  Award,
  Crosshair,
  Flame,
  Skull,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GameState, Character, BoxNumber, GAME_CONFIG } from '@/types/game';
import {
  initializeGame,
  processCharacterOpportunity,
  reloadCharacter,
  checkWinner,
  isPlayerEliminated,
} from '@/game/engine';

// Future-ready hook point:
// Later, localDevicePlayerId will come from the network/session layer (e.g., "player-1" or "player-2").
// For local single-device preview testing before networking is wired up, null treats the active turn player as local.
const LOCAL_DEVICE_PLAYER_ID: string | null = null;

export default function GameScreen() {
  const [gameState, setGameState] = useState<GameState>(() =>
    initializeGame(['Player 1', 'Player 2'])
  );

  const [turnMessage, setTurnMessage] = useState<string>('Tap "Roll 3 Digits" to begin your turn!');

  // Scoped strictly to the player who rolled on the current turn
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);
  const [highlightedBoxes, setHighlightedBoxes] = useState<BoxNumber[]>([]);

  // Pending Shoot vs. Gain Ammo choices (only created when a rolled GUN character has loadedAmmo === 3)
  const [pendingChoiceBoxes, setPendingChoiceBoxes] = useState<BoxNumber[]>([]);
  const [activeShooterBox, setActiveShooterBox] = useState<BoxNumber | null>(null);
  const [isTargetingMode, setIsTargetingMode] = useState<boolean>(false);

  // Bottom vest purchase flow state
  const [isVestDrawerOpen, setIsVestDrawerOpen] = useState<boolean>(false);
  const [selectedVestRecipient, setSelectedVestRecipient] = useState<BoxNumber | null>(null);

  const currentPlayer =
    gameState.players.find((p) => p.id === gameState.currentTurnPlayerId) || gameState.players[0];

  const opponentPlayer =
    gameState.players.find((p) => p.id !== currentPlayer.id) || gameState.players[1];

  // Perspective player for UI visibility (local device player if set, otherwise active turn player)
  const viewerPlayerId = LOCAL_DEVICE_PLAYER_ID ?? currentPlayer.id;
  const isLocalTurn =
    gameState.status === 'PLAYING' &&
    (LOCAL_DEVICE_PLAYER_ID === null || LOCAL_DEVICE_PLAYER_ID === currentPlayer.id);

  const specialRolls = ['000', '222', '444', '666', '888'];
  const isSpecialRoll = Boolean(gameState.currentRoll && specialRolls.includes(gameState.currentRoll));

  const getGlobalBullets = (player: typeof currentPlayer): number => {
    return player.characters.reduce(
      (sum, c) => (c.isAlive ? sum + c.loadedAmmo + c.reserveAmmo : sum),
      0
    );
  };

  const clearTurnHighlightsAndChoices = () => {
    setHighlightedPlayerId(null);
    setHighlightedBoxes([]);
    setPendingChoiceBoxes([]);
    setActiveShooterBox(null);
    setIsTargetingMode(false);
    setIsVestDrawerOpen(false);
    setSelectedVestRecipient(null);
  };

  const advanceTurn = (playersState: typeof gameState.players) => {
    const alivePlayers = playersState.filter((p) => !isPlayerEliminated(p));
    if (alivePlayers.length === 0) return;

    const currentIndex = playersState.findIndex((p) => p.id === gameState.currentTurnPlayerId);
    let nextIndex = (currentIndex + 1) % playersState.length;

    // Skip eliminated players
    while (isPlayerEliminated(playersState[nextIndex])) {
      nextIndex = (nextIndex + 1) % playersState.length;
    }

    const nextPlayer = playersState[nextIndex];
    clearTurnHighlightsAndChoices();

    setGameState((prev) => ({
      ...prev,
      players: playersState,
      currentTurnPlayerId: nextPlayer.id,
    }));
    setTurnMessage(`${nextPlayer.name}'s turn. Tap Roll!`);
  };

  // 1. Mandatory 3-Digit Roll
  const handleRoll = () => {
    if (!isLocalTurn || gameState.status !== 'PLAYING') return;

    clearTurnHighlightsAndChoices();

    const rollNum = Math.floor(Math.random() * 1000);
    const rollStr = rollNum.toString().padStart(3, '0');
    const digits = rollStr.split('').map((d) => parseInt(d, 10) as BoxNumber);

    // Highlight ONLY for the player taking this turn
    setHighlightedPlayerId(currentPlayer.id);
    setHighlightedBoxes(digits);

    const updatedPlayers = JSON.parse(
      JSON.stringify(gameState.players)
    ) as typeof gameState.players;
    const activePlayer = updatedPlayers.find((p) => p.id === currentPlayer.id)!;

    const choicesNeeded: BoxNumber[] = [];
    let logSummary = `Rolled ${rollStr}: `;

    digits.forEach((digit) => {
      const character = activePlayer.characters.find((c: Character) => c.boxNumber === digit);

      if (!character || !character.isAlive) {
        logSummary += `Box ${digit} ignored. `;
        return;
      }

      if (!character.isGunComplete) {
        // Construction stage progression
        processCharacterOpportunity(character);
        logSummary += `Box ${digit} -> ${character.stage}. `;
      } else if (character.isLoaded && character.loadedAmmo > 0) {
        // Magazine is full (3/3): pause turn and let player choose Shoot or Gain Ammo
        if (!choicesNeeded.includes(digit)) {
          choicesNeeded.push(digit);
        }
        logSummary += `Box ${digit} full mag (3/3) - choose action. `;
      } else {
        // Gun is complete and loadedAmmo < 3: apply ammunition collection rule directly
        // (loaded < 3 && reserve === 0 -> loaded += 1; else reserve += 1)
        processCharacterOpportunity(character);
        logSummary += `Box ${digit} gained ammo (Mag ${character.loadedAmmo}/3, Res ${character.reserveAmmo}). `;
      }
    });

    setTurnMessage(logSummary);
    setGameState((prev) => ({
      ...prev,
      currentRoll: rollStr,
      players: updatedPlayers,
    }));

    if (choicesNeeded.length > 0) {
      setPendingChoiceBoxes(choicesNeeded);
      return;
    }

    // Briefly highlight the rolled boxes on the active player's column before passing turn
    setTimeout(() => {
      setHighlightedPlayerId(null);
      setHighlightedBoxes([]);
      advanceTurn(updatedPlayers);
    }, 1200);
  };

  // Resolve a pending choice box and advance turn once all choices for the roll are resolved
  const resolveChoiceAndMaybeAdvance = (
    boxNumber: BoxNumber,
    playersState: typeof gameState.players,
    nextMessage: string
  ) => {
    const remainingChoices = pendingChoiceBoxes.filter((b) => b !== boxNumber);
    setPendingChoiceBoxes(remainingChoices);
    setActiveShooterBox(null);
    setIsTargetingMode(false);
    setTurnMessage(nextMessage);

    if (remainingChoices.length > 0) {
      setGameState((prev) => ({ ...prev, players: playersState }));
      return;
    }

    setHighlightedPlayerId(null);
    setHighlightedBoxes([]);
    advanceTurn(playersState);
  };

  // 2. Choice Option A: Gain Ammo
  const handleGainAmmo = (boxNumber: BoxNumber) => {
    if (!isLocalTurn) return;

    const updatedPlayers = JSON.parse(
      JSON.stringify(gameState.players)
    ) as typeof gameState.players;
    const activePlayer = updatedPlayers.find((p) => p.id === currentPlayer.id)!;
    const character = activePlayer.characters.find((c) => c.boxNumber === boxNumber)!;

    if (character.isLoaded) {
      character.reserveAmmo += 1;
    } else {
      processCharacterOpportunity(character);
    }

    resolveChoiceAndMaybeAdvance(
      boxNumber,
      updatedPlayers,
      `Box ${boxNumber} gained ammo (Mag ${character.loadedAmmo}/3, Res ${character.reserveAmmo}).`
    );
  };

  // 3. Choice Option B: Enter Target Selection Mode for this Shooter Box
  const handleStartShootForBox = (boxNumber: BoxNumber) => {
    if (!isLocalTurn) return;

    setActiveShooterBox(boxNumber);
    setIsTargetingMode(true);
    setTurnMessage(`Box ${boxNumber} ready to fire! Tap a surviving opponent box to shoot.`);
  };

  // 4. Fire at Selected Opponent Box
  const handleShootTarget = (targetBoxNumber: BoxNumber) => {
    if (!isLocalTurn || !isTargetingMode || activeShooterBox === null) return;

    const updatedPlayers = JSON.parse(
      JSON.stringify(gameState.players)
    ) as typeof gameState.players;
    const activePlayer = updatedPlayers.find((p) => p.id === currentPlayer.id)!;
    const shooter = activePlayer.characters.find((c) => c.boxNumber === activeShooterBox)!;

    const targetPlayer = updatedPlayers.find((p) => p.id === opponentPlayer.id)!;
    const target = targetPlayer.characters.find((c) => c.boxNumber === targetBoxNumber)!;

    if (!shooter || !shooter.isAlive || shooter.loadedAmmo <= 0) {
      Alert.alert('Cannot Shoot', 'Selected character has no loaded ammunition.');
      return;
    }

    if (!target || !target.isAlive) {
      Alert.alert('Invalid Target', 'Choose a surviving opponent character.');
      return;
    }

    shooter.loadedAmmo -= 1;
    if (shooter.loadedAmmo <= 0) {
      shooter.loadedAmmo = 0;
      shooter.isLoaded = false;
    }

    let resultMsg = '';
    if (target.hasVest) {
      target.hasVest = false;
      resultMsg = `Box ${activeShooterBox} shot Box ${targetBoxNumber} — vest absorbed the hit!`;
    } else {
      target.isAlive = false;
      target.loadedAmmo = 0;
      target.reserveAmmo = 0;
      target.hasVest = false;
      resultMsg = `Box ${activeShooterBox} destroyed ${targetPlayer.name}'s Box ${targetBoxNumber}!`;
    }

    const tempState: GameState = { ...gameState, players: updatedPlayers };
    const winnerId = checkWinner(tempState);

    if (winnerId) {
      const winner = updatedPlayers.find((p) => p.id === winnerId);
      clearTurnHighlightsAndChoices();
      setGameState({
        ...tempState,
        status: 'ENDED',
        winnerId,
      });
      Alert.alert('Victory!', `${winner?.name} won the match!`);
      return;
    }

    resolveChoiceAndMaybeAdvance(activeShooterBox, updatedPlayers, resultMsg);
  };

  // 5. Reload Empty Magazine (loaded === 0 and reserve >= 3)
  const handleReload = (boxNumber: BoxNumber) => {
    if (!isLocalTurn) return;

    const updatedPlayers = JSON.parse(
      JSON.stringify(gameState.players)
    ) as typeof gameState.players;
    const activePlayer = updatedPlayers.find((p) => p.id === currentPlayer.id)!;
    const character = activePlayer.characters.find((c) => c.boxNumber === boxNumber)!;

    if (reloadCharacter(character)) {
      setGameState((prev) => ({ ...prev, players: updatedPlayers }));
      setTurnMessage(`Box ${boxNumber} reloaded 3 bullets into the magazine.`);
    } else {
      Alert.alert(
        'Cannot Reload',
        'Magazine must be empty (0) and reserve must have at least 3 bullets.'
      );
    }
  };

  // 6. Purchase Vest (Cost: 5 bullets, consumes turn)
  const handleConfirmBuyVest = () => {
    if (!isLocalTurn || selectedVestRecipient === null) return;

    const updatedPlayers = JSON.parse(
      JSON.stringify(gameState.players)
    ) as typeof gameState.players;
    const activePlayer = updatedPlayers.find((p) => p.id === currentPlayer.id)!;
    const recipient = activePlayer.characters.find((c) => c.boxNumber === selectedVestRecipient);

    if (!recipient || !recipient.isAlive) {
      Alert.alert('Invalid Recipient', 'Select a surviving character.');
      return;
    }

    if (recipient.hasVest) {
      Alert.alert('Already Protected', 'This character already has a vest.');
      return;
    }

    if (getGlobalBullets(activePlayer) < GAME_CONFIG.VEST_COST) {
      Alert.alert('Insufficient Ammo', 'You need at least 5 bullets across your characters.');
      return;
    }

    let remainingCost = GAME_CONFIG.VEST_COST;
    for (const char of activePlayer.characters) {
      if (!char.isAlive) continue;
      while (remainingCost > 0 && char.reserveAmmo > 0) {
        char.reserveAmmo -= 1;
        remainingCost -= 1;
      }
      while (remainingCost > 0 && char.loadedAmmo > 0) {
        char.loadedAmmo -= 1;
        remainingCost -= 1;
      }
    }

    recipient.hasVest = true;
    setTurnMessage(
      `Vest equipped on Box ${selectedVestRecipient}! Buying a vest ends ${currentPlayer.name}'s turn.`
    );
    advanceTurn(updatedPlayers);
  };

  const canBuyVest =
    isLocalTurn &&
    pendingChoiceBoxes.length === 0 &&
    !isTargetingMode &&
    getGlobalBullets(currentPlayer) >= GAME_CONFIG.VEST_COST &&
    currentPlayer.characters.some((c) => c.isAlive && !c.hasVest);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={20} color="#333" />
            <ThemedText style={styles.backText}>Exit</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.turnIndicator}>
            Turn: <ThemedText style={styles.boldText}>{currentPlayer.name}</ThemedText>
          </ThemedText>
        </View>

        {/* Central 3-Digit Roll Display */}
        <View style={[styles.rollContainer, isSpecialRoll && styles.specialRollGlow]}>
          <View style={styles.rollHeader}>
            <Flame size={18} color={isSpecialRoll ? '#D97706' : '#E63946'} />
            <ThemedText style={styles.rollTitle}>
              {isSpecialRoll ? 'SPECIAL ROLL' : '3-DIGIT ROLL'}
            </ThemedText>
          </View>
          <ThemedText style={styles.rollText}>{gameState.currentRoll || '---'}</ThemedText>
          <ThemedText style={styles.turnMessageText}>{turnMessage}</ThemedText>
        </View>

        {/* Roll / Match Status Action Button */}
        {gameState.status === 'PLAYING' ? (
          <TouchableOpacity
            style={[
              styles.rollButton,
              (!isLocalTurn || pendingChoiceBoxes.length > 0 || isTargetingMode) &&
                styles.disabledButton,
            ]}
            disabled={!isLocalTurn || pendingChoiceBoxes.length > 0 || isTargetingMode}
            onPress={handleRoll}
          >
            <Zap size={20} color="#FFF" />
            <ThemedText style={styles.rollButtonText}>
              {!isLocalTurn
                ? `Waiting for ${currentPlayer.name}...`
                : pendingChoiceBoxes.length > 0
                ? 'Resolve Gun Choice First'
                : 'Roll 3 Digits'}
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.winnerBanner}>
            <Award size={24} color="#FFD700" />
            <ThemedText style={styles.winnerText}>Match Ended</ThemedText>
          </View>
        )}

        {/* Scrollable Player Columns Board */}
        <ScrollView contentContainerStyle={styles.boardScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.playersRow}>
            {gameState.players.map((player) => {
              const isCurrentTurnPlayer =
                player.id === currentPlayer.id && gameState.status === 'PLAYING';
              const isOpponentOfViewer = player.id !== viewerPlayerId;
              const playerHasAnyVest = player.characters.some((c) => c.isAlive && c.hasVest);

              return (
                <View
                  key={player.id}
                  style={[styles.playerColumn, isCurrentTurnPlayer && styles.activePlayerColumn]}
                >
                  <View style={styles.playerColumnHeader}>
                    <View style={styles.playerNameRow}>
                      <ThemedText style={styles.playerName}>{player.name}</ThemedText>
                      {/* For opponents, show vest shield beside player name only (do not reveal protected cell) */}
                      {isOpponentOfViewer && playerHasAnyVest && (
                        <View style={styles.headerVestBadge}>
                          <Shield size={13} color="#2A9D8F" />
                        </View>
                      )}
                    </View>
                    {isPlayerEliminated(player) ? (
                      <Skull size={16} color="#E63946" />
                    ) : (
                      <ThemedText style={styles.statusBadge}>
                        {isCurrentTurnPlayer ? 'ACTIVE' : 'IDLE'}
                      </ThemedText>
                    )}
                  </View>

                  <View style={styles.characterList}>
                    {player.characters.map((char: Character) => {
                      // Highlight only the active turn player's rolled boxes
                      const isRolledHighlight =
                        highlightedPlayerId === player.id &&
                        highlightedBoxes.includes(char.boxNumber);

                      // Choice box appears only for current turn player when loadedAmmo === 3
                      const showChoiceBox =
                        isCurrentTurnPlayer &&
                        isLocalTurn &&
                        pendingChoiceBoxes.includes(char.boxNumber) &&
                        activeShooterBox !== char.boxNumber;

                      // Valid opponent target when current turn player selects Shoot
                      const isValidTarget =
                        isTargetingMode &&
                        player.id === opponentPlayer.id &&
                        char.isAlive;

                      // Protected cell shield shown on the owning/viewing player's own card
                      const showCellVestBadge = !isOpponentOfViewer && char.isAlive && char.hasVest;

                      return (
                        <TouchableOpacity
                          key={char.boxNumber}
                          disabled={!isValidTarget}
                          onPress={() => isValidTarget && handleShootTarget(char.boxNumber)}
                          style={[
                            styles.characterCard,
                            !char.isAlive && styles.destroyedCard,
                            isRolledHighlight && styles.highlightedCard,
                            isValidTarget && styles.targetableCard,
                          ]}
                        >
                          <View style={styles.cardTopRow}>
                            <ThemedText style={styles.boxNumberLabel}>
                              Box {char.boxNumber}
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.stageLabel,
                                char.isGunComplete && styles.gunCompleteStage,
                              ]}
                            >
                              {char.isAlive ? char.stage : 'DESTROYED'}
                            </ThemedText>
                          </View>

                          {char.isAlive ? (
                            <View style={styles.cardDetails}>
                              {/* 3-Dot Magazine + Separate Reserve Count */}
                              <View style={styles.ammoRow}>
                                <ThemedText style={styles.subText}>Mag:</ThemedText>
                                <View style={styles.dotsContainer}>
                                  {[1, 2, 3].map((dotIndex) => (
                                    <View
                                      key={dotIndex}
                                      style={[
                                        styles.dot,
                                        dotIndex <= char.loadedAmmo
                                          ? styles.glowingDot
                                          : styles.darkDot,
                                      ]}
                                    />
                                  ))}
                                </View>
                                <ThemedText style={styles.subText}>
                                  Res: {char.reserveAmmo}
                                </ThemedText>
                              </View>

                              {/* Visual Indicator: Gun Loaded & Ready to Shoot */}
                              {char.isGunComplete && char.isLoaded && char.loadedAmmo > 0 && (
                                <View style={styles.readyBadge}>
                                  <Crosshair size={11} color="#B45309" />
                                  <ThemedText style={styles.readyText}>
                                    Ready to Shoot
                                  </ThemedText>
                                </View>
                              )}

                              {/* Own Cell Vest Indicator */}
                              {showCellVestBadge && (
                                <View style={styles.vestBadge}>
                                  <Shield size={12} color="#2A9D8F" />
                                  <ThemedText style={styles.vestText}>Vest Active</ThemedText>
                                </View>
                              )}

                              {/* Inline Shoot vs. Gain Ammo Choice (when gun is loaded with ammo) */}
                              {showChoiceBox && (
                                <View style={styles.inlineChoiceBox}>
                                  <ThemedText style={styles.choiceTitle}>
                                    Loaded ({char.loadedAmmo}/3):
                                  </ThemedText>
                                  <View style={styles.choiceButtonsRow}>
                                    <TouchableOpacity
                                      style={styles.choiceShootBtn}
                                      onPress={() => handleStartShootForBox(char.boxNumber)}
                                    >
                                      <Crosshair size={12} color="#FFF" />
                                      <ThemedText style={styles.choiceBtnText}>Shoot</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.choiceAmmoBtn}
                                      onPress={() => handleGainAmmo(char.boxNumber)}
                                    >
                                      <Zap size={12} color="#FFF" />
                                      <ThemedText style={styles.choiceBtnText}>
                                        Gain Ammo
                                      </ThemedText>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              )}

                              {/* Reload Button (empty mag + reserve >= 3) */}
                              {isCurrentTurnPlayer &&
                                isLocalTurn &&
                                pendingChoiceBoxes.length === 0 &&
                                !isTargetingMode &&
                                char.isGunComplete &&
                                char.loadedAmmo === 0 &&
                                char.reserveAmmo >= 3 && (
                                  <TouchableOpacity
                                    style={styles.reloadButton}
                                    onPress={() => handleReload(char.boxNumber)}
                                  >
                                    <RotateCcw size={12} color="#FFF" />
                                    <ThemedText style={styles.reloadText}>Reload</ThemedText>
                                  </TouchableOpacity>
                                )}
                            </View>
                          ) : (
                            <View style={styles.destroyedContent}>
                              <Skull size={22} color="#999" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom Vest Purchase Section (Outside ScrollView) */}
        {gameState.status === 'PLAYING' && (
          <View style={styles.bottomVestBar}>
            <View style={styles.vestSummaryRow}>
              <ThemedText style={styles.vestGlobalText}>
                {currentPlayer.name} Global Ammo: {getGlobalBullets(currentPlayer)}
              </ThemedText>
              <TouchableOpacity
                style={[styles.vestActionBtn, !canBuyVest && styles.disabledButton]}
                disabled={!canBuyVest}
                onPress={() => {
                  setIsVestDrawerOpen((prev) => !prev);
                  setSelectedVestRecipient(null);
                }}
              >
                <Shield size={15} color="#FFF" />
                <ThemedText style={styles.vestActionBtnText}>
                  {isVestDrawerOpen ? 'Close Vest' : 'Buy Vest (5)'}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {isVestDrawerOpen && canBuyVest && (
              <View style={styles.vestDrawer}>
                <ThemedText style={styles.vestDrawerLabel}>
                  Choose a surviving character to protect (ends turn):
                </ThemedText>
                <View style={styles.vestRecipientsRow}>
                  {currentPlayer.characters
                    .filter((c) => c.isAlive && !c.hasVest)
                    .map((c) => {
                      const isPicked = selectedVestRecipient === c.boxNumber;
                      return (
                        <TouchableOpacity
                          key={c.boxNumber}
                          style={[
                            styles.recipientChip,
                            isPicked && styles.recipientChipSelected,
                          ]}
                          onPress={() => setSelectedVestRecipient(c.boxNumber)}
                        >
                          <ThemedText
                            style={[
                              styles.recipientChipText,
                              isPicked && styles.recipientChipTextSelected,
                            ]}
                          >
                            Box {c.boxNumber}
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                </View>
                <TouchableOpacity
                  style={[
                    styles.confirmVestBtn,
                    selectedVestRecipient === null && styles.disabledButton,
                  ]}
                  disabled={selectedVestRecipient === null}
                  onPress={handleConfirmBuyVest}
                >
                  <ThemedText style={styles.confirmVestText}>Confirm Vest Purchase</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  backText: { fontSize: 15, fontWeight: '600' },
  turnIndicator: { fontSize: 15 },
  boldText: { fontWeight: 'bold', color: '#E63946' },
  rollContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#310303',
    gap: 3,
  },
  specialRollGlow: {
    borderColor: '#F59E0B',
    backgroundColor: '#53450a',
    borderWidth: 2,
  },
  rollHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rollTitle: { fontSize: 11, fontWeight: '700', opacity: 0.8 },
  rollText: { fontSize: 32, fontWeight: 'bold', letterSpacing: 4, color: '#b1cdf5' },
  turnMessageText: { fontSize: 11, opacity: 0.75, textAlign: 'center', fontWeight: '600' },
  rollButton: {
    backgroundColor: '#E63946',
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rollButtonText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  disabledButton: { opacity: 0.45 },
  winnerBanner: {
    backgroundColor: '#2A9D8F',
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  winnerText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  boardScroll: { flexGrow: 1, paddingBottom: 6 },
  playersRow: { flexDirection: 'row', gap: 10 },
  playerColumn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    backgroundColor: '#380404',
    gap: 8,
  },
  activePlayerColumn: { borderColor: '#E63946', borderWidth: 2 },
  playerColumnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  playerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  playerName: { fontSize: 13, fontWeight: 'bold' },
  headerVestBadge: {
    backgroundColor: '#e0f2f1',
    padding: 3,
    borderRadius: 4,
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#E63946',
    backgroundColor: '#ffe5e7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  characterList: { gap: 6 },
  characterCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 7,
    backgroundColor: '#380404',
    gap: 5,
  },
  destroyedCard: { backgroundColor: '#970505', borderColor: '#ddd', opacity: 0.6 },
  highlightedCard: { borderColor: '#F59E0B', borderWidth: 2, backgroundColor: '#3b3000' },
  targetableCard: { borderColor: '#E63946', borderWidth: 2, backgroundColor: '#ffbb00' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boxNumberLabel: { fontSize: 12, fontWeight: 'bold' },
  stageLabel: { fontSize: 10, fontWeight: '600', color: '#457B9D' },
  gunCompleteStage: { color: '#2A9D8F' },
  cardDetails: { gap: 4 },
  ammoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subText: { fontSize: 10, opacity: 0.75 },
  dotsContainer: { flexDirection: 'row', gap: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  glowingDot: { backgroundColor: '#E63946' },
  darkDot: { backgroundColor: '#D3D3D3' },
  vestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  vestText: { fontSize: 9, color: '#2A9D8F', fontWeight: '600' },
  inlineChoiceBox: {
    backgroundColor: '#615731',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
    gap: 4,
    marginTop: 2,
  },
  choiceTitle: { fontSize: 10, fontWeight: 'bold', color: '#ffc098', textAlign: 'center' },
  choiceButtonsRow: { flexDirection: 'column', gap: 4 },
  choiceShootBtn: {
    flex: 1,
    backgroundColor: '#E63946',
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  choiceAmmoBtn: {
    flex: 1,
    backgroundColor: '#2A9D8F',
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  choiceBtnText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
  reloadButton: {
    backgroundColor: '#1D3557',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 2,
  },
  reloadText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
  destroyedContent: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  bottomVestBar: {
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    paddingTop: 8,
    gap: 8,
  },
  vestSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vestGlobalText: { fontSize: 12, fontWeight: '600' },
  vestActionBtn: {
    backgroundColor: '#2A9D8F',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  vestActionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  vestDrawer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  vestDrawerLabel: { fontSize: 11, fontWeight: '600' },
  vestRecipientsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  recipientChip: {
    borderWidth: 1,
    borderColor: '#2A9D8F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#380404',
  },
  recipientChipSelected: { backgroundColor: '#2A9D8F' },
  recipientChipText: { fontSize: 11, fontWeight: '600', color: '#2A9D8F' },
  recipientChipTextSelected: { color: '#FFF' },
  confirmVestBtn: {
    backgroundColor: '#1D3557',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  readyText: { fontSize: 9, color: '#B45309', fontWeight: '700' },
  confirmVestText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
});