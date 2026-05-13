import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, Modal } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebaseConfig'
import FormScreen from './FormScreen'
import BuilderScreen from './BuilderScreen'
import SavedResumesScreen from './SavedResumesScreen'
import { Feather } from '@expo/vector-icons'

WebBrowser.maybeCompleteAuthSession()

export default function AuthScreen() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [logoutModalVisible, setLogoutModalVisible] = useState(false)
  const [popupState, setPopupState] = useState({ visible: false, title: '', message: '', isError: false })
  const [currentScreen, setCurrentScreen] = useState('builder')
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
            setPopupState({ visible: true, title: 'Sign-In Error', message: 'Firebase sign-in failed: ' + error.message, isError: true })
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
      setPopupState({ visible: true, title: 'Google Sign-In Error', message: error.message, isError: true })
      setLoading(false)
    }
  }

  const executeSignOut = async () => {
    setLogoutModalVisible(false)
    try {
      setLoading(true)
      await signOut(auth)
    } catch (error) {
      console.error('Sign-out failed', error)
      setPopupState({ visible: true, title: 'Sign-Out Error', message: error.message, isError: true })
      setLoading(false)
    }
  }

  if (user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
        {/* Global Top Navigation Bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <TouchableOpacity onPress={() => setCurrentScreen('builder')} style={{ marginRight: 16 }}>
              <Feather name="home" size={22} color={currentScreen === 'builder' ? '#3B82F6' : '#94A3B8'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentScreen('form')}>
              <Feather name="file-text" size={22} color={currentScreen === 'form' ? '#3B82F6' : '#94A3B8'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentScreen('saved')} style={{ marginLeft: 16 }}>
              <Feather name="folder" size={22} color={currentScreen === 'saved' ? '#3B82F6' : '#94A3B8'} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.topCenter}>
             <Text style={styles.topBarTitle}>{currentScreen === 'form' ? 'Base Details' : currentScreen === 'builder' ? 'Tailor Resume' : 'Saved Resumes'}</Text>
          </View>

          <View style={styles.topRight}>
            {user.photoURL && <Image source={{ uri: user.photoURL }} style={styles.topBarAvatar} />}
            <TouchableOpacity onPress={() => setLogoutModalVisible(true)} style={{ padding: 8 }}>
              <Feather name="log-out" size={20} color="#F87171" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={{ flex: 1 }}>
          {currentScreen === 'builder' ? (
            <BuilderScreen user={user} onGoBack={() => setCurrentScreen('form')} />
          ) : currentScreen === 'form' ? (
            <FormScreen user={user} onGoToBuilder={() => setCurrentScreen('builder')} />
          ) : (
            <SavedResumesScreen user={user} />
          )}
        </View>

        {/* Custom Logout Modal */}
        <Modal visible={logoutModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Log Out</Text>
              <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setLogoutModalVisible(false)} style={styles.modalCancelBtn}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={executeSignOut} style={styles.modalConfirmBtn}>
                  <Text style={styles.modalConfirmText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Generic Popup Modal */}
        <Modal visible={popupState.visible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, popupState.isError && { color: '#EF4444' }]}>{popupState.title}</Text>
              <Text style={styles.modalMessage}>{popupState.message}</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setPopupState({ ...popupState, visible: false })} style={[styles.modalConfirmBtn, { backgroundColor: popupState.isError ? '#EF4444' : '#10B981' }]}>
                  <Text style={styles.modalConfirmText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    )
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

      {/* Generic Popup Modal */}
      <Modal visible={popupState.visible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, popupState.isError && { color: '#EF4444' }]}>{popupState.title}</Text>
            <Text style={styles.modalMessage}>{popupState.message}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setPopupState({ ...popupState, visible: false })} style={[styles.modalConfirmBtn, { backgroundColor: popupState.isError ? '#EF4444' : '#10B981' }]}>
                <Text style={styles.modalConfirmText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  topBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingVertical: 12,
    paddingTop: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  topLeft: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  topCenter: {
    flex: 2,
    alignItems: 'center'
  },
  topBarTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700'
  },
  topRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  topBarAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E293B', padding: 24, borderRadius: 16, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalMessage: { color: '#94A3B8', fontSize: 14, marginBottom: 24, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginRight: 12 },
  modalCancelText: { color: '#94A3B8', fontWeight: '600' },
  modalConfirmBtn: { backgroundColor: '#EF4444', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalConfirmText: { color: '#fff', fontWeight: 'bold' }
})
