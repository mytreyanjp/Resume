import React from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import AuthScreen from './src/screens/AuthScreen'

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthScreen />
      <StatusBar style="auto" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC'
  }
})
