import React, { useEffect, useState, useRef } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Platform, Modal, TextInput, useColorScheme, PanResponder, Animated, useWindowDimensions } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import * as AuthSession from 'expo-auth-session'
import { GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebaseConfig'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import FormScreen from './FormScreen'
import BuilderScreen from './BuilderScreen'
import SavedResumesScreen from './SavedResumesScreen'
import { Feather } from '@expo/vector-icons'
import { getAppTheme } from '../theme'
import { getAuthStyles, ANIMATION_CONFIG } from '../styles'

WebBrowser.maybeCompleteAuthSession()

const HoverButton = ({ style, hoverStyle, onPress, disabled, children, ...props }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <TouchableOpacity
      style={[style, isHovered && !disabled && (hoverStyle || { opacity: 0.8 })]}
      onPress={onPress}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </TouchableOpacity>
  )
}

export default function AuthScreen() {
  const systemTheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(systemTheme === 'dark')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [logoutModalVisible, setLogoutModalVisible] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [popupState, setPopupState] = useState({ visible: false, title: '', message: '', isError: false })
  const [currentScreen, setCurrentScreen] = useState('builder')
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [showWelcome, setShowWelcome] = useState(true)

  const appTheme = getAppTheme(isDarkMode)
  const styles = getAuthStyles(appTheme)

  const titleAnim = useRef(new Animated.Value(0)).current
  const titleY = useRef(new Animated.Value(ANIMATION_CONFIG.welcomeTranslateY)).current
  const tagAnim = useRef(new Animated.Value(0)).current
  const tagY = useRef(new Animated.Value(ANIMATION_CONFIG.welcomeTranslateY)).current
  const btnAnim = useRef(new Animated.Value(0)).current
  const btnY = useRef(new Animated.Value(ANIMATION_CONFIG.welcomeTranslateY)).current
  const welcomeOpacity = useRef(new Animated.Value(1)).current
  const authOpacity = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const appOpacity = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(0)).current
  const { width: windowWidth } = useWindowDimensions()

  const screens = ['builder', 'form', 'saved']

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Activate PanResponder if horizontal swipe is dominant and exceeds 15px (more sensitive)
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 25) {
          // Swipe Right -> Go to previous screen
          setCurrentScreen(prev => {
            const idx = screens.indexOf(prev)
            return idx > 0 ? screens[idx - 1] : prev
          })
        } else if (gestureState.dx < -25) {
          // Swipe Left -> Go to next screen
          setCurrentScreen(prev => {
            const idx = screens.indexOf(prev)
            return idx < screens.length - 1 ? screens[idx + 1] : prev
          })
        }
      }
    })
  ).current

  useEffect(() => {
    const idx = screens.indexOf(currentScreen)
    Animated.timing(slideAnim, {
      toValue: -idx * windowWidth,
      duration: 300,
      useNativeDriver: true
    }).start()
  }, [currentScreen, windowWidth])

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
  })

  useEffect(() => {
    if (Platform.OS !== 'web') {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      })
    }
  }, [])

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
      if (initializing) setInitializing(false)
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
    if (Platform.OS === 'web') {
      try {
        setLoading(true)
        await promptAsync()
      } catch (error) {
        console.error('Google prompt error', error)
        setPopupState({ visible: true, title: 'Google Sign-In Error', message: error.message, isError: true })
        setLoading(false)
      }
    } else {
      try {
        setLoading(true)
        await GoogleSignin.hasPlayServices()
        const userInfo = await GoogleSignin.signIn()
        const idToken = userInfo.idToken || userInfo.data?.idToken
        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken)
          const userCredential = await signInWithCredential(auth, credential)
          setUser({
            uid: userCredential.user.uid,
            name: userCredential.user.displayName,
            email: userCredential.user.email,
            photoURL: userCredential.user.photoURL
          })
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Native Google sign in error', error)
        if (error.code !== 'SIGN_IN_CANCELLED' && error.code !== '12501') {
          setPopupState({ visible: true, title: 'Google Sign-In Error', message: error.message, isError: true })
        }
        setLoading(false)
      }
    }
  }

  const executeSignOut = async () => {
    setLogoutModalVisible(false)
    try {
      setLoading(true)
      await signOut(auth)
      if (Platform.OS !== 'web') {
        await GoogleSignin.signOut()
      }
    } catch (error) {
      console.error('Sign-out failed', error)
      setPopupState({ visible: true, title: 'Sign-Out Error', message: error.message, isError: true })
      setLoading(false)
    }
  }

  const handleEmailSignIn = async () => {
    if (!emailInput || !passwordInput) {
      setPopupState({ visible: true, title: 'Missing Info', message: 'Please enter both email and password.', isError: true })
      return
    }
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, emailInput, passwordInput)
    } catch (error) {
      console.error('Email sign in error', error)
      setPopupState({ visible: true, title: 'Sign-In Error', message: error.message, isError: true })
      setLoading(false)
    }
  }

  const handleEmailSignUp = async () => {
    if (!emailInput || !passwordInput) {
      setPopupState({ visible: true, title: 'Missing Info', message: 'Please enter both email and password.', isError: true })
      return
    }
    setLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, emailInput, passwordInput)
    } catch (error) {
      console.error('Email sign up error', error)
      setPopupState({ visible: true, title: 'Sign-Up Error', message: error.message, isError: true })
      setLoading(false)
    }
  }

  useEffect(() => {
    if (showWelcome) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(titleAnim, { toValue: 1, duration: ANIMATION_CONFIG.welcomeFadeDuration, useNativeDriver: true }),
          Animated.timing(titleY, { toValue: 0, duration: ANIMATION_CONFIG.welcomeFadeDuration, useNativeDriver: true })
        ]),
        Animated.parallel([
          Animated.timing(tagAnim, { toValue: 1, duration: ANIMATION_CONFIG.welcomeFadeDuration, useNativeDriver: true }),
          Animated.timing(tagY, { toValue: 0, duration: ANIMATION_CONFIG.welcomeFadeDuration, useNativeDriver: true })
        ]),
        Animated.parallel([
          Animated.timing(btnAnim, { toValue: 1, duration: ANIMATION_CONFIG.welcomeFadeDuration, useNativeDriver: true }),
          Animated.timing(btnY, { toValue: 0, duration: ANIMATION_CONFIG.welcomeFadeDuration, useNativeDriver: true })
        ])
      ]).start()
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
        ])
      ).start()
    }
  }, [showWelcome])

  useEffect(() => {
    if (!initializing) {
      if (user) {
        if (showWelcome) {
          // Simulate data loading UX, then auto-dismiss welcome screen
          setTimeout(() => {
            appOpacity.setValue(0)
            Animated.timing(appOpacity, { toValue: 1, duration: ANIMATION_CONFIG.welcomeOutDuration, useNativeDriver: true }).start()
            Animated.timing(welcomeOpacity, { toValue: 0, duration: ANIMATION_CONFIG.welcomeOutDuration, useNativeDriver: true }).start(() => {
              setShowWelcome(false)
            })
          }, 2200)
        } else {
          appOpacity.setValue(0)
          Animated.timing(appOpacity, { toValue: 1, duration: ANIMATION_CONFIG.authFadeDuration, useNativeDriver: true }).start()
        }
      } else {
        if (!showWelcome) {
          authOpacity.setValue(0)
          Animated.timing(authOpacity, { toValue: 1, duration: ANIMATION_CONFIG.authFadeDuration, useNativeDriver: true }).start()
        }
      }
    }
  }, [initializing, user, showWelcome])

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.bg }}>
      {/* Main Content Area: App or Auth Form */}
      {user ? (
        <Animated.View style={{ flex: 1, backgroundColor: 'transparent', opacity: appOpacity }}>
        {/* Global Top Navigation Bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <HoverButton onPress={() => setCurrentScreen('builder')} style={{ marginRight: 16 }}>
              <Feather name="home" size={22} color={currentScreen === 'builder' ? appTheme.primary : appTheme.textMuted} />
            </HoverButton>
            <HoverButton onPress={() => setCurrentScreen('form')}>
              <Feather name="file-text" size={22} color={currentScreen === 'form' ? appTheme.primary : appTheme.textMuted} />
            </HoverButton>
            <HoverButton onPress={() => setCurrentScreen('saved')} style={{ marginLeft: 16 }}>
              <Feather name="folder" size={22} color={currentScreen === 'saved' ? appTheme.primary : appTheme.textMuted} />
            </HoverButton>
          </View>
          
          <View style={styles.topRight}>
            {user.photoURL && <Image source={{ uri: user.photoURL }} style={styles.topBarAvatar} />}
            <HoverButton onPress={() => setMenuVisible(true)} style={{ padding: 8, borderRadius: 8 }} hoverStyle={{ backgroundColor: appTheme.border }}>
              <Feather name="menu" size={24} color={appTheme.text} />
            </HoverButton>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={{ flex: 1, overflow: 'hidden' }} {...panResponder.panHandlers}>
          <Animated.View style={{ flex: 1, flexDirection: 'row', width: windowWidth * 3, transform: [{ translateX: slideAnim }] }}>
            <View style={{ width: windowWidth, height: '100%' }}>
              <BuilderScreen user={user} onGoBack={() => setCurrentScreen('form')} appTheme={appTheme} />
            </View>
            <View style={{ width: windowWidth, height: '100%' }}>
              <FormScreen user={user} onGoToBuilder={() => setCurrentScreen('builder')} appTheme={appTheme} />
            </View>
            <View style={{ width: windowWidth, height: '100%' }}>
              <SavedResumesScreen user={user} appTheme={appTheme} />
            </View>
          </Animated.View>
        </View>

        {/* Dropdown Menu Modal */}
        <Modal visible={menuVisible} transparent={true} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <TouchableOpacity style={styles.menuOverlay} onPress={() => setMenuVisible(false)} activeOpacity={1}>
            <View style={styles.dropdownMenu}>
              <HoverButton style={styles.menuItem} hoverStyle={{ backgroundColor: appTheme.border, borderRadius: 6 }} onPress={() => { setIsDarkMode(!isDarkMode); setMenuVisible(false); }}>
                <Feather name={isDarkMode ? "sun" : "moon"} size={18} color={appTheme.text} style={{marginRight: 12}} />
                <Text style={styles.menuItemText}>{isDarkMode ? "Light Mode" : "Dark Mode"}</Text>
              </HoverButton>
              <View style={styles.menuDivider} />
              <HoverButton style={styles.menuItem} hoverStyle={{ backgroundColor: appTheme.border, borderRadius: 6 }} onPress={() => { setMenuVisible(false); setLogoutModalVisible(true); }}>
                <Feather name="log-out" size={18} color={appTheme.error} style={{marginRight: 12}} />
                <Text style={[styles.menuItemText, {color: appTheme.error}]}>Log Out</Text>
              </HoverButton>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Custom Logout Modal */}
        <Modal visible={logoutModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Log Out</Text>
              <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>
              <View style={styles.modalButtons}>
                <HoverButton onPress={() => setLogoutModalVisible(false)} style={styles.modalCancelBtn} hoverStyle={{ backgroundColor: appTheme.border }}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </HoverButton>
                <HoverButton onPress={executeSignOut} style={styles.modalConfirmBtn} hoverStyle={{ backgroundColor: isDarkMode ? '#c89fd5' : '#475569' }}>
                  <Text style={styles.modalConfirmText}>Log Out</Text>
                </HoverButton>
              </View>
            </View>
          </View>
        </Modal>

        {/* Generic Popup Modal */}
        <Modal visible={popupState.visible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, popupState.isError && { color: appTheme.error }]}>{popupState.title}</Text>
              <Text style={styles.modalMessage}>{popupState.message}</Text>
              <View style={styles.modalButtons}>
              <HoverButton onPress={() => setPopupState({ ...popupState, visible: false })} style={[styles.modalConfirmBtn, { backgroundColor: appTheme.primary }]} hoverStyle={{ backgroundColor: isDarkMode ? '#c89fd5' : '#475569' }}>
                <Text style={[styles.modalConfirmText, { color: appTheme.primaryText }]}>OK</Text>
              </HoverButton>
              </View>
            </View>
          </View>
        </Modal>
        </Animated.View>
      ) : (
        <Animated.View style={[styles.wrapper, { opacity: authOpacity, backgroundColor: 'transparent' }]}>
      
      <Text style={[styles.title, {fontFamily:'Gondens', fontSize:60, lineHeight: 105, includeFontPadding: false, paddingTop: 15, transform: [{ translateY: -10 }]}]}>SIGN IN</Text>


      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor={appTheme.textMuted}
        value={emailInput}
        onChangeText={setEmailInput}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={appTheme.textMuted}
        value={passwordInput}
        onChangeText={setPasswordInput}
        secureTextEntry
      />

      <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginBottom: 24 }}>
        <HoverButton style={[styles.button, { flex: 1, backgroundColor: appTheme.surface,borderWidth: 1, borderColor: appTheme.border }]} hoverStyle={{ backgroundColor: appTheme.border}} onPress={handleEmailSignIn} disabled={loading}>
          {loading ? <ActivityIndicator color={appTheme.text} /> : <Text style={[styles.buttonText, { color: appTheme.text }]}>Log In</Text>}
        </HoverButton>
        <HoverButton style={[styles.button, { flex: 1, backgroundColor: appTheme.surface, borderWidth: 1, borderColor: appTheme.border }]} hoverStyle={{ backgroundColor: appTheme.border }} onPress={handleEmailSignUp} disabled={loading}>
          {loading ? <ActivityIndicator color={appTheme.text} /> : <Text style={[styles.buttonText, { color: appTheme.text }]}>Sign Up</Text>}
        </HoverButton>
      </View>

      <Text style={{ color: appTheme.textMuted, marginBottom: 24, fontFamily: 'Talina' }}>— OR —</Text>

      <HoverButton
        style={[styles.button, { backgroundColor: appTheme.surface, borderWidth: 1, borderColor: appTheme.border }, (!request || loading) && styles.buttonDisabled]}
        hoverStyle={{ backgroundColor: appTheme.border }}
        onPress={handleSignIn}
        disabled={!request || loading}
      >
        {loading ? <ActivityIndicator color={appTheme.text} /> : <Text style={[styles.buttonText, { color: appTheme.text }]}>Sign in with Google</Text>}
      </HoverButton>

      {/* Generic Popup Modal */}
      <Modal visible={popupState.visible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, popupState.isError && { color: appTheme.error }]}>{popupState.title}</Text>
            <Text style={styles.modalMessage}>{popupState.message}</Text>
            <View style={styles.modalButtons}>
              <HoverButton onPress={() => setPopupState({ ...popupState, visible: false })} style={[styles.modalConfirmBtn, { backgroundColor: appTheme.primary }]} hoverStyle={{ backgroundColor: isDarkMode ? '#c89fd5' : '#475569' }}>
                <Text style={[styles.modalConfirmText, { color: appTheme.primaryText }]}>OK</Text>
              </HoverButton>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
      )}

      {/* Welcome Screen Overlay (Absolutely positioned on top) */}
      {showWelcome && (
        <Animated.View style={[styles.wrapper, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, opacity: welcomeOpacity, backgroundColor: appTheme.bg }]}>
          <Animated.View style={{ opacity: titleAnim, transform: [{ translateY: titleY }], alignItems: 'center' }}>
            <Text style={[styles.title, { fontSize: 82, lineHeight: 150, marginBottom: 32, fontFamily: 'Gondens', includeFontPadding: false, paddingTop: 20, transform: [{ translateY: -10 }] }]}>RESUME</Text>
          </Animated.View>
          
          <Animated.View style={{ opacity: tagAnim, transform: [{ translateY: tagY }], alignItems: 'center' }}>
            <Text style={[styles.title, { fontSize: 24, lineHeight: 105, marginBottom: 8, letterSpacing:4, fontWeight: '300',top:-80,  fontFamily: 'Gondens',color: appTheme.secondaryText, includeFontPadding: false, paddingTop: 10, transform: [{ translateY: -10 }] }]}>BREAK THE PAUSE</Text>
          </Animated.View>
          
          <Animated.View style={{ opacity: btnAnim, transform: [{ translateY: btnY }], width: '100%', alignItems: 'center' }}>
            {initializing || user ? (
              <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={appTheme.textMuted} />
              </View>
            ) : (
              <HoverButton 
                onPress={() => {
                  authOpacity.setValue(0)
                  Animated.timing(authOpacity, { toValue: 1, duration: ANIMATION_CONFIG.welcomeOutDuration, useNativeDriver: true }).start()
                  Animated.timing(welcomeOpacity, { toValue: 0, duration: ANIMATION_CONFIG.welcomeOutDuration, useNativeDriver: true }).start(() => {
                    setShowWelcome(false)
                  })
                }}
              >
                <Animated.Image source={require('./Resume_icon.png')} style={{ width: 100, height: 100, transform: [{ scale: scaleAnim }] }} resizeMode="contain" />
              </HoverButton>
            )}
          </Animated.View>
        </Animated.View>
      )}
    </View>
  )
}
