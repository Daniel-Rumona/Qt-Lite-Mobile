import React, { useState, useContext } from 'react'
import { SafeAreaView, View, StyleSheet, Text } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'
import { ThemeContext } from '@/context/ThemeContext' // Importing Theme Context
import { colors } from '@/config/theme'
import FormAppBar from '@/components/FormAppBar'
import PieChartPlot from '@/components/charts/PieChart'
import TransactionsBarChart from '@/components/charts/TransactionsBarChart'
import QuarterlyPieChart from '@/components/charts/QuarterlyPieChart'
import { Checkbox } from 'react-native-paper'

export default function FinancesForm () {
  const { theme } = useContext(ThemeContext) // Access theme context
  const activeColors = colors[theme.mode] // Apply theme-based colors
  const [selectedView, setSelectedView] = useState('')
  const [checkedMonetary, setCheckedMonetary] = useState(true)

  return (
    <SafeAreaView
      style={{
        backgroundColor: activeColors.primary[100],
        flex: 1,
        padding: 10
      }}
    >
      <FormAppBar title={'Financial View'} />

      <SelectList
        setSelected={value => setSelectedView(value)}
        data={[
          { key: 'Transactions Metrics', value: 'Transactions Metrics' },
          { key: 'Transactions Summary', value: 'Transactions Summary' }
        ]}
        placeholder='Select Chart Type'
        boxStyles={{
          backgroundColor: theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
          borderColor: '#555',
          borderRadius: 5
        }}
        dropdownStyles={{
          backgroundColor: theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
          borderColor: '#555'
        }}
        inputStyles={{
          color: theme.mode === 'light' ? '#000' : '#fff'
        }}
        dropdownTextStyles={{
          color: theme.mode === 'light' ? '#000' : '#fff'
        }}
      />

      <View style={styles.chartContainer}>
        {selectedView === 'Transactions Metrics' && <PieChartPlot />}
        {selectedView === 'Transactions Summary' && (
          <>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Checkbox
                status={checkedMonetary ? 'checked' : 'unchecked'}
                onPress={() => {
                  setCheckedMonetary(!checkedMonetary)
                }}
                color='deepskyblue'
              />
              <Text style={{ color: '#fff' }}>Monetary Value</Text>
            </View>
            <TransactionsBarChart monetaryValue={checkedMonetary} />
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  chartContainer: {
    flex: 1,
    marginTop: 20
  }
})
