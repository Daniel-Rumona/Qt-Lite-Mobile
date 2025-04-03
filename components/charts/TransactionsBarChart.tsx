import React, { useState, useEffect, useContext } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import { AntDesign } from '@expo/vector-icons'
import { db, auth } from '@/FirebaseConfig'
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore'
import { SegmentedButtons } from 'react-native-paper'
import { colors } from '@/config/theme'
import { ThemeContext } from '@/context/ThemeContext'

enum Period {
  week = 'week',
  month = 'month',
  year = 'year'
}

const TransactionsBarChart = ({
  filter = 'All',
  monetaryValue = true
}: {
  filter?: string
  monetaryValue?: boolean
}) => {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [barData, setBarData] = useState([])
  const [chartPeriod, setChartPeriod] = useState<Period>(Period.week)
  const [loading, setLoading] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const user = auth.currentUser
      if (!user) {
        return
      }

      const { startDate, endDate } = getDateRange(chartPeriod)

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
      setFilteredTransactions(fetchedTransactions) // Apply filtering here
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateBarData = () => {
    const totals: { [key: string]: number } = {}
    const labels =
      chartPeriod === Period.week
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : chartPeriod === Period.month
        ? Array.from(
            {
              length: new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                0
              ).getDate()
            },
            (_, i) => (i + 1).toString()
          ) // Days of the current month
        : chartPeriod === Period.year
        ? [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
          ]
        : []

    filteredTransactions.forEach(transaction => {
      const date = transaction.date.toDate()
      const key =
        chartPeriod === Period.month
          ? date.getDate().toString() // Use day of the month for monthly
          : date.getMonth().toString() // Use month index for yearly

      if (totals[key]) {
        totals[key] += monetaryValue ? transaction.amountDue || 0 : 1
      } else {
        totals[key] = monetaryValue ? transaction.amountDue || 0 : 1
      }
    })

    const data = labels.map((label, index) => ({
      value: totals[index] || 0,
      label
    }))

    setBarData(data)
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

  const getDateRange = (period: Period) => {
    let startDate: Date
    let endDate: Date

    if (period === Period.week) {
      const currentDay = currentDate.getDay()
      const startOfWeek =
        currentDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1) // Adjust for week starting on Monday
      startDate = new Date(currentDate)
      startDate.setDate(startOfWeek)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6) // Week ends 6 days after the start
    } else if (period === Period.month) {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1) // First day of the month
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ) // Last day of the month
    } else if (period === Period.year) {
      startDate = new Date(currentDate.getFullYear(), 0, 1) // January 1st of the current year
      endDate = new Date(currentDate.getFullYear(), 11, 31) // December 31st of the current year
    } else {
      // Default fallback
      startDate = new Date()
      endDate = new Date()
    }

    return { startDate, endDate }
  }

  const handlePreviousPeriod = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate)
      if (chartPeriod === Period.week) {
        newDate.setDate(prevDate.getDate() - 7)
      } else if (chartPeriod === Period.month) {
        newDate.setMonth(prevDate.getMonth() - 1)
      } else if (chartPeriod === Period.year) {
        newDate.setFullYear(prevDate.getFullYear() - 1)
      }
      return newDate
    })
  }

  const handleNextPeriod = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate)
      if (chartPeriod === Period.week) {
        newDate.setDate(prevDate.getDate() + 7)
      } else if (chartPeriod === Period.month) {
        newDate.setMonth(prevDate.getMonth() + 1)
      } else if (chartPeriod === Period.year) {
        newDate.setFullYear(prevDate.getFullYear() + 1)
      }
      return newDate
    })
  }

  useEffect(() => {
    fetchTransactions()
  }, [chartPeriod, currentDate])

  useEffect(() => {
    applyFilter()
  }, [transactions, filter])

  useEffect(() => {
    generateBarData()
  }, [filteredTransactions, monetaryValue]) // Include monetaryValue dependency

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Transactions Summary</Text>
      </View>
      <View>
        <SegmentedButtons
          value={chartPeriod}
          onValueChange={value => setChartPeriod(value as Period)}
          buttons={[
            {
              value: Period.week,
              label: 'Weekly',
              uncheckedColor: activeColors.grey[900],
              style: {
                backgroundColor:
                  chartPeriod === Period.week
                    ? activeColors.blueAccent[500]
                    : activeColors.blueAccent[100],
                borderColor: 'transparent' // Set border color to white
              }
            },
            {
              value: Period.month,
              label: 'Monthly',
              uncheckedColor: activeColors.grey[900],
              style: {
                backgroundColor:
                  chartPeriod === Period.month
                    ? activeColors.blueAccent[500]
                    : activeColors.blueAccent[100],
                borderColor: 'transparent' // Set border color to white
              }
            },
            {
              value: Period.year,
              label: 'Yearly',
              uncheckedColor: activeColors.grey[900],
              style: {
                backgroundColor:
                  chartPeriod === Period.year
                    ? activeColors.blueAccent[500]
                    : activeColors.blueAccent[100],
                borderColor: 'transparent' // Set border color to white
              }
            }
          ]}
          style={styles.segmentedButtons}
        />

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start'
          }}
        >
          <Text style={{ color: 'gray' }}>
            Total
            {monetaryValue
              ? filter === 'Expense'
                ? 'Spending'
                : 'Income'
              : 'Transactions'}
          </Text>
          <Text
            style={{
              fontWeight: '700',
              fontSize: 32,
              marginBottom: 10,
              color: 'white'
            }}
          >
            {monetaryValue
              ? `$${barData
                  .reduce((total, item) => total + item.value, 0)
                  .toFixed(2)}` // Monetary value
              : `${barData.reduce((total, item) => total + item.value, 0)}`}
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator size='large' color='#fff' />
        ) : (
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <BarChart
              data={barData}
              barWidth={chartPeriod === Period.week ? 30 : 20}
              height={150}
              width={290}
              minHeight={3}
              barBorderRadius={3}
              showGradient
              spacing={chartPeriod === Period.week ? 20 : 15}
              initialSpacing={5}
              noOfSections={4}
              yAxisThickness={0}
              xAxisThickness={0}
              xAxisLabelsVerticalShift={2}
              xAxisLabelTextStyle={{ color: 'gray' }}
              yAxisTextStyle={{ color: 'gray' }}
              isAnimated
              animationDuration={300}
            />

            <View style={styles.navigation}>
              <TouchableOpacity onPress={handlePreviousPeriod}>
                <AntDesign name='leftcircleo' size={30} color='#FFFFFF' />
              </TouchableOpacity>
              <Text style={styles.dateRange}>
                {new Date(
                  getDateRange(chartPeriod).startDate
                ).toLocaleDateString()}
                -
                {new Date(
                  getDateRange(chartPeriod).endDate
                ).toLocaleDateString()}
              </Text>

              <TouchableOpacity onPress={handleNextPeriod}>
                <AntDesign name='rightcircleo' size={30} color='#FFFFFF' />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    display: 'flex',
    alignItems: 'center'
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  header: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  segmentedButtons: {
    marginBottom: 20,
    height: 35,
    textAlign: 'center',
    color: '#fff',
    textDecorationColor: '#fff',
    borderColor: '#fff'
  },
  dateRange: {
    color: 'white',
    textAlign: 'center'
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 25
  }
})

export default TransactionsBarChart
