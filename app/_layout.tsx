import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { Appearance } from 'react-native'
import React, { useState, useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen'
import 'react-native-reanimated'
import { getData, storeData } from '@/config/asyncStorage'
import { ThemeContext } from '@/context/ThemeContext'

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync()

export default function RootLayout () {
  const [theme, setTheme] = useState({
    mode: Appearance.getColorScheme() || 'light', // Set system theme as default
    system: true
  })
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf') // Ensure the path to the font is correct
  })
  const [appReady, setAppReady] = useState(false)

  // Theme update function
  const updateTheme = async (newTheme = { system: false }) => {
    let updatedTheme = {}
    if (newTheme.system) {
      const systemColorScheme = Appearance.getColorScheme() || 'light'
      updatedTheme = { mode: systemColorScheme, system: true }
    } else if (newTheme.mode) {
      updatedTheme = { mode: newTheme.mode, system: false }
    } else {
      updatedTheme = {
        mode: theme.mode === 'dark' ? 'light' : 'dark',
        system: false
      }
    }
    setTheme(updatedTheme)
    await storeData('appTheme', updatedTheme) // Persist the updated theme
  }

  // Monitor system theme changes only when `system` is true
  useEffect(() => {
    if (theme.system) {
      const listener = Appearance.addChangeListener(({ colorScheme }) => {
        setTheme({
          mode: colorScheme || 'light',
          system: true
        })
      })
      return () => {
        listener.remove()
      }
    }
  }, [theme.system])

  const fetchStoredTheme = async () => {
    try {
      const storedTheme = await getData('appTheme')
      if (storedTheme) {
        setTheme(storedTheme)
      }
    } catch (error) {
      console.error('Error loading theme:', error)
    }
  }

  // Handle app initialization and hide splash screen
  useEffect(() => {
    const prepareApp = async () => {
      await fetchStoredTheme()
      setAppReady(true)
    }
    prepareApp()
  }, [])

  useEffect(() => {
    if (appReady && fontsLoaded) {
      SplashScreen.hideAsync().catch(console.warn)
    }
  }, [appReady, fontsLoaded])

  // Render null until the app is ready
  if (!appReady || !fontsLoaded) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      <Stack>
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen name='index' options={{ headerShown: false }} />
        <Stack.Screen
          name='scenes/LoginForm'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='scenes/RegistrationForm'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='scenes/QuickHelper'
          options={{ headerShown: false }}
        />
        <Stack.Screen name='scenes/Profile' options={{ headerShown: false }} />
        <Stack.Screen
          name='scenes/Documents'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='scenes/Subscriptions'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='scenes/FinancesForm'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='scenes/Provisions'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='scenes/CustomersSuppliersForm'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='scenes/TeamMembers'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='scenes/TasksForm'
          options={{ headerShown: false }}
        />
        <Stack.Screen name='scenes/Transact' options={{ headerShown: false }} />
        <Stack.Screen name='scenes/Purchase' options={{ headerShown: false }} />
        <Stack.Screen
          name='scenes/CostingModel'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='scenes/Inventory'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='scenes/InvoiceForm'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='scenes/QuotationForm'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='scenes/PredictiveAnalytics'
          options={{ headerShown: false }}
        />
        {/* Add more screens as needed */}
      </Stack>
    </ThemeContext.Provider>
  )
}
