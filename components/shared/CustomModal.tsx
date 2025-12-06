import { View, Modal, Animated } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { Colors } from "../../constants";

type ModalProps = {
  visible: boolean;
  children: JSX.Element | JSX.Element[];
  width?: any;
};

const CustomModal = ({ children, visible, width }: ModalProps) => {
  const [showModal, setShowModal] = useState(visible);
  const scaleValue = useRef(new Animated.Value(0)).current;

  const toggleModal = () => {
    if (visible) {
      setShowModal(true);
      Animated.spring(scaleValue, {
        toValue: 1,
        // duration: 300,
        speed: 100,
        useNativeDriver: true,
      }).start();
    } else {
      setShowModal(false);
    }
  };

  useEffect(() => {
    toggleModal();
  }, [visible]);

  return (
    <Modal transparent visible={showModal}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Animated.View
          style={{
            width: width ? width : "90%",
            backgroundColor: "#fff",
            paddingHorizontal: 20,
            paddingVertical: 30,
            borderRadius: 10,
            transform: [{ scale: scaleValue }]
          }}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CustomModal;