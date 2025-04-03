// Optimized Transactions.tsx
import React, { useContext, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { SegmentedButtons } from 'react-native-paper'
import { ThemeContext } from '@/context/ThemeContext'
import Header from '@/components/Header'
import TransactionsList from '@/components/TransactionsList'
import { colors } from '@/config/theme'

const Transactions = () => {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const [filter, setFilter] = useState('All')

  return (
    <View
      style={[styles.container, { backgroundColor: activeColors.primary[200] }]}
    >
      <Header />
      {/* Filter Buttons */}
      <SegmentedButtons
        value={filter}
        onValueChange={value => setFilter(value)}
        buttons={[
          {
            value: 'All',
            label: 'All',
            icon: 'graph',
            uncheckedColor: activeColors.grey[900],
            style: {
              backgroundColor:
                filter === 'All' ? 'deepskyblue' : activeColors.blueAccent[100],
              borderColor: 'transparent'
            }
          },
          {
            value: 'Income',
            label: 'Income',
            icon: 'cash-plus',
            uncheckedColor: activeColors.grey[900],
            style: {
              backgroundColor:
                filter === 'Income'
                  ? 'deepskyblue'
                  : activeColors.blueAccent[100],
              borderColor: 'transparent'
            }
          },
          {
            value: 'Expense',
            label: 'Expense',
            icon: 'cash-minus',
            uncheckedColor: activeColors.grey[900],
            style: {
              backgroundColor:
                filter === 'Expense'
                  ? 'deepskyblue'
                  : activeColors.blueAccent[100],
              borderColor: 'transparent'
            }
          }
        ]}
        style={styles.segmentedButtons}
      />
      <View style={styles.scrollView}>
        <TransactionsList filter={filter} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { padding: 5, paddingBottom: 120 },
  segmentedButtons: { margin: 10 }
})

export default Transactions
