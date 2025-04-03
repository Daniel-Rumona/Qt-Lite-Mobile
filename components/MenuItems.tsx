import React, { useState, useContext } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal
} from 'react-native'
import { Switch, ListItem, Pressable } from '@react-native-material/core'
import { MaterialIcons, FontAwesome, AntDesign } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { ThemeContext } from '@/context/ThemeContext' // Import your ThemeContext
import { colors } from '@/config/theme'

const MenuItems = () => {
  const { theme, updateTheme } = useContext(ThemeContext) // Access theme and updater from ThemeContext
  const activeColors = colors[theme.mode] // Get active colors from theme
  const [themeModalVisible, setThemeModalVisible] = useState(false) // Modal state
  const router = useRouter()
  const menuOptions = [
    {
      group: 'TOOLBOX',
      items: [
        {
          title: 'Purchases',
          icon: 'shopping-cart',
          iconType: MaterialIcons,
          onPress: () => router.push('/scenes/Purchase')
        },
        {
          title: 'Transact',
          icon: 'swap',
          iconType: AntDesign,
          onPress: () => router.push('/scenes/Transact')
        },
        {
          title: 'Costing Model',
          icon: 'calculator',
          iconType: FontAwesome,
          onPress: () => router.push('/scenes/CostingModel')
        },
        {
          title: 'Invoice',
          icon: 'receipt',
          iconType: MaterialIcons,
          onPress: () => router.push('/scenes/InvoiceForm')
        },
        {
          title: 'Quotation',
          icon: 'receipt',
          iconType: MaterialIcons,
          onPress: () => router.push('/scenes/QuotationForm')
        },
        {
          title: 'Manage Documents',
          icon: 'cloud-upload',
          iconType: MaterialIcons,
          onPress: () => router.push('/scenes/Documents')
        },
        {
          title: 'Quick Helper',
          icon: 'help-outline',
          iconType: MaterialIcons,
          onPress: () => router.push('/scenes/QuickHelper')
        },
        {
          title: 'Predictive Analytics',
          icon: 'line-chart',
          iconType: FontAwesome,
          onPress: () => router.push('/scenes/PredictiveAnalytics')
        }
      ]
    },
    {
      group: 'REPORTS',
      items: [
        {
          title: 'Inventory',
          icon: 'inbox',
          iconType: FontAwesome,
          onPress: () => router.push('/scenes/Inventory')
        },
        {
          title: 'Finances',
          icon: 'dollar',
          iconType: FontAwesome,
          onPress: () => router.push('/scenes/FinancesForm')
        }
      ]
    }
  ]

  return (
    <View style={[styles.container]}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {menuOptions.map((group, groupIndex) => (
          <View key={groupIndex}>
            <Text
              style={[styles.groupTitle, { color: activeColors.grey[900] }]}
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
                  style={[
                    styles.menuText,
                    { color: activeColors.primary[900] }
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    height: 52,
    width: 250,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  activeOption: {
    backgroundColor: '#e0e0e0',
    borderColor: '#bbb'
  },
  themeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginLeft: 10
  },
  scrollView: {
    padding: 20,
    paddingBottom: 120
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginVertical: 10,
    paddingLeft: 10
  },
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
    top: 10,
    right: 10
  }
})

export default MenuItems
