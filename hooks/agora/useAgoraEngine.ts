// import { useRef, useState } from "react";
// import { Platform, PermissionsAndroid } from "react-native";
// import {
//   createAgoraRtcEngine,
//   IRtcEngine,
//   RtcConnection,
//   IRtcEngineEventHandler,
// } from "react-native-agora";

// const getPermission = async () => {
//   if (Platform.OS === "android") {
//     await PermissionsAndroid.requestMultiple([
//       PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//     ]);
//   }
// };

// export const useAgoraEngine = () => {
//   const agoraEngineRef = useRef<IRtcEngine>();
//   const eventHandler = useRef<IRtcEngineEventHandler>();

//   const [isJoined, setIsJoined] = useState(false);
//   const [remoteUid, setRemoteUid] = useState(0);
//   const [message, setMessage] = useState("");
//   const [isMuted, setIsMuted] = useState(false);

//   const appId = "d7763a13c4ff4f519483f0485a4befe0";
//   const token =
//     "007eJxTYPCzX/wxzvvpprY/ydNna+3/GdpolfemtP71HT7D2t1THx5QYEgxNzczTjQ0TjZJSzNJMzW0NLEwTjMwsTBNNElKTUs1ENX6lN4QyMhg9HwtCyMDBIL4PAwpqbn5uskZiXl5qTkMDAAzOyT3";
//   const channelName = "demo-channel";
//   const localUid = 0;
//   // const isReceiver = userDetails._id !== tripData?.data?.user?._id;


//   const setupEventHandler = () => {
//     console.log("setting up event ran....");

//     eventHandler.current = {
//       // Triggered when the local user successfully joins a channel
//       onJoinChannelSuccess: () => {
//         setMessage("Successfully joined channel: " + channelName);
//         setIsJoined(true);
//       },
//       // Triggered when a remote user joins the channel
//       onUserJoined: (_connection: RtcConnection, uid: number) => {
//         setMessage("Remote user " + uid + " joined");
//         setRemoteUid(uid);
//       },
//       // Triggered when a remote user leaves the channel
//       onUserOffline: (_connection: RtcConnection, uid: number) => {
//         setMessage("Remote user " + uid + " left the channel");
//         setRemoteUid(uid);
//       },
//       onError: () => {
//         console.log("error setting setting up event");
//       },
//     };
//     // Register the event handler
//     agoraEngineRef.current?.registerEventHandler(eventHandler.current);
//   };

//   const setupVoiceSDKEngine = async () => {
//     if (Platform.OS === "android") {
//       await getPermission();
//     }
//     agoraEngineRef.current = createAgoraRtcEngine();
//     const agoraEngine = agoraEngineRef.current;
//     await agoraEngine.initialize({ appId: appId });
//   };

//   const cleanupAgoraEngine = () => {
//     return () => {
//       agoraEngineRef.current?.unregisterEventHandler(eventHandler.current!);
//       agoraEngineRef.current?.release();
//     };
//   };

//   const toggleMute = () => {
//     if (agoraEngineRef.current) {
//       agoraEngineRef.current.muteLocalAudioStream(!isMuted);
//       setIsMuted(!isMuted);
//     }
//   };

//   return {
//     setupVoiceSDKEngine,
//     cleanupAgoraEngine,
//     setupEventHandler,
//     agoraEngineRef,
//     message,
//     setMessage,
//     remoteUid,
//     setRemoteUid,
//     isJoined,
//     setIsJoined,
//     isMuted,
//     toggleMute,
//     token,
//     localUid,
//     channelName,
//   };
// };
