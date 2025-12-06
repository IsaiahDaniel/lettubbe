import { getData, storeData } from "@/helpers/utils/storage";
import { sendPushToken } from "@/services/notifications.service";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const PUSH_TOKEN_KEY = "expoPushToken";

const useGetPushToken = (pushToken: string) => {
  const [shouldFetch, setShouldFetch] = useState(false);

  const { isSuccess, data, error } = useQuery({
    queryKey: ["getPushToken", pushToken],
    queryFn: () => sendPushToken(pushToken as string),
    enabled: shouldFetch && !!pushToken,
  });

  // console.log("data", data);
  // console.log("error", error);

  useEffect(() => {
    const checkTokenChange = async () => {
      const storedToken = await getData<string>(PUSH_TOKEN_KEY);

      console.log({ storedToken, pushToken });

      // If we have a new push token (different from stored), register it
      if (storedToken !== pushToken && pushToken) {
        console.log("New push token detected, registering with backend");
        setShouldFetch(true);
      }

      if (isSuccess) { 
        await storeData(PUSH_TOKEN_KEY, data?.data.deviceToken);
        console.log("Push token successfully registered and stored");
      }
    };

    checkTokenChange();

  }, [isSuccess, pushToken]);

  return {
    isSuccess,
  };
};

export default useGetPushToken;

// import { useEffect, useState } from "react";
// import { sendPushToken } from "@/services/notifications.service";
// import { useMutation } from "@tanstack/react-query";
// import { getData, storeData } from "@/helpers/utils/storage";

// const PUSH_TOKEN_KEY = "expoPushToken";

// const useGetPushToken = (pushToken: string | null | undefined) => {
//   const [shouldSend, setShouldSend] = useState(false);

//   const { mutate: sendToken, isSuccess, error } = useMutation({
//     mutationFn: sendPushToken,
//     onSuccess: async () => {
//       if (pushToken) {
//         await storeData(PUSH_TOKEN_KEY, pushToken); // Update stored token
//       }
//     },
//   });

//   useEffect(() => {
//     const checkTokenChange = async () => {
//       if (!pushToken) return;

//       const storedToken = await getData<string>(PUSH_TOKEN_KEY);

//       if (storedToken !== pushToken) {
//         setShouldSend(true);
//       }
//     };

//     checkTokenChange();
//   }, [pushToken]);

//   useEffect(() => {
//     if (shouldSend && pushToken) {
//       sendToken(pushToken);
//     }
//   }, [shouldSend, pushToken, sendToken]);

//   return { isSuccess, error };
// };

// export default useGetPushToken;
