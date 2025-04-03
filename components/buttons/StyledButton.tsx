import React, { useContext } from 'react'
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import StyledText from '../texts/StyledText'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import { StyledButtonProps } from './types'
const StyledButton = ({
  children,
  style,
  textStyle,
  onPress,
  isLoading,
  disabled
}: StyledButtonProps) => {
  const { theme } = useContext(ThemeContext) // Access theme context
  const activeColors = colors[theme.mode] // Get current theme colors
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        { backgroundColor: activeColors.grey[200] },
        styles.container,
        style
      ]}
      disabled={disabled || isLoading}
    >
      <StyledText style={[styles.text, textStyle]}>
        {isLoading ? <ActivityIndicator size='small' color='#fff' /> : children}
      </StyledText>
    </TouchableOpacity>
  )
}
const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10
  },
  text: {
    color: '#fff'
  }
})
export default StyledButton
