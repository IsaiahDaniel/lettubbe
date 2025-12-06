// import { KeyboardAvoidingView } from "react-native";
// import React from "react";
// import Wrapper from "@/components/utilities/Wrapper";

// const KeyboardWrapper = ({ children }: { children: React.ReactNode }) => {
// 	return (
// 		<KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
// 			<Wrapper>{children}</Wrapper>
// 		</KeyboardAvoidingView>
// 	);
// };

// export default KeyboardWrapper;

import React from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Wrapper from "./Wrapper";

const KeyboardWrapper = ({ children, noPadding = false }: { children: React.ReactNode; noPadding?: boolean }) => {
	return (
		<KeyboardAwareScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
			<Wrapper noPadding={noPadding}>{children}</Wrapper>
		</KeyboardAwareScrollView>
	);
};

export default KeyboardWrapper;
