import React, { useState, useContext } from 'react'
import { SafeAreaView, ScrollView, View, StyleSheet, Text } from 'react-native'
import { Button } from '@react-native-material/core'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import FormAppBar from '@/components/FormAppBar'
import MessageModal from '@/components/modals/MessageModal'
import { MessageTypes } from '@/components/modals/types'
import { useMessageModal } from '@/hooks'
import { LineChart } from 'react-native-gifted-charts'
import Slider from '@react-native-community/slider'

export default function PredictiveAnalytics () {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()
  const [predictions, setPredictions] = useState([])
  const [selectedMonths, setSelectedMonths] = useState(3) // Default: 3 months

  // Historical Revenue Data (Last 6 Months)
  const pastRevenue = [
    { value: 5000, dataPointText: '5000', label: 'Jan' },
    { value: 5200, dataPointText: '5200', label: 'Feb' },
    { value: 5400, dataPointText: '5400', label: 'Mar' },
    { value: 5600, dataPointText: '5600', label: 'Apr' },
    { value: 5900, dataPointText: '5900', label: 'May' },
    { value: 6200, dataPointText: '6200', label: 'Jun' } // LAST KNOWN MONTH
  ]

  // Generate Predictions
  const handleRevenueProjection = () => {
    let futurePredictions = []
    let predictedRevenue = pastRevenue[pastRevenue.length - 1].value // Start from June
    const futureMonths = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    for (let i = 0; i < selectedMonths; i++) {
      predictedRevenue *= 1.05 // Apply 5% growth per month
      futurePredictions.push({
        value: parseFloat(predictedRevenue.toFixed(2)),
        dataPointText: predictedRevenue.toFixed(2),
        label: futureMonths[i] // FUTURE MONTHS STARTING FROM JULY
      })
    }

    setPredictions(futurePredictions)
    showMessageModal(
      MessageTypes.SUCCESS,
      'Prediction Generated',
      `Projected revenue for the next ${selectedMonths} months has been calculated.`,
      hideMessageModal
    )
  }

  // Generate X-Axis Labels (Combine Past and Predicted)
  const xAxisLabels = [
    ...pastRevenue.map(d => d.label),
    ...predictions.map(d => d.label)
  ]

  // Determine dynamic Y-axis range
  const allData = [...pastRevenue, ...predictions]
  const maxRevenue = Math.max(...allData.map(d => d.value)) + 100
  const minRevenue = Math.min(...allData.map(d => d.value)) - 100
  const yAxisStep = Math.ceil((maxRevenue - minRevenue) / 4)

  return (
    <SafeAreaView
      style={{
        backgroundColor: activeColors.primary[200],
        flex: 1,
        padding: 10
      }}
    >
      <FormAppBar title={'Predictive Analytics'} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* SLIDER FOR PREDICTION PERIOD */}
        <Text style={styles.label}>
          Select Prediction Period: {selectedMonths} Months
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={6}
          step={1}
          value={selectedMonths}
          onValueChange={value => setSelectedMonths(value)}
          minimumTrackTintColor='blue'
          maximumTrackTintColor='gray'
          thumbTintColor='blue'
        />

        {/* CHART */}
        <ScrollView horizontal>
          <LineChart
            data={[...pastRevenue, ...predictions]} // Merge past and future data
            width={700} // Increased width to fit all data
            height={300}
            xAxisLabels={xAxisLabels}
            hideRules
            yAxisOffset={minRevenue}
            maxValue={maxRevenue}
            minValue={minRevenue}
            stepValue={yAxisStep}
            color1='skyblue' // Ensure past line is visible
            color2='lightgreen' // Predictions line
            textColor1='white' // Y-axis text color (attempt 1)
            textColor2='white' // X-axis text color (attempt 1)
            xAxisTextColor='white' // Explicitly set X-axis text
            yAxisTextColor='white' // Explicitly set Y-axis text
            xAxisLabelTextStyle={{ color: 'white', fontSize: 14 }} // Force X-axis white
            yAxisLabelTextStyle={{ color: 'white', fontSize: 14 }} // Force Y-axis white
            hideYAxisText={false} // Ensure Y-axis text isn't hidden
            yAxisColor='white' // Try forcing the Y-axis color itself
            xAxisColor='white' // Try forcing the X-axis color itself
            dataPointsHeight={8}
            dataPointsWidth={8}
            dataPointsColor1='blue' // Past revenue points
            dataPointsColor2='lightgreen' // Future revenue points
            textShiftY={-2}
            textShiftX={-5}
            textFontSize={16} // Increase text size for clarity
          />
        </ScrollView>

        {/* GENERATE PREDICTION BUTTON */}
        <Button
          title='Generate Revenue Prediction'
          onPress={handleRevenueProjection}
          style={[
            styles.submitButton,
            { backgroundColor: activeColors.primary[500] }
          ]}
        />

        <MessageModal {...messageModalState} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 15 },
  slider: { width: '90%', alignSelf: 'center', marginVertical: 10 },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: 'deepskyblue',
    padding: 5,
    borderRadius: 10
  }
})
