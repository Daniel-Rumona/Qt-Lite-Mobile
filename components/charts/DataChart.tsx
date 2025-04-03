import SegmentedControl from '@react-native-segmented-control/segmented-control'
import React, { useState, useEffect } from 'react'
import {
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
  Alert
} from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db, auth } from '@/FirebaseConfig'
import axios from 'axios'

enum PredictionInterval {
  Monthly = 'Monthly',
  Yearly = 'Yearly'
}

export default function DataChart ({ dataType }) {
  const [predictionInterval, setPredictionInterval] =
    useState<PredictionInterval>(PredictionInterval.Monthly)
  const [historicalData, setHistoricalData] = useState([])
  const [predictedData, setPredictedData] = useState([])
  const [loading, setLoading] = useState(true)
  const [predicting, setPredicting] = useState(false)
  const [isPredictionMade, setIsPredictionMade] = useState(false)
  const [chartKey, setChartKey] = useState(0)

  useEffect(() => {
    fetchData()
  }, [predictionInterval, dataType])

  const fetchData = async () => {
    setLoading(true)
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')

      const transactionsRef = collection(db, 'transactions')
      const q = query(
        transactionsRef,
        where('user_id', '==', userId),
        where('type', '==', dataType)
      )

      const querySnapshot = await getDocs(q)
      const rawData = querySnapshot.docs.map(doc => doc.data())

      const processedData =
        predictionInterval === PredictionInterval.Monthly
          ? groupDataByMonth(rawData)
          : groupDataByYear(rawData)

      setHistoricalData(processedData)
      setPredictedData([])
      setIsPredictionMade(false)
      setChartKey(prevKey => prevKey + 1)
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data.')
    } finally {
      setLoading(false)
    }
  }

  const groupDataByMonth = data => {
    const groupedData = {}
    data.forEach(item => {
      const date = new Date(item.date)
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`
      if (!groupedData[monthYear]) groupedData[monthYear] = 0
      groupedData[monthYear] += item.amount
    })
    return Object.entries(groupedData).map(([label, value]) => ({
      label,
      value
    }))
  }

  const groupDataByYear = data => {
    const groupedData = {}
    data.forEach(item => {
      const date = new Date(item.date)
      const year = date.getFullYear()
      if (!groupedData[year]) groupedData[year] = 0
      groupedData[year] += item.amount
    })
    return Object.entries(groupedData).map(([label, value]) => ({
      label,
      value
    }))
  }

  const handlePrediction = async () => {
    setPredicting(true)
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')

      const response = await axios.post(
        'https://Quantilytix-Qxlite-AI.hf.space/predict_metric',
        {
          user_id: userId,
          interval:
            predictionInterval === PredictionInterval.Monthly ? 30 : 365,
          metric_type: dataType
        }
      )

      const result = response.data
      const newPredictedData = result.predictedData.map((entry, index) => ({
        value: entry.value,
        label:
          predictionInterval === PredictionInterval.Monthly
            ? `Pred ${index + 1}`
            : `Year ${index + 1}`
      }))

      setPredictedData(newPredictedData)
      setChartKey(prevKey => prevKey + 1)
      setIsPredictionMade(true)
    } catch (error) {
      Alert.alert('Error', 'Prediction failed.')
    } finally {
      setPredicting(false)
    }
  }

  const combinedData = [...historicalData, ...predictedData]

  return (
    <View>
      <SegmentedControl
        values={['Monthly', 'Yearly']}
        selectedIndex={[
          PredictionInterval.Monthly,
          PredictionInterval.Yearly
        ].indexOf(predictionInterval)}
        onChange={event => {
          const interval = [
            PredictionInterval.Monthly,
            PredictionInterval.Yearly
          ][event.nativeEvent.selectedSegmentIndex]
          setPredictionInterval(interval)
          setIsPredictionMade(false)
        }}
      />
      <TouchableOpacity style={styles.button} onPress={handlePrediction}>
        <Text style={styles.buttonText}>
          {predicting ? 'Predicting...' : 'Predict'}
        </Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator
          size='large'
          color='blue'
          style={{ marginTop: 20 }}
        />
      ) : (
        <LineChart
          key={chartKey}
          data={combinedData}
          height={200}
          width={300}
          thickness={2}
          color='blue'
          spacing={40}
          isAnimated
          yAxisTextStyle={{ color: 'gray' }}
          xAxisLabelTextStyle={{ color: 'gray' }}
          adjustToContentInset={true}
          hideDataPoints={false}
          dataPointsRadius={3}
          dataPointsColor='black'
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'deepskyblue',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
})
