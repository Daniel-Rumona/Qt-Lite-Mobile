import React, { useContext } from 'react'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import { StyleSheet, View, Text, Platform } from 'react-native'

const Subscriptions = () => {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]

  return (
    <View
      style={[styles.container, { backgroundColor: activeColors.primary[200] }]}
    >
      <View>
        <View style={styles.glassCard}>
          <Text style={styles.title}>Subscriptions</Text>
          <Text style={styles.text}>No Subscriptions Available.</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    flex: 1
  },
  glassCard: {
    width: 300,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#000',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
    textAlign: 'center'
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    color: '#fff',
    textAlign: 'center'
  }
})

export default Subscriptions
