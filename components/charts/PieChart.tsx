import React, { useState, useEffect, useContext } from 'react'
import { View, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native'
import { PieChart } from 'react-native-gifted-charts'
import { db, auth } from '@/FirebaseConfig'
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { SegmentedButtons } from 'react-native-paper'
import { colors } from '@/config/theme'
import { ThemeContext } from '@/context/ThemeContext'
enum Period {
  week = 'week',
  month = 'month',
  year = 'year'
}
const PieChartPlot = () => {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const [loading, setLoading] = useState(false) // Loading state
  const [transactionData, setTransactionData] = useState({
    income: 0,
    expense: 0
  }) // Transaction data state
  const [chartPeriod, setChartPeriod] = useState<Period>(Period.week)
  const [userID, setUserID] = useState('') // User ID state
  const [currentDate, setCurrentDate] = useState(new Date())

  const fetchTransactions = async (userId: string) => {
    setLoading(true)
    try {
      const transactionsRef = collection(db, `Users/${userId}/transactions`)
      const { startDate, endDate } = getDateRange(chartPeriod)

      const q = query(
        transactionsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      )

      const querySnapshot = await getDocs(q)

      let incomeTotal = 0
      let expenseTotal = 0

      querySnapshot.forEach(doc => {
        const data = doc.data()
        const amount = data.amountDue || 0 // Safeguard for missing amount
        if (data.transactionType === 'Income') {
          incomeTotal += amount
        } else if (data.transactionType === 'Expense') {
          expenseTotal += amount
        }
      })

      setTransactionData({ income: incomeTotal, expense: expenseTotal })
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async authUser => {
      if (authUser) {
        const userId = authUser.uid
        setUserID(userId)
        await fetchTransactions(userId)
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribeAuth() // Cleanup listener on unmount
  }, [])
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

  const total = transactionData.income + transactionData.expense

  const pieData =
    total > 0
      ? [
          {
            value: transactionData.income,
            color: '#009FFF',
            gradientCenterColor: '#006DFF',
            label: 'Income'
          },
          {
            value: transactionData.expense,
            color: '#93FCF8',
            gradientCenterColor: '#3BE9DE',
            label: 'Expense'
          }
        ]
      : []

  const renderLegend = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}
      >
        <View
          style={{
            height: 10,
            width: 10,
            borderRadius: 5,
            backgroundColor: '#009FFF',
            marginRight: 10
          }}
        />
        <Text style={{ color: 'white' }}>
          Income:
          {total > 0 ? ((transactionData.income / total) * 100).toFixed(1) : 0}%
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            height: 10,
            width: 10,
            borderRadius: 5,
            backgroundColor: '#93FCF8',
            marginRight: 10
          }}
        />
        <Text style={{ color: 'white' }}>
          Expense:
          {total > 0 ? ((transactionData.expense / total) * 100).toFixed(1) : 0}
          %
        </Text>
      </View>
    </View>
  )

  return (
    <View
      style={{
        margin: 20,
        padding: 16,
        borderRadius: 20
      }}
    >
      <View
        style={{
          flexDirection: 'column'
        }}
      >
        <Text
          style={{
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
            textAlign: 'center'
          }}
        >
          Transaction Metrics
        </Text>
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
      </View>

      <>
        {loading ? (
          <ActivityIndicator size='large' color='#fff' />
        ) : (
          <>
            <View style={{ padding: 20, alignItems: 'center' }}>
              <PieChart
                data={pieData}
                donut
                showGradient
                sectionAutoFocus
                radius={90}
                innerRadius={60}
                innerCircleColor={'#000'}
                centerLabelComponent={() => (
                  <View
                    style={{ justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Text
                      style={{
                        fontSize: 22,
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      {total > 0
                        ? ((transactionData.income / total) * 100).toFixed(1)
                        : 0}
                      %
                    </Text>
                    <Text style={{ fontSize: 14, color: 'white' }}>Income</Text>
                  </View>
                )}
              />
            </View>
            {renderLegend()}
          </>
        )}
      </>
    </View>
  )
}
const styles = StyleSheet.create({
  segmentedButtons: {
    marginVertical: 20,
    height: 35,
    textAlign: 'center',
    color: '#fff',
    textDecorationColor: '#fff',
    borderColor: '#fff'
  }
})
export default PieChartPlot
