import React from 'react'
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet
} from 'react-native'

import { useEffect } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Platform } from 'react-native'
const WelcomeScreen: React.FC = () => {
  const router = useRouter()

  useEffect(() => {
    const checkForAppUpdate = async () => {
      if (Platform.OS !== 'web') {
        try {
          const Updates = await import('expo-updates')
          const update = await Updates.checkForUpdateAsync()
          if (update.isAvailable) {
            Alert.alert(
              'Update Available',
              'A new version is available. Update now?',
              [
                {
                  text: 'Later',
                  style: 'cancel'
                },
                {
                  text: 'Update',
                  onPress: async () => {
                    await Updates.fetchUpdateAsync()
                    await Updates.reloadAsync()
                  }
                }
              ]
            )
          }
        } catch (error) {
          console.log('Update check failed:', error)
        }
      }
    }

    checkForAppUpdate()
  }, [])

  const navigateToSignUp = () => {
    router.push('/scenes/RegistrationForm') // Replace with your actual route path
  }

  const navigateToLogin = () => {
    router.push('/scenes/LoginForm') // Replace with your actual route path
  }

  return (
    <SafeAreaView style={[styles.flex1, { backgroundColor: themeColors.bg }]}>
      <View style={[styles.flex1, styles.justifyAround, styles.my4]}>
        <Text
          style={[
            styles.textWhite,
            styles.fontBold,
            styles.text4xl,
            styles.textCenter
          ]}
        >
          Let's Get Started!
        </Text>

        <View style={[styles.flexRow, styles.justifyCenter]}>
          <Image
            source={require('../assets/images/welcome1.png')}
            style={{ width: 350, height: 350 }}
          />
        </View>
        <View style={[styles.flexRow, styles.justifyCenter, { padding: 10 }]}>
          <Text style={[styles.textWhite, styles.fontSemibold]}>
            Welcome to Quant Lite, Your Ultimate Business Companion on the
            <Text style={{ color: 'deepskyblue', fontWeight: 'bold' }}>
              Go!
            </Text>
          </Text>
        </View>
        <View style={styles.spaceY4}>
          <TouchableOpacity
            onPress={navigateToLogin}
            style={[
              styles.py3,
              styles.bgYellow400,
              styles.mx7,
              styles.roundedXl
            ]}
          >
            <Text
              style={[
                styles.textXl,
                styles.fontBold,
                styles.textCenter,
                styles.textGray700
              ]}
            >
              Get Started !
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  justifyAround: { justifyContent: 'space-around' },
  my4: { marginVertical: 16 },
  textWhite: { color: '#ffffff' },
  fontBold: { fontWeight: 'bold' },
  text4xl: { fontSize: 32 },
  textCenter: { textAlign: 'center' },
  flexRow: { flexDirection: 'row' },
  justifyCenter: { justifyContent: 'center' },
  spaceY4: { marginTop: 16 },
  py3: { paddingVertical: 12 },
  bgYellow400: { backgroundColor: 'deepskyblue' },
  mx7: { marginHorizontal: 28 },
  roundedXl: { borderRadius: 12 },
  textXl: { fontSize: 20 },
  textGray700: { color: '#fff' },
  fontSemibold: { fontWeight: '600' },
  textYellow400: { color: '#facc15' }
})

const themeColors = {
  bg: '#1a1a1a' // Example background color, adjust as needed
}

export default WelcomeScreen
