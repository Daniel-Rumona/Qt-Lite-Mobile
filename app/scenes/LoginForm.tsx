import React, { useEffect, useState } from 'react'
import {
  Image,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import { auth, db } from '../../FirebaseConfig'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export default function LoginForm () {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [secureText, setSecureText] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessages, setErrorMessages] = useState({
    email: '',
    password: '',
    general: ''
  })

  const router = useRouter()

  // Shared values for animation
  const fadeInValue = useSharedValue(0)
  const translateYValue = useSharedValue(30)

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeInValue.value,
    transform: [{ translateY: translateYValue.value }]
  }))

  // Run animation on mount
  useEffect(() => {
    fadeInValue.value = withTiming(1, { duration: 800 })
    translateYValue.value = withTiming(0, { duration: 800 })
  }, [fadeInValue, translateYValue])

  // Update form data
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Validate inputs
  const validateInputs = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    let isValid = true

    // Reset errors
    setErrorMessages({ email: '', password: '', general: '' })

    // Email validation
    if (!formData.email.trim()) {
      setErrorMessages(prev => ({ ...prev, email: 'Email is required.' }))
      isValid = false
    } else if (!emailRegex.test(formData.email)) {
      setErrorMessages(prev => ({ ...prev, email: 'Invalid email format.' }))
      isValid = false
    }

    // Password validation
    if (!formData.password.trim()) {
      setErrorMessages(prev => ({ ...prev, password: 'Password is required.' }))
      isValid = false
    } else if (formData.password.length < 6) {
      setErrorMessages(prev => ({
        ...prev,
        password: 'Password must be at least 6 characters long.'
      }))
      isValid = false
    }

    return isValid
  }

  // Sign-in function
  const signIn = async () => {
    if (!validateInputs()) return

    setLoading(true)

    try {
      const response = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      // Fetch user document from Firestore
      const userId = response.user.uid

      const userDocRef = doc(db, 'Users', userId)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        // Sync Firestore data to SQLite
        // await syncFirestoreToSQLite(userId)
        router.push('/(tabs)/home')
      } else {
        setErrorMessages(prev => ({
          ...prev,
          general: 'No account found for this email. Please register.'
        }))
      }
    } catch (error: any) {
      switch (error.code) {
        case 'auth/wrong-password':
          setErrorMessages(prev => ({
            ...prev,
            password: 'Incorrect password. Please try again.'
          }))
          break
        case 'auth/user-not-found':
          setErrorMessages(prev => ({
            ...prev,
            email: 'No user found with this email. Please register.'
          }))
          break
        case 'auth/invalid-credential':
          setErrorMessages(prev => ({
            ...prev,
            email: 'Check your credentials. Please try again.'
          }))
          break
        case 'auth/network-request-failed':
          setErrorMessages(prev => ({
            ...prev,
            general: 'Check your internet connection. Please try again later.'
          }))
          break
        case 'auth/invalid-email':
          setErrorMessages(prev => ({
            ...prev,
            email: 'Invalid email format.'
          }))
          break
        case 'auth/too-many-requests':
          setErrorMessages(prev => ({
            ...prev,
            general: 'Too many attempts. Please try again later.'
          }))
          break
        default:
          setErrorMessages(prev => ({
            ...prev,
            general:
              error.message || 'An unexpected error occurred. Please try again.'
          }))
          break
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Animated Container */}
      <Animated.View style={[animatedStyle, styles.animatedContainer]}>
        {/* Image Section */}
        <Image
          source={require('../../assets/images/hero-img.png')}
          style={styles.image}
        />

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder='Enter your email'
            placeholderTextColor='#aaa'
            keyboardType='email-address'
            value={formData.email}
            onChangeText={value => handleInputChange('email', value)}
            autoCapitalize='none'
            autoComplete='email'
            autoCorrect={false}
          />
          {errorMessages.email && (
            <Text style={styles.errorText}>{errorMessages.email}</Text>
          )}
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <View style={styles.passwordContainer}>
            <TextInput
              secureTextEntry={secureText}
              value={formData.password}
              style={styles.passwordInput}
              placeholder='Enter your password'
              placeholderTextColor='#aaa'
              autoCapitalize='none'
              autoComplete='current-password'
              onChangeText={value => handleInputChange('password', value)}
            />
            <TouchableOpacity
              onPress={() => setSecureText(!secureText)}
              style={styles.icon}
            >
              <MaterialIcons
                name={secureText ? 'visibility' : 'visibility-off'}
                size={24}
                color='#666'
              />
            </TouchableOpacity>
          </View>
          {errorMessages.password && (
            <Text style={styles.errorText}>{errorMessages.password}</Text>
          )}
        </View>
        {errorMessages.general && (
          <Text style={styles.errorText}>{errorMessages.general}</Text>
        )}

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={signIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Sign Up Section */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account?</Text>
          <TouchableOpacity
            onPress={() => router.push('/scenes/RegistrationForm')}
          >
            <Text style={styles.signUpLink}> Sign Up</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212'
  },
  animatedContainer: {
    width: '100%'
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: 20,
    alignSelf: 'center'
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16
  },
  input: {
    width: '100%',
    height: 50,
    paddingHorizontal: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 10
  },
  passwordInput: {
    flex: 1,
    height: 50
  },
  icon: {
    paddingLeft: 10
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: 'deepskyblue',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20
  },
  buttonDisabled: {
    backgroundColor: '#888'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  signUpContainer: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'center'
  },
  signUpText: {
    color: '#fff',
    fontSize: 14
  },
  signUpLink: {
    color: 'deepskyblue',
    fontSize: 14,
    fontWeight: 'bold'
  }
})
