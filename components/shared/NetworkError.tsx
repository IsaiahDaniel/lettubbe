// import React from 'react'
// import { View } from 'react-native'
// import { Image } from 'react-native';
// import Typography from '../ui/Typography/Typography';
// import AppButton from '../ui/AppButton';
// import { Colors, Icons } from '@/constants';
// import { useCustomTheme } from "@/hooks/useCustomTheme";

// type ErrorProps = {
//     refetch: () => void;
//     error: any;
// }

// const NetworkError = ({ refetch, error }: ErrorProps) => {
//       const { theme } = useCustomTheme();
    
//     return (
//         <View style={{ 
//             flex: 1, 
//             justifyContent: "center", 
//             alignItems: "center", 
//             paddingHorizontal: 40,
//             backgroundColor: 'transparent' 
//         }}>
//             <Image
//                 source={Icons.offline}
//                 style={{ height: 78, width: 62, resizeMode: "contain" }}
//                 tintColor={Colors[theme].textBold}
//             />
            
//             {/* Error Message */}
//             <Typography size={18} weight="500" style={{ 
//                 textAlign: 'center',
//                 marginBottom: 8,
//             }}>
//                 You're Offline
//             </Typography>
            
//             <Typography size={14} textType='secondary' style={{ 
//                 textAlign: 'center',
//                 marginBottom: 30,
//             }}>
//                 Please connect to the internet and try again.
//             </Typography>
            
//             {/* Retry Button */}
//             <View style={{ width: 100}}>
//                 <AppButton 
//                     variant='secondary'
//                     title='Retry' 
//                     icon={Icons.retry}
//                     handlePress={refetch}
//                 />
//             </View>
//         </View>
//     );
// }

// export default NetworkError;

import React from 'react'
import { View } from 'react-native'
import { Image } from 'react-native';
import Typography from '../ui/Typography/Typography';
import AppButton from '../ui/AppButton';
import { Colors, Icons } from '@/constants';
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { useNetworkInfo } from '@/hooks/useNetworkInfo';
import { handleGetError } from '@/helpers/utils/handleError';

type ErrorProps = {
    refetch: () => void;
    error: any;
}

const NetworkError = ({ refetch, error }: ErrorProps) => {
    const { theme } = useCustomTheme();
    const { isConnected } = useNetworkInfo();

    const isOffline = !isConnected;

    return (
        <View style={{ 
            flex: 1, 
            justifyContent: "center", 
            alignItems: "center", 
            paddingHorizontal: 40,
            backgroundColor: 'transparent' 
        }}>
            <Image
                source={Icons.offline}
                style={{ height: 78, width: 62, resizeMode: "contain" }}
                tintColor={Colors[theme].textBold}
            />
            
            <Typography size={18} weight="500" style={{ 
                textAlign: 'center',
                marginBottom: 8,
            }}>
                {isOffline ? "You're Offline" : "Something Went Wrong"}
            </Typography>
            
            <Typography size={14} textType='secondary' style={{ 
                textAlign: 'center',
                marginBottom: 30,
            }}>
                {isOffline 
                    ? "Please connect to the internet and try again."
                    : handleGetError(error) || "An unexpected error occurred. Please try again."
                }
            </Typography>
            
            <View style={{ width: 100 }}>
                <AppButton 
                    variant='secondary'
                    title='Retry' 
                    // icon={Icons.retry}
                    handlePress={refetch}
                />
            </View>
        </View>
    );
}

export default NetworkError;
