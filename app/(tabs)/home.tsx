import React, { useContext, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { auth } from '@/FirebaseConfig' // Import Firebase Auth
import { onAuthStateChanged } from 'firebase/auth'
import { colors } from '@/config/theme'
import { ThemeContext } from '@/context/ThemeContext'
import Header from '@/components/Header'
import FinanceBlock from '@/components/FinanceBlock'
import PopularProductsComparison from '@/components/PopularProductsComparison'

export default function Home () {
  const { theme } = useContext(ThemeContext) // Access theme context
  const activeColors = colors[theme.mode] // Apply theme-based colors
  const router = useRouter()

  return (
    <View
      style={[styles.container, { backgroundColor: activeColors.primary[200] }]}
    >
      <Header />
      <FinanceBlock />
      <PopularProductsComparison />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 }
})
