import React, { useState, useContext } from 'react'
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable
} from 'react-native'
import { Switch, Text } from 'react-native-paper'
import { MaterialIcons, FontAwesome, AntDesign } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { ThemeContext } from '@/context/ThemeContext' // Import your ThemeContext
import { colors } from '@/config/theme'
import Header from '@/components/Header'

const Profile = () => {
  const { theme, updateTheme } = useContext(ThemeContext) // Access theme and updater from ThemeContext
  const activeColors = colors[theme.mode] // Get active colors from theme
  const [themeModalVisible, setThemeModalVisible] = useState(false) // Modal state
  const router = useRouter()

  const menuOptions = [
    {
      group: 'MY ACCOUNT',
      items: [
        {
          title: 'My Details',
          icon: 'user',
          iconType: FontAwesome,
          onPress: () => router.push('/scenes/Profile')
        },
        {
          title: 'Team Members',
          icon: 'team',
          iconType: AntDesign,
          onPress: () => router.push('/scenes/TeamMembers')
        },
        {
          title: 'Product/Service List',
          icon: 'list',
          iconType: FontAwesome,
          onPress: () => router.push('/scenes/Provisions')
        },
        {
          title: 'Customers | Suppliers',
          icon: 'user',
          iconType: FontAwesome,
          onPress: () => router.push('/scenes/CustomersSuppliersForm')
        },
        {
          title: 'My Subscriptions',
          icon: 'subscriptions',
          iconType: MaterialIcons,
          onPress: () => router.push('/scenes/Subscriptions')
        },
        {
          title: 'Theme',
          icon: 'brightness-6',
          iconType: MaterialIcons,
          onPress: () => setThemeModalVisible(true) // Open modal
        },
        {
          title: 'Log Out',
          icon: 'logout',
          iconType: AntDesign,
          onPress: () => router.push('/scenes/LoginForm')
        }
      ]
    }
  ]

  return (
    <View
      style={[styles.container, { backgroundColor: activeColors.primary[200] }]}
    >
      <Header />
      <ScrollView contentContainerStyle={styles.scrollView}>
        {menuOptions.map((group, groupIndex) => (
          <View key={groupIndex}>
            <Text
              style={[styles.groupTitle, { color: activeColors.grey[800] }]}
            >
              {group.group}
            </Text>
            {group.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.menuOption,
                  { backgroundColor: activeColors.primary[300] }
                ]}
                onPress={item.onPress} // Assign the onPress function
              >
                <item.iconType
                  name={item.icon}
                  size={24}
                  style={[styles.icon, { color: 'deepskyblue' }]}
                />
                <Text
                  style={[styles.menuText, { color: activeColors.grey[900] }]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Theme Modal */}
      <Modal
        visible={themeModalVisible}
        transparent={true}
        animationType='slide'
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor:
                  theme.mode === 'dark'
                    ? activeColors.primary[500]
                    : activeColors.primary[100]
              }
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: activeColors.grey[900] }]}
            >
              Choose Theme
            </Text>

            <Pressable
              style={[
                styles.themeOption,
                theme.mode === 'dark' && !theme.system
                  ? { backgroundColor: activeColors.primary[600] }
                  : null
              ]}
              onPress={() => updateTheme({ mode: 'dark' })}
            >
              <MaterialIcons
                name='brightness-4'
                size={24}
                color={'deepskyblue'}
              />
              <Text
                style={[styles.themeText, { color: activeColors.grey[900] }]}
              >
                Dark Mode
              </Text>
              <Switch
                value={theme.mode === 'dark' && !theme.system}
                onValueChange={() => updateTheme({ mode: 'dark' })}
                color='deepskyblue'
              />
            </Pressable>

            <Pressable
              style={[
                styles.themeOption,
                theme.mode === 'light' && !theme.system
                  ? { backgroundColor: activeColors.blueAccent[300] }
                  : null
              ]}
              onPress={() => updateTheme({ mode: 'light' })}
            >
              <MaterialIcons name='wb-sunny' size={24} color={'deepskyblue'} />
              <Text
                style={[styles.themeText, { color: activeColors.grey[900] }]}
              >
                Light Mode
              </Text>
              <Switch
                value={theme.mode === 'light' && !theme.system}
                onValueChange={() => updateTheme({ mode: 'light' })}
                color='deepskyblue'
              />
            </Pressable>

            <Pressable
              style={[
                styles.themeOption,
                theme.system
                  ? { backgroundColor: activeColors.primary[600] }
                  : null
              ]}
              onPress={() => updateTheme({ system: true })}
            >
              <MaterialIcons name='settings' size={24} color={'deepskyblue'} />
              <Text
                style={[styles.themeText, { color: activeColors.grey[900] }]}
              >
                System Default
              </Text>
              <Switch
                value={theme.system}
                onValueChange={() => updateTheme({ system: true })}
                color='deepskyblue'
              />
            </Pressable>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setThemeModalVisible(false)}
            >
              <MaterialIcons name='close' size={24} color='red' />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { padding: 20, paddingBottom: 120 },
  groupTitle: { fontSize: 12, fontWeight: 'bold', marginVertical: 10 },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8
  },
  icon: {
    marginRight: 10
  },
  menuText: {
    fontSize: 16
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContainer: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 10
  },
  themeOption: {
    width: '70%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    color: '#fff'
  },
  themeText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
    textAlign: 'center'
  }
})

export default Profile
