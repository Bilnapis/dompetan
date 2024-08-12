import React, { memo } from 'react'
import { View, StyleSheet, Text } from 'react-native'



const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Home Screen</Text>
    </View>
  )
}

export default memo(HomeScreen)

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  }
})