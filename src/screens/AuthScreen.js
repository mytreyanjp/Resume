import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebaseConfig'
import FormScreen from './FormScreen'
import BuilderScreen from './BuilderScreen'

WebBrowser.maybeCompleteAuthSession()

export default function AuthScreen() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentScreen, setCurrentScreen] = useState('form')
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '321259633436-lu9vmi558o9q3v28e0pui1mnrl2fog5b.apps.googleusercontent.com', // Generic fallback
    webClientId: '321259633436-lu9vmi558o9q3v28e0pui1mnrl2fog5b.apps.googleusercontent.com',
    androidClientId: '321259633436-l9np6guebuhgl0uiq2jvql1uk4jdageq.apps.googleusercontent.com', // Replace with ID from Google Cloud
    iosClientId: 'PASTE_YOUR_ACTUAL_IOS_CLIENT_ID_HERE'          // Replace with ID from Google Cloud
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, authUser => {
      if (authUser) {
        setUser({
          uid: authUser.uid,
          name: authUser.displayName,
          email: authUser.email,
          photoURL: authUser.photoURL
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (response) {
      if (response.type === 'success') {
        const idToken = response.params?.id_token || response.authentication?.idToken
        const accessToken = response.authentication?.accessToken
        const credential = GoogleAuthProvider.credential(idToken, accessToken)

        setLoading(true)
        signInWithCredential(auth, credential)
          .then((userCredential) => {
            // Force the state update immediately upon success
            setUser({
              uid: userCredential.user.uid,
              name: userCredential.user.displayName,
              email: userCredential.user.email,
              photoURL: userCredential.user.photoURL
            })
            setLoading(false)
          })
          .catch(error => {
            console.error('Firebase sign-in error', error)
            alert('Firebase sign-in failed: ' + error.message) // Uses native browser alert
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    }
  }, [response])

  const handleSignIn = async () => {
    try {
      setLoading(true)
      await promptAsync()
    } catch (error) {
      console.error('Google prompt error', error)
      Alert.alert('Google sign-in error', error.message)
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut(auth)
    } catch (error) {
      console.error('Sign-out failed', error)
      Alert.alert('Sign-out failed', error.message)
      setLoading(false)
    }
  }

  if (user) {
    if (currentScreen === 'builder') {
      return <BuilderScreen user={user} onSignOut={handleSignOut} onGoBack={() => setCurrentScreen('form')} />
    }
    return <FormScreen user={user} onSignOut={handleSignOut} onGoToBuilder={() => setCurrentScreen('builder')} />
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Resume Builder</Text>
      <Text style={styles.subtitle}>Sign in with Google to start building your resume</Text>

      <TouchableOpacity
        style={[styles.button, (!request || loading) && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={!request || loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in with Google</Text>}
      </TouchableOpacity>

      <Text style={styles.helpText}>
        Configure `src/firebaseConfig.js` and replace the Google client IDs in `src/screens/AuthScreen.js`.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A'
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    color: '#F8FAFC'
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  profileCard: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center'
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 16
  },
  welcome: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8
  },
  details: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16
  },
  logoutButton: {
    borderColor: '#3B82F6',
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14
  },
  logoutText: {
    color: '#60A5FA',
    fontWeight: '600'
  },
  helpText: {
    marginTop: 28,
    color: '#64748B',
    textAlign: 'center',
    fontSize: 13
  }
})
