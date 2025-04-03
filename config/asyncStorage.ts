import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Stores data in AsyncStorage under the specified key.
 * @param {string} key - The key under which the value will be stored.
 * @param {any} value - The value to store. It will be serialized to JSON.
 */
export const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value)
    await AsyncStorage.setItem(key, jsonValue)
  } catch (error) {
    alert('Failed to store data. Please try again.')
  }
}

/**
 * Retrieves data from AsyncStorage for the specified key.
 * @param {string} key - The key for the stored value.
 * @returns {Promise<any|null>} The parsed JSON value or null if not found.
 */
export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key)
    return jsonValue != null ? JSON.parse(jsonValue) : null
  } catch (error) {
    alert('Failed to retrieve data. Please try again.')
  }
}
