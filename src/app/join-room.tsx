// src/app/join-room.tsx
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function JoinRoomScreen() {
  const [roomAddress, setRoomAddress] = useState('');

  const handleConnect = () => {
    if (!roomAddress.trim()) {
      Alert.alert('Error', 'Please enter a valid room address or IP.');
      return;
    }
      // We will connect to the host socket/server here later
    router.push('/waiting');
    console.log(`Connecting to room at: ${roomAddress}`);
  };

  const handleScanQR = () => {
    Alert.alert('QR Scanner', 'Camera QR scanning will be wired up during physical testing.');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backText}><ArrowLeft size={25} color="#beafaf" /></ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Join Room</ThemedText>
        </View>

        {/* Option A: Enter Room Address */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Option A: Enter Room Address</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="e.g. 192.168.1.50:8080"
            placeholderTextColor="#888"
            value={roomAddress}
            onChangeText={setRoomAddress}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
            <ThemedText style={styles.buttonText}>Connect to Room</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Option B: Scan QR Code */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Option B: Scan QR Code</ThemedText>
          <TouchableOpacity style={styles.qrButton} onPress={handleScanQR}>
            <ThemedText style={styles.qrButtonText}>📷 Open QR Scanner</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  connectButton: {
    backgroundColor: '#E63946',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  qrButton: {
    borderWidth: 2,
    borderColor: '#1D3557',
    borderStyle: 'dashed',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  qrButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});