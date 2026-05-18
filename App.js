import React from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import AuthScreen from './src/screens/AuthScreen'

export default function App() {
  const [fontsLoaded] = useFonts({
  'Talina': require('./assets/fonts/Talina.otf'),
    'Capella': require('./assets/fonts/Capella.ttf'),
     'Gondens': require('./assets/fonts/Gondens.otf'),
          'Arexa': require('./assets/fonts/Arexa.otf'),
          'cabin': require('./assets/fonts/cabin.ttf'),

  });

  if (!fontsLoaded) {
    return null; // Return nothing (or a splash screen) until fonts are loaded
  }

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
