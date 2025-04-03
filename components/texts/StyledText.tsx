import React, { useContext } from 'react'
import { Text, StyleSheet, View } from 'react-native'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import { StyledTextProps } from './types'
const StyledText = ({ children, small, big, bold, style }: StyledTextProps) => {
  const { theme } = useContext(ThemeContext) // Access theme context
  const activeColors = colors[theme.mode] // Get current theme colors
  return (
    <Text
      style={[
        {
          color: activeColors.primary[200],
          fontSize: small ? 13 : big ? 24 : 16,
          fontWeight: bold ? 'bold' : 'normal'
        },
        style
      ]}
    >
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({})

export default StyledText
