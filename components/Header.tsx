import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo
} from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator
} from 'react-native'
import { IconButton, Avatar } from 'react-native-paper'
import { Flex } from '@react-native-material/core'
import { AntDesign, MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { colors } from '@/config/theme'
import { ThemeContext } from '@/context/ThemeContext'
import Colors from '@/constants/Colors'
import debounce from 'lodash.debounce'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs
} from 'firebase/firestore'

const LowStockItem = React.memo(({ product }) => (
  <View style={styles.lowStockItem}>
    <Text style={styles.lowStockName}>{product.name}</Text>
    <Text style={styles.lowStockDetails}>
      Stock: {product.currentStock} | Threshold:{' '}
      {product.minimumQuantityThreshold}
    </Text>
  </View>
))

export default function Header () {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const [businessName, setBusinessName] = useState('')
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [showBellModal, setShowBellModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const productsPerPage = 3
  const router = useRouter()
  const auth = getAuth()
  const db = getFirestore()
  const user = auth.currentUser

  const getInitials = name =>
    name
      ? name
          .split(' ')
          .map(n => n[0])
          .join('')
      : 'QX'

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchUserData = async () => {
      try {
        const userRef = doc(db, `Users/${user.uid}`)
        const userSnapshot = await getDoc(userRef)

        if (userSnapshot.exists()) {
          setBusinessName(userSnapshot.data().businessName || 'Business Name')
        }

        const provisionsRef = collection(db, `Users/${user.uid}/provisions`)
        const inventoryRef = collection(db, `Users/${user.uid}/inventory`)

        const [provisionsSnapshot, inventorySnapshot] = await Promise.all([
          getDocs(provisionsRef),
          getDocs(inventoryRef)
        ])

        const provisionsData = provisionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        const inventoryData = inventorySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        const lowStock = provisionsData
          .map(provision => {
            const matchingInventory = inventoryData.find(
              item => item.productID === provision.productID
            )
            return matchingInventory &&
              matchingInventory.quantity < provision.minimumQuantityThreshold
              ? {
                  ...provision,
                  currentStock: matchingInventory.quantity
                }
              : null
          })
          .filter(Boolean)

        setLowStockProducts(lowStock)
      } catch (error) {
        console.error('Error fetching data from Firebase:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()

    const intervalId = setInterval(() => {
      fetchUserData()
    }, 5 * 60 * 1000) // Sync every 5 minutes

    return () => clearInterval(intervalId)
  }, [user])

  const paginatedProducts = useMemo(
    () =>
      lowStockProducts.slice(
        (currentPage - 1) * productsPerPage,
        currentPage * productsPerPage
      ),
    [lowStockProducts, currentPage, productsPerPage]
  )

  const totalProductPages = Math.ceil(lowStockProducts.length / productsPerPage)

  const handleSearchProducts = useCallback(
    debounce(query => {
      const filteredProducts = lowStockProducts.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase())
      )
      setLowStockProducts(filteredProducts)
      setCurrentPage(1)
    }, 300),
    [lowStockProducts]
  )

  if (loading) {
    return <ActivityIndicator size='large' color='deepskyblue' />
  }

  return (
    <Flex
      direction='row'
      justify='between'
      style={{
        padding: 10,
        backgroundColor: activeColors.primary[500],
        alignItems: 'center',
        marginHorizontal: 10,
        marginVertical: 10,
        borderRadius: 20,
        borderCurve: 'continuous'
      }}
    >
      <Avatar.Text
        label={getInitials(businessName)}
        size={40}
        style={{
          backgroundColor: 'deepskyblue'
        }}
      />
      <Flex
        direction='column'
        justify='center'
        style={{ marginHorizontal: 10 }}
      >
        <Text
          style={{
            color:
              theme.mode === 'dark'
                ? activeColors.primary[900]
                : activeColors.primary[100],
            fontWeight: 'bold',
            fontSize: 18
          }}
        >
          {businessName}
        </Text>
      </Flex>
      <Flex direction='row' justify='center' style={{ gap: 5 }}>
        <IconButton
          icon={() => (
            <AntDesign
              name='creditcard'
              size={24}
              color={activeColors.grey[900]}
            />
          )}
          onPress={() => router.push('/scenes/Transact')}
          style={{
            backgroundColor: 'deepskyblue',
            marginHorizontal: 5,
            borderRadius: 20
          }}
        />
        <IconButton
          icon={() => (
            <>
              <AntDesign
                name='bells'
                size={24}
                color={activeColors.grey[900]}
              />
              {lowStockProducts.length > 0 && (
                <View style={styles.notificationDot} />
              )}
            </>
          )}
          onPress={() => setShowBellModal(true)}
          style={{
            backgroundColor: 'deepskyblue',
            marginHorizontal: 5,
            borderRadius: 20
          }}
        />
      </Flex>
    </Flex>
  )
}

const styles = StyleSheet.create({
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: 10,
    width: 10,
    backgroundColor: 'red',
    borderRadius: 5
  },
  lowStockItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  lowStockName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  lowStockDetails: {
    fontSize: 14,
    color: '#666'
  }
})
