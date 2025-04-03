// Optimized InventoryList.tsx
import React, { useEffect, useState, useContext } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput
} from 'react-native'
import { Searchbar } from 'react-native-paper'
import Animated from 'react-native-reanimated'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  updateDoc
} from 'firebase/firestore'
import { Flex } from '@react-native-material/core'
const InventoryList = () => {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const [inventory, setInventory] = useState([])
  const [fullInventory, setFullInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortCriteria, setSortCriteria] = useState('Most Sold')
  const [selectedItem, setSelectedItem] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [addStockValue, setAddStockValue] = useState('')
  const [sortModalVisible, setSortModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const auth = getAuth()
  const db = getFirestore()
  const user = auth.currentUser

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchInventory = async () => {
      setLoading(true)
      try {
        const inventoryRef = collection(db, `Users/${user.uid}/inventory`)
        const snapshot = await getDocs(inventoryRef)

        if (!snapshot.empty) {
          const inventoryData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setInventory(inventoryData)
          setFullInventory(inventoryData)
        } else {
          setInventory([])
          setFullInventory([])
        }
      } catch (error) {
        console.error('Error fetching inventory from Firebase:', error)
        Alert.alert('Error', 'Failed to fetch inventory.')
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [user])

  const sortInventory = criteria => {
    let sortedInventory = [...inventory]
    switch (criteria) {
      case 'Most Sold':
        sortedInventory.sort((a, b) => b.itemsSold - a.itemsSold)
        break
      case 'Least Sold':
        sortedInventory.sort((a, b) => a.itemsSold - b.itemsSold)
        break
      case 'Value Sold Desc':
        sortedInventory.sort((a, b) => b.valueSold - a.valueSold)
        break
      case 'Value Sold Asc':
        sortedInventory.sort((a, b) => a.valueSold - b.valueSold)
        break
      case 'Stock Level Asc':
        sortedInventory.sort((a, b) => a.productQuantity - b.productQuantity)
        break
      case 'Stock Level Desc':
        sortedInventory.sort((a, b) => b.productQuantity - a.productQuantity)
        break
      default:
        break
    }
    setInventory(sortedInventory)
  }

  const handleSortChange = criteria => {
    setSortCriteria(criteria)
    sortInventory(criteria)
    setSortModalVisible(false)
  }

  const handleSearch = query => {
    setSearchQuery(query)
    if (query.trim() === '') {
      setInventory(fullInventory)
    } else {
      const filteredInventory = fullInventory.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
      )
      setInventory(filteredInventory)
    }
  }

  const handleItemPress = item => {
    setSelectedItem(item)
    setModalVisible(true)
  }

  const handleAddStock = async () => {
    if (
      !addStockValue ||
      isNaN(addStockValue) ||
      parseInt(addStockValue, 10) <= 0
    ) {
      Alert.alert('Invalid Input', 'Please enter a valid stock value.')
      return
    }

    const updatedQuantity = selectedItem.quantity + parseInt(addStockValue, 10)

    try {
      const db = await getDBConnection()
      await updateRow(db, 'inventory', selectedItem.id, {
        quantity: updatedQuantity
      })
      Alert.alert('Success', 'Stock updated successfully.')

      setInventory(prevInventory =>
        prevInventory.map(item =>
          item.id === selectedItem.id
            ? { ...item, quantity: updatedQuantity }
            : item
        )
      )

      setAddStockValue('')
      setModalVisible(false)
    } catch (error) {
      console.error('Error updating stock in SQLite:', error)
      Alert.alert('Error', 'Failed to update stock.')
    }
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleItemPress(item)}
      style={[
        styles.cardContainer,
        { backgroundColor: activeColors.primary[300] }
      ]}
    >
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, { color: activeColors.grey[900] }]}>
          {item.productName}
        </Text>
        <Text style={[styles.itemCategory, { color: activeColors.grey[800] }]}>
          Category: {item.category}
        </Text>
        <Text style={[styles.itemStock, { color: activeColors.grey[800] }]}>
          Stock Level: {item.productQuantity}
        </Text>
        <Text style={[styles.itemStock, { color: activeColors.grey[800] }]}>
          Value Sold: {item.valueSold}
        </Text>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return <ActivityIndicator size='large' color={activeColors.primary[200]} />
  }

  return (
    <View style={styles.container}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 10,
          alignItems: 'center',
          paddingHorizontal: 10
        }}
      >
        <Searchbar
          placeholder='Search product'
          value={searchQuery}
          onChangeText={handleSearch}
          style={styles.searchBar}
        />
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortModalVisible(true)}
        >
          <Text style={styles.sortButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>
      <Animated.FlatList
        data={inventory}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      {/* Sort Modal */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType='slide'
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <View style={styles.buttonGrid}>
              {[
                'Most Sold',
                'Least Sold',
                'Value Sold Desc',
                'Value Sold Asc',
                'Stock Level Asc',
                'Stock Level Desc'
              ].map((criteria, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSortChange(criteria)}
                  style={[
                    styles.modalButton,
                    { backgroundColor: 'deepskyblue', borderRadius: 40 }
                  ]}
                >
                  <Text style={styles.modalButtonText}>{criteria}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setSortModalVisible(false)}
              style={[
                styles.modalButton,
                {
                  backgroundColor: activeColors.redAccent[500],
                  width: '100%',
                  borderRadius: 40
                }
              ]}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Item Details Modal */}
      {selectedItem && (
        <Modal
          visible={modalVisible}
          transparent
          animationType='slide'
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>{selectedItem.productName}</Text>
              <Text style={styles.modalText}>
                Category: {selectedItem.category}
              </Text>
              <Text style={styles.modalText}>
                Stock Level: {selectedItem.productQuantity}
              </Text>
              <Flex
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: 10
                }}
              >
                <TouchableOpacity
                  onPress={handleAddStock}
                  style={[
                    styles.modalButton,
                    { backgroundColor: 'deepskyblue', flex: 1 }
                  ]}
                >
                  <Text style={styles.modalButtonText}>Add Stock</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[
                    styles.modalButton,
                    { backgroundColor: activeColors.redAccent[500], flex: 1 }
                  ]}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </Flex>
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 10
  },
  searchBar: {
    marginBottom: 10,
    width: '70%'
  },
  sortButton: {
    padding: 10,
    borderRadius: 25,
    height: 40,
    width: '30%',
    backgroundColor: 'deepskyblue',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sortButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  list: {
    paddingBottom: 20
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2
  },
  itemContent: {
    flex: 1
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  itemCategory: {
    fontSize: 16
  },
  itemStock: {
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
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
    fontSize: 16
  },
  modalButton: {
    width: '48%',
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  }
})

export default InventoryList
