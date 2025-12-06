import { View, Text } from 'react-native'
import React from 'react'
import Wrapper from './Wrapper'

type CenterProps = {
    children: JSX.Element | JSX.Element[]
}

const Center = ({ children }: CenterProps) => {
  return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        { children }
      </View>
  )
}

export default Center