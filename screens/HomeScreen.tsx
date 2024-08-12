import React from 'react'
import { View, StyleSheet, Text } from 'react-native'

interface IHomeScreenProps {
    
}

const HomeScreen = (props: IHomeScreenProps) => {
     return (
         <View style={styles.container}>
            <Text>Home Screen</Text>
         </View>
     )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: { 
    alignItems: "center", 
    flex: 1, 
    justifyContent: "center"
  }
})