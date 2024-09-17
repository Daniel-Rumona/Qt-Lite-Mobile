import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router"; // Import the useRouter from expo-router

const TransPlot = () => {
  const [timePeriod, setTimePeriod] = useState('week'); // Set default period to 'week'
  const router = useRouter(); // Initialize router for navigation

  const data = {
    week: [
      { value: 200, label: 'Mon' },
      { value: 300, label: 'Tue' },
      { value: 500, label: 'Wed' },
      { value: 700, label: 'Thu' },
      { value: 600, label: 'Fri' },
    ],
    month: [
      { value: 500, label: 'Week 1' },
      { value: 700, label: 'Week 2' },
      { value: 400, label: 'Week 3' },
      { value: 900, label: 'Week 4' },
    ],
    year: [
      { value: 4000, label: 'Jan' },
      { value: 3000, label: 'Feb' },
      { value: 4500, label: 'Mar' },
      { value: 7000, label: 'Apr' },
      { value: 5000, label: 'May' },
    ],
  };

  const handleTimePeriodChange = (period: string) => {
    setTimePeriod(period);
  };

  const navigateBack = () => {
    router.back(); // Navigate back to the index page
  };

  return (
    <View style={styles.container}>

      {/* Title */}
      <Text style={styles.title}>Transaction Trends</Text>

      {/* Time Period Selection */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={timePeriod === "week" ? styles.selectedButton : styles.button}
          onPress={() => handleTimePeriodChange("week")}
        >
          <Text style={styles.buttonText}>Week</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={timePeriod === "month" ? styles.selectedButton : styles.button}
          onPress={() => handleTimePeriodChange("month")}
        >
          <Text style={styles.buttonText}>Month</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={timePeriod === "year" ? styles.selectedButton : styles.button}
          onPress={() => handleTimePeriodChange("year")}
        >
          <Text style={styles.buttonText}>Year</Text>
        </TouchableOpacity>
      </View>

      {/* Line Chart */}
      <LineChart
        data={data[timePeriod]}
        width={350} // Increased width for better visibility
        height={250} // Increased height for better visibility
        color={Colors.blue} // Changed to blue to make it more visible against a dark background
        thickness={3}
        spacing={50} // Spread out the x-axis labels
        hideRules={true}
        xAxisLabelTextStyle={{ color: Colors.white }}
        yAxisTextStyle={{ color: Colors.white }}
      />
    </View>
  );
};

export default TransPlot;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    padding: 20,
    paddingTop: 40, // Move content down
  },
  title: {
    color: Colors.white,
    fontSize: 24, // Increased font size
    marginTop: 45, // Add space after the back button
    marginBottom: 30,
    fontWeight: "bold",
    textAlign: "center", // Center the title
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center", // Center the buttons
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.grey,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  selectedButton: {
    backgroundColor: Colors.blue,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 14,
  },
});
