import React, { useContext, useEffect, useState } from 'react'
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native'
import {
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons
} from '@expo/vector-icons'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import { db, auth } from '@/FirebaseConfig'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import Colors from '@/constants/Colors'

const FinanceBlock = () => {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const { width } = useWindowDimensions()
  const blockWidth = (width - 40) / 3 // Calculate width for three blocks in a row

  const [income, setIncome] = useState(0)
  const [expense, setExpense] = useState(0)
  const [currency, setCurrency] = useState('R') // Default currency

  const user = auth.currentUser

  useEffect(() => {
    if (user) {
      fetchFinanceData()
    }
  }, [user])

  const fetchFinanceData = async () => {
    if (!user) return

    try {
      // 🔹 Fetch user data (including currency)
      const userRef = doc(db, `Users/${user.uid}`)
      const userSnapshot = await getDoc(userRef)

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data()
        setCurrency(userData.currency || 'R') // Default to "$" if no currency is set
      }

      // 🔹 Fetch transactions
      const transactionsRef = collection(db, `Users/${user.uid}/transactions`)
      const transactionsSnapshot = await getDocs(transactionsRef)

      let totalIncome = 0
      let totalExpense = 0

      transactionsSnapshot.forEach(doc => {
        const transaction = doc.data()
        if (transaction.transactionType === 'Income') {
          totalIncome += transaction.amountDue || 0
        } else if (transaction.transactionType === 'Expense') {
          totalExpense += transaction.amountDue || 0
        }
      })

      setIncome(totalIncome)
      setExpense(totalExpense)
    } catch (error) {
      console.error('Error fetching finance data from Firebase:', error)
    }
  }

  const blocks = [
    {
      title: 'Income',
      icon: 'money',
      iconType: FontAwesome,
      value: income
    },
    {
      title: 'Expense',
      icon: 'cash-minus',
      iconType: MaterialCommunityIcons,
      value: expense
    },
    {
      title: 'Profit',
      icon: 'wallet',
      iconType: MaterialIcons,
      value: income - expense // Revenue = Income - Expense
    }
  ]

  return (
    <View style={{ padding: 10 }}>
      <Text style={styles.headerText}>
        My <Text style={{ fontWeight: '700' }}>Finances</Text>
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          gap: 5
        }}
      >
        {blocks.map((block, index) => (
          <View
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              height: 130,
              width: blockWidth,
              backgroundColor: activeColors.primary[500],
              borderRadius: 15,
              padding: 15
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
                width: '100%'
              }}
            >
              <View
                style={{
                  borderColor: Colors.white,
                  borderWidth: 1,
                  borderRadius: 50,
                  padding: 5,
                  alignSelf: 'flex-start'
                }}
              >
                <block.iconType
                  name={block.icon}
                  size={22}
                  color={Colors.white}
                />
              </View>
              <Text
                style={{
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: 14
                }}
              >
                {block.title}
              </Text>
            </View>
            <View
              style={{
                backgroundColor:
                  block.title === 'Income'
                    ? '#1DB954'
                    : block.title === 'Expense'
                    ? '#E53935'
                    : '#FFB300',
                paddingVertical: 5,
                paddingHorizontal: 10,
                borderRadius: 20,
                alignSelf: 'center'
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: '700'
                }}
              >
                {currency} {block.value.toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerText: {
    padding: 10,
    color: Colors.white,
    fontSize: 16
  }
})

export default FinanceBlock
