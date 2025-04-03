import React, { useContext } from 'react'
import { StyleSheet, View } from 'react-native'
import TabBarButton from './TabBarButton'
import { colors } from '@/config/theme'
import { ThemeContext } from '@/context/ThemeContext'

const TabBar = ({ state, descriptors, navigation }) => {
  const { theme } = useContext(ThemeContext) // Access theme context
  const activeColors = colors[theme.mode] // Apply theme-based colors
  const primaryColor = '#0891b2'
  const greyColor = '#737373'

  return (
    <View
      style={[styles.tabbar, { backgroundColor: activeColors.primary[500] }]}
    >
      {state.routes
        .filter(route => route.name !== 'index') // Exclude 'index' route
        .map((route, index) => {
          const { options } = descriptors[route.key]
          const label = options.tabBarLabel ?? options.title ?? route.name

          // Additional exclusion for hidden routes
          if (['_sitemap', '+not-found'].includes(route.name)) return null

          const isFocused = state.index === index

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params)
            }
          }

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key
            })
          }

          return (
            <TabBarButton
              key={route.name}
              onPress={onPress}
              onLongPress={onLongPress}
              isFocused={isFocused}
              routeName={route.name}
              color={isFocused ? primaryColor : greyColor}
              label={label}
            />
          )
        })}
    </View>
  )
}

const styles = StyleSheet.create({
  tabbar: {
    position: 'absolute',
    bottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25
  }
})

export default TabBar
