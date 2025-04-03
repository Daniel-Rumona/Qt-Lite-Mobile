import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { PieChart } from 'react-native-gifted-charts'
import { AntDesign } from '@expo/vector-icons' // Icons for toggling
import { db, auth } from '@/FirebaseConfig'
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore'

const QuarterlyPieChart = ({ filter = 'All' }: { filter?: string }) => {
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentQuarter, setCurrentQuarter] = useState(1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [totalItems, setTotalItems] = useState(0)
  const [chartData, setChartData] = useState([])
  const [collapsed, setCollapsed] = useState(false) // Collapsed state

  const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77']

  const fetchTransactionsForQuarter = async (quarter, year) => {
    setLoading(true)
    try {
      const user = auth.currentUser
      if (!user) {
        console.error('User not authenticated')
        return
      }

      const startMonth = (quarter - 1) * 3 + 1
      const endMonth = startMonth + 2
      const startDate = new Date(year, startMonth - 1, 1)
      const endDate = new Date(year, endMonth, 0, 23, 59, 59)

      const transactionsRef = collection(db, `Users/${user.uid}/transactions`)

      const q = query(
        transactionsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      )

      const querySnapshot = await getDocs(q)
      const fetchedTransactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setTransactions(fetchedTransactions)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilter = () => {
    if (filter === 'All') {
      setFilteredTransactions(transactions)
    } else {
      const filtered = transactions.filter(
        transaction =>
          transaction.transactionType &&
          transaction.transactionType.toLowerCase() === filter.toLowerCase()
      )
      setFilteredTransactions(filtered)
    }
  }

  const generateChartData = () => {
    const monthlyTotals = {}
    let total = 0

    filteredTransactions.forEach(transaction => {
      const date = transaction.date.toDate()
      const month = date.toLocaleString('default', { month: 'short' })
      const quantity = transaction.quantity || 0

      total += quantity

      if (monthlyTotals[month]) {
        monthlyTotals[month] += quantity
      } else {
        monthlyTotals[month] = quantity
      }
    })

    const pieData = Object.keys(monthlyTotals).map((key, index) => ({
      text: `${monthlyTotals[key]}`,
      value: monthlyTotals[key],
      color: COLORS[index % COLORS.length],
      legend: key
    }))

    setChartData(pieData)
    setTotalItems(total)
  }

  const handleNextQuarter = () => {
    if (currentQuarter < 4) {
      setCurrentQuarter(prev => prev + 1)
    } else {
      setCurrentQuarter(1)
      setCurrentYear(prev => prev + 1)
    }
  }

  const handlePreviousQuarter = () => {
    if (currentQuarter > 1) {
      setCurrentQuarter(prev => prev - 1)
    } else {
      setCurrentQuarter(4)
      setCurrentYear(prev => prev - 1)
    }
  }

  useEffect(() => {
    fetchTransactionsForQuarter(currentQuarter, currentYear)
  }, [currentQuarter, currentYear])

  useEffect(() => {
    applyFilter()
  }, [transactions, filter])

  useEffect(() => {
    generateChartData()
  }, [filteredTransactions])

  const quarterNames = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec']

  const renderLegend = (text, color) => (
    <View style={styles.legendItem}>
      <View style={[styles.legendColor, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{text}</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>
          Quarterly Summary ({quarterNames[currentQuarter - 1]} {currentYear})
        </Text>
        <TouchableOpacity onPress={() => setCollapsed(!collapsed)}>
          <AntDesign name={collapsed ? 'down' : 'up'} size={24} color='white' />
        </TouchableOpacity>
      </View>

      {!collapsed && (
        <>
          <View style={styles.chartNavigation}>
            <TouchableOpacity onPress={handlePreviousQuarter}>
              <AntDesign name='leftcircleo' size={30} color='#FFFFFF' />
            </TouchableOpacity>

            <View style={styles.chartContainer}>
              {loading ? (
                <ActivityIndicator size='large' color='#fff' />
              ) : chartData.length === 0 ? (
                <Text style={styles.noDataText}>No transactions found</Text>
              ) : (
                <PieChart
                  strokeColor='white'
                  strokeWidth={2}
                  donut
                  data={chartData}
                  innerCircleColor='#414141'
                  innerCircleBorderWidth={2}
                  innerCircleBorderColor={'white'}
                  innerRadius={50}
                  showValuesAsTooltipText={true}
                  showTooltip={true}
                  showValuesAsLabels={true}
                  showText
                  textSize={16}
                  textColor='#000'
                  showTextBackground={true}
                  centerLabelComponent={() => (
                    <View>
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 24,
                          textAlign: 'center'
                        }}
                      >
                        {totalItems}
                      </Text>
                      <Text style={{ color: 'white', fontSize: 18 }}>
                        Total
                      </Text>
                    </View>
                  )}
                />
              )}
            </View>

            <TouchableOpacity onPress={handleNextQuarter}>
              <AntDesign name='rightcircleo' size={30} color='#FFFFFF' />
            </TouchableOpacity>
          </View>

          <View style={styles.legendContainer}>
            {chartData.map((item, index) =>
              renderLegend(item.legend, item.color)
            )}
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    backgroundColor: '#232B5D'
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    textAlign: 'center'
  },
  header: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  chartNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chartContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noDataText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50
  },
  legendContainer: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 8
  },
  legendColor: {
    height: 16,
    width: 16,
    marginRight: 8,
    borderRadius: 4
  },
  legendText: {
    color: 'white',
    fontSize: 16
  }
})

export default QuarterlyPieChart
