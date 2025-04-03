import React from 'react'
import { Tabs } from 'expo-router'
import TabBar from '@/components/TabBar'

const Layout = () => {
  return (
    <Tabs tabBar={props => <TabBar {...props} />}>
      <Tabs.Screen
        name='home'
        options={{ title: 'Home', headerShown: false }}
      />
      <Tabs.Screen
        name='transactions'
        options={{ title: 'Transactions', headerShown: false }}
      />
      <Tabs.Screen
        name='explore'
        options={{ title: 'Explore', headerShown: false }}
      />
      <Tabs.Screen
        name='profile'
        options={{ title: 'Profile', headerShown: false }}
      />
    </Tabs>
  )
}

export default Layout
