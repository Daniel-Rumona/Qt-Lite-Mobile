import React, { useEffect } from 'react'
import { StyleSheet, Pressable, Text, Dimensions } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'
import { AntDesign, Feather } from '@expo/vector-icons'

const icons = {
  home: props => <AntDesign name='home' size={26} {...props} />,
  transactions: props => <AntDesign name='swap' size={26} {...props} />,
  explore: props => <Feather name='compass' size={26} {...props} />,
  profile: props => <AntDesign name='user' size={26} {...props} />
}

const TabBarButton = (props: {
  isFocused: boolean
  label: string
  routeName: string
  color: string
}) => {
  const { isFocused, label, routeName, color, ...rest } = props
  const scale = useSharedValue(0)
  const { height } = Dimensions.get('window')
  const shrinkText = height > 1440

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, {
      duration: 350
    })
  }, [isFocused, scale])

  const animatedIconStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(scale.value, [0, 1], [0.8, 1.2])
    return { transform: [{ scale: scaleValue }] }
  })

  const IconComponent = icons[routeName]

  if (!IconComponent) {
    console.error(`No icon found for route: ${routeName}`)
    return null
  }

  try {
    return (
      <Pressable {...rest} style={styles.container}>
        <Animated.View style={[animatedIconStyle]}>
          {IconComponent({ color })}
        </Animated.View>
        <Text style={{ color, fontSize: shrinkText ? 12 : 10 }}>{label}</Text>
      </Pressable>
    )
  } catch (error) {
    console.error('TabBarButton render error:', error)
    return null
  }
} // ✅ THIS BRACE WAS MISSING

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4
  }
})

export default TabBarButton
