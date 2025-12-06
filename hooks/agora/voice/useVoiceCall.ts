// import { useEffect, useRef, useState } from "react";
// import { ChannelProfileType, ClientRoleType } from "react-native-agora";
// import { useAgoraEngine } from "../useAgoraEngine";
// import { getSocket } from "@/helpers/utils/socket";
// import useAuth from "@/hooks/auth/useAuth";
// import { Socket } from "socket.io-client";
// import { useRouter } from "expo-router";
// import { useGetUserIdState } from "@/store/UsersStore";
// import { CallType } from "@/helpers/types/chat/call";
// import useCallStore from "@/store/callsStore";

// const useVoiceCall = (tripData: any) => {
//   const { token: authToken, userDetails } = useAuth();

//   const { userId } = useGetUserIdState();

//   const [callDuration, setCallDuration] = useState(0);

//   const { initiateCall, currentCall } = useCallStore();

//   const [isInitiatingCall, setIsInitiatingCall] = useState(false);
//   const [callType, setCallType] = useState<CallType | null>(null);

//   const isReceiver = userDetails._id !== tripData?.data?.user?._id;

//   // console.log("userId voice call", userId);

//   const router = useRouter();

//   const {
//     setupVoiceSDKEngine,
//     setupEventHandler,
//     setRemoteUid,
//     remoteUid,
//     cleanupAgoraEngine,
//     setIsJoined,
//     isJoined,
//     message,
//     setMessage,
//     localUid,
//     token,
//     channelName,
//     agoraEngineRef,
//   } = useAgoraEngine();

//   const leave = () => {
//     agoraEngineRef.current?.leaveChannel();
//     setIsJoined(false);
//   };

//   const join = async () => {
//     console.log("joining room");
//     console.log({ isJoined });
//     if (isJoined) {
//       return;
//     }
//     // Join the channel as a broadcaster
//     agoraEngineRef.current?.joinChannel(token, channelName, localUid, {
//       // Set channel profile to live broadcast
//       channelProfile: ChannelProfileType.ChannelProfileCommunication,
//       // Set user role to broadcaster
//       clientRoleType: ClientRoleType.ClientRoleBroadcaster,
//       // Publish audio collected by the microphone
//       publishMicrophoneTrack: true,
//       // Automatically subscribe to all audio streams
//       autoSubscribeAudio: true,
//     });
//   };

//   const acceptCall = () => {
//     join();
//   };

//   const rejectCall = () => {
//     leave();
//     router.back();
//   };

//   useEffect(() => {
//     // console.log("use effect in voice ran....");

//     if (!authToken) return;

//     console.log("Connecting to socket with token:", authToken);
//     const socket: Socket = getSocket(authToken);

//     socket.on("connect", () => {
//       console.log("✅ Connected to WebSocket voice:", socket.id);
//     });

//     // In your call trigger (onPress), emit to backend:
//     // socket.emit("callUser", {
//     //   callerId: userDetails._id,
//     //   receiverId: tripData?.data?.user?._id,
//     //   signal: tripData?.data._id,
//     // });

//     socket.emit("callUser", {
//       callerId: userDetails._id,
//       callerName: `${userDetails.firstName} ${userDetails.lastName}`,
//       receiverId: tripData?.data?.user?._id,
//       signal: tripData?.data?._id,
//     });

//     socket.on("incomingCall", ({ fromUserId, tripId }) => {
//       // Navigate to "incoming call" screen, or auto-accept and connect
//       // console.log("Incoming call from", fromUserId);
//       // router.push("/callDriver");
//     });

//     socket.on("disconnect", () => {
//       console.log("❌ Disconnected from WebSocket");
//     });

//     return () => {
//       socket.disconnect();
//     };
//   }, [authToken]);

//   useEffect(() => {
//     let timer: NodeJS.Timeout;

//     if (isJoined) {
//       timer = setInterval(() => {
//         setCallDuration((prev) => prev + 1);
//       }, 1000);
//     } else {
//       setCallDuration(0);
//     }

//     return () => clearInterval(timer);
//   }, [isJoined]);

//   useEffect(() => {
//     const init = async () => {
//       await setupVoiceSDKEngine();
//       setupEventHandler();
//     };
//     init();
//     return () => {
//       cleanupAgoraEngine();
//     };
//   }, []);

//   return {
//     leave,
//     setMessage,
//     setRemoteUid,
//     join,
//     initiateCall, 
//     currentCall,
//     callType, 
//     setCallType,
//     message,
//     remoteUid,
//     isJoined,
//     callDuration,
//     receiverId: userId,
//     isInitiatingCall, 
//     setIsInitiatingCall,
//     acceptCall,
//     rejectCall,
//   };
// };

// export default useVoiceCall;
