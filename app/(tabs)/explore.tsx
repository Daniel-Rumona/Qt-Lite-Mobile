import ColorList from '@/components/ColorList'
import Header from '@/components/Header'
import MenuItems from '@/components/MenuItems'
import React, { useContext } from 'react'
import { colors } from '@/config/theme'
import { ThemeContext } from '@/context/ThemeContext'
import { View, Text, StyleSheet } from 'react-native'

export default function Explore () {
  const { theme } = useContext(ThemeContext) // Access theme context
  const activeColors = colors[theme.mode] // Apply theme-based colors
  return (
    <View
      style={[styles.container, { backgroundColor: activeColors.primary[200] }]}
    >
      <Header />
      <MenuItems />
    </View>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1 }
})
