import React, { useState, useEffect, useContext } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import { BarChart } from 'react-native-gifted-charts'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import Colors from '@/constants/Colors'

const PopularProductsComparison = () => {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const [popularProducts, setPopularProducts] = useState([])
  const [invoiceData, setInvoiceData] = useState({ invoices: 0, quotations: 0 })
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('products')
  const translateX = useSharedValue(0)

  const auth = getAuth()
  const db = getFirestore()
  const user = auth.currentUser

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        // Fetch inventory data
        const inventoryRef = collection(db, `Users/${user.uid}/inventory`)
        const inventorySnapshot = await getDocs(inventoryRef)

        let products = inventorySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Sort and take top 3 products by itemsSold
        products = products
          .sort((a, b) => (b.itemsSold || 0) - (a.itemsSold || 0))
          .slice(0, 3)
        setPopularProducts(products)

        // Fetch invoices and quotations data
        const invoicesRef = collection(db, `Users/${user.uid}/invoices`)
        const invoicesSnapshot = await getDocs(invoicesRef)

        let invoices = 0
        let quotations = 0

        invoicesSnapshot.forEach(doc => {
          const data = doc.data()
          if (data.type === 'invoice') invoices += 1
          if (data.type === 'quotation') quotations += 1
        })

        setInvoiceData({ invoices, quotations })
      } catch (error) {
        console.error('Error fetching data from Firebase:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const intervalId = setInterval(() => {
      fetchData()
      toggleViewWithAnimation()
    }, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [user])

  const toggleViewWithAnimation = () => {
    translateX.value = withTiming(-550, { duration: 550 }, () => {
      setCurrentView(prevView =>
        prevView === 'products' ? 'invoices' : 'products'
      )
      translateX.value = withTiming(0, { duration: 550 })
    })
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }))

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size='large' color={'deepskyblue'} />
      ) : (
        <Animated.View style={[styles.animatedContainer, animatedStyle]}>
          {currentView === 'products' ? (
            <View>
              <Text style={styles.headerText}>
                My <Text style={{ fontWeight: '700' }}>Activity</Text>
              </Text>
              <View
                style={[
                  styles.section,
                  { backgroundColor: activeColors.primary[500] }
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color:
                        theme.mode === 'dark'
                          ? activeColors.grey[900]
                          : activeColors.grey[100]
                    }
                  ]}
                >
                  Most Popular Products
                </Text>
                {popularProducts.map(product => (
                  <Pressable
                    key={product.id}
                    style={[
                      styles.listItem,
                      {
                        backgroundColor: activeColors.primary[300],
                        borderColor: activeColors.grey[400]
                      }
                    ]}
                  >
                    <View style={styles.listItemContent}>
                      <Text
                        style={[
                          styles.listItemName,
                          { color: activeColors.grey[900] }
                        ]}
                      >
                        {product.productName}
                      </Text>
                      <Text
                        style={[
                          styles.listItemCategory,
                          { color: activeColors.grey[800] }
                        ]}
                      >
                        {product.category || 'Uncategorized'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.listItemPrice,
                        { color: activeColors.grey[900] }
                      ]}
                    >
                      {product.itemsSold?.toLocaleString() || '0'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.headerText}>
                My <Text style={{ fontWeight: '700' }}>Activity</Text>
              </Text>
              <View
                style={[
                  styles.section,
                  { backgroundColor: activeColors.primary[500] }
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color:
                        theme.mode === 'dark'
                          ? activeColors.grey[900]
                          : activeColors.grey[100]
                    }
                  ]}
                >
                  Invoices vs Quotations
                </Text>
                <BarChart
                  data={[
                    {
                      value: invoiceData.invoices,
                      label: 'Invoices',
                      frontColor: '#4CAF50'
                    },
                    {
                      value: invoiceData.quotations,
                      label: 'Quotations',
                      frontColor: '#2196F3'
                    }
                  ]}
                  barWidth={30}
                  spacing={60}
                  roundedTop
                  roundedBottom
                  hideRules
                  initialSpacing={25}
                  xAxisLabelTextStyle={{ color: '#fff', fontSize: 12 }}
                  noOfSections={3}
                  yAxisTextStyle={{ color: '#fff' }}
                  height={200}
                  width={250}
                />
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15
  },
  animatedContainer: {
    flex: 1
  },
  headerText: {
    padding: 10,
    color: Colors.white,
    fontSize: 16
  },
  section: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1
  },
  listItemContent: {
    flex: 1
  },
  listItemName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  listItemCategory: {
    fontSize: 14,
    fontStyle: 'italic'
  },
  listItemPrice: {
    fontSize: 16,
    fontWeight: 'bold'
  }
})

export default PopularProductsComparison
