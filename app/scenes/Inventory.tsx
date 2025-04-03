import React, { useContext } from 'react'
import { StyleSheet, View } from 'react-native'
import InventoryList from '@/components/InventoryList'
import { ThemeContext } from '@/context/ThemeContext' // Import your ThemeContext
import { colors } from '@/config/theme'
import FormAppBar from '@/components/FormAppBar'

const Inventory = () => {
  const { theme, updateTheme } = useContext(ThemeContext) // Access theme and updater from ThemeContext
  const activeColors = colors[theme.mode] // Get active colors from theme
  return (
    <View
      style={[styles.container, { backgroundColor: activeColors.primary[200] }]}
    >
      <FormAppBar title={'Inventory'} />
      <InventoryList />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10
  }
})

export default Inventory
