import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

interface UniversalModalProps {
  visible: boolean
  onClose: () => void
  onSelect: (item: any) => void
  title: string
  data: any[]
}

const UniversalModal: React.FC<UniversalModalProps> = ({
  visible,
  onClose,
  onSelect,
  title,
  data
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const name = item.name || item.fullName || ''
      return name.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [data, searchQuery])

  return (
    <Modal visible={visible} transparent animationType='slide'>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name='close' size={24} color='red' />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>{title}</Text>

          <TextInput
            placeholder='Search'
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />

          <FlatList
            data={filteredData}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemContainer}
                onPress={() => {
                  onSelect(item)
                  onClose()
                }}
              >
                <Text style={styles.itemName}>
                  {item.name || item.fullName}
                </Text>
                {item.category && (
                  <Text style={styles.itemDetail}>
                    Category: {item.category}
                  </Text>
                )}
                {item.phone && (
                  <Text style={styles.itemDetail}>Phone: {item.phone}</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: '#888' }}>
                No matches found
              </Text>
            }
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  itemDetail: {
    fontSize: 14,
    color: 'gray'
  }
})

export default UniversalModal
