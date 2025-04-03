import React, { useContext } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '@/config/theme'
import { ThemeContext } from '@/context/ThemeContext'
import { MaterialIcons } from '@expo/vector-icons'

const FormHeader = ({ title, backTarget = '/explore' }) => {
  const { theme } = useContext(ThemeContext) // Access theme context
  const activeColors = colors[theme.mode] // Apply theme-based colors
  const router = useRouter()

  return (
    <View
      style={[styles.header, { backgroundColor: activeColors.primary[500] }]}
    >
      <TouchableOpacity
        onPress={() => router.push(backTarget)} // Navigate to the specified back target
        style={styles.backButton}
      >
        <MaterialIcons
          name='arrow-back-ios'
          size={24}
          color={
            theme.mode === 'dark'
              ? activeColors.grey[900]
              : activeColors.grey[200]
          } // Icon color
        />
      </TouchableOpacity>
      <Text
        style={[
          styles.title,
          {
            color:
              theme.mode === 'dark'
                ? activeColors.grey[900]
                : activeColors.grey[200]
          }
        ]}
      >
        {title}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 5,
    marginBottom: 10,
    borderRadius: 20,
    borderCurve: 'continuous'
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  }
})

export default FormHeader
