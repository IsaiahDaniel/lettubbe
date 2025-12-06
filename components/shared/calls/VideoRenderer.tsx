// import React, { useEffect, useState } from 'react';
// import { View, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
// import { RTCView } from 'react-native-webrtc';
// import { MediaStream } from 'react-native-webrtc';
// import Avatar from '@/components/ui/Avatar';
// import { Colors } from '@/constants/Colors';

// // Define a proper interface for your participant
// interface ParticipantProps {
//   contact: {
//     id: string;
//     name: string;
//     avatar?: string;
//   };
//   videoEnabled?: boolean;
//   muted?: boolean;
//   stream?: MediaStream;
// }

// interface VideoRendererProps {
//   participant?: ParticipantProps;
//   isLocalVideo?: boolean;
//   style?: ViewStyle;
// }

// const VideoRenderer: React.FC<VideoRendererProps> = ({ 
//   participant, 
//   isLocalVideo = false,
//   style 
// }) => {
//   const [streamReady, setStreamReady] = useState(false);
  
//   // Extract stream from participant
//   const stream = participant?.stream;
//   const hasVideo = stream && 
//     (participant?.videoEnabled !== false) && 
//     stream.getVideoTracks().length > 0;
  
//   useEffect(() => {
//     if (hasVideo) {
//       // Short delay to allow the stream to initialize
//       const timer = setTimeout(() => {
//         setStreamReady(true);
//       }, 500);
      
//       return () => clearTimeout(timer);
//     } else {
//       setStreamReady(false);
//     }
//   }, [hasVideo, stream]);
  
//   return (
//     <View style={[styles.container, style]}>
//       {hasVideo ? (
//         <>
//           <RTCView
//             streamURL={stream.toURL()}
//             style={styles.rtcView}
//             objectFit="cover"
//             zOrder={isLocalVideo ? 1 : 0}
//             mirror={isLocalVideo} 
//           />
          
//           {!streamReady && (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="large" color={Colors.general.primary} />
//             </View>
//           )}
//         </>
//       ) : (
//         <View style={styles.placeholderContainer}>
//           {participant && (
//             <Avatar
//               imageSource={participant.contact.avatar}
//               uri={!!participant.contact.avatar}
//               alt={participant.contact.name || 'Unknown'}
//               size={100}
//               ringColor="white"
//               ringThickness={2}
//               showRing={true}
//             />
//           )}
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#222',
//     overflow: 'hidden',
//   },
//   rtcView: {
//     flex: 1,
//   },
//   loadingContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   placeholderContainer: {
//     flex: 1,
//     backgroundColor: '#222',
//     justifyContent: 'center',
//     alignItems: 'center',
//   }
// });

// export default VideoRenderer;