import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import * as tf from '@tensorflow/tfjs'

export default function RevenueProjectionForm () {
  const [currentRevenue, setCurrentRevenue] = useState('')
  const [growthFactor, setGrowthFactor] = useState('')
  const [predictions, setPredictions] = useState([])

  const dummyPastData = [10000, 12000, 14000, 16000, 18000] // Dummy revenue history

  const predictRevenue = () => {
    const revenue = parseFloat(currentRevenue)
    const growth = parseFloat(growthFactor)

    if (isNaN(revenue) || isNaN(growth)) {
      alert('Please enter valid numbers for revenue and growth factor.')
      return
    }

    // Dummy Linear Regression Formula: New Revenue = Current Revenue * (1 + Growth Factor)
    let futurePredictions = []
    let predictedRevenue = revenue

    for (let i = 1; i <= 6; i++) {
      // Predict next 6 months
      predictedRevenue = predictedRevenue * (1 + growth / 100)
      futurePredictions.push(predictedRevenue.toFixed(2))
    }

    setPredictions(futurePredictions)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Revenue Projection Form</Text>

      <Text style={styles.label}>Current Monthly Revenue:</Text>
      <TextInput
        style={styles.input}
        keyboardType='numeric'
        value={currentRevenue}
        onChangeText={setCurrentRevenue}
        placeholder='Enter revenue (e.g., 20000)'
      />

      <Text style={styles.label}>Estimated Growth Factor (% per month):</Text>
      <TextInput
        style={styles.input}
        keyboardType='numeric'
        value={growthFactor}
        onChangeText={setGrowthFactor}
        placeholder='Enter growth factor (e.g., 5)'
      />

      <TouchableOpacity style={styles.button} onPress={predictRevenue}>
        <Text style={styles.buttonText}>Predict Revenue</Text>
      </TouchableOpacity>

      {predictions.length > 0 && (
        <View>
          <Text style={styles.predictionTitle}>
            Projected Revenue (Next 6 Months):
          </Text>

          <LineChart
            data={{
              labels: ['1M', '2M', '3M', '4M', '5M', '6M'],
              datasets: [
                { data: dummyPastData, color: () => 'gray', strokeWidth: 2 }, // Past Data
                {
                  data: predictions.map(Number),
                  color: () => 'blue',
                  strokeWidth: 2
                } // Predicted Data
              ]
            }}
            width={320}
            height={220}
            yAxisLabel='$'
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: () => '#333',
              labelColor: () => '#333'
            }}
            bezier
          />
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  label: { fontSize: 16, marginTop: 10 },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    marginTop: 5
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  predictionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center'
  }
})
