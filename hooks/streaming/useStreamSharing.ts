import { useState, useMemo } from 'react';
import { Share, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { getSocket } from '@/helpers/utils/socket';
import showToast from '@/helpers/utils/showToast';
import { generateDeepLink } from '@/helpers/utils/deepLinkUtils';
import { UpcomingStream } from '@/helpers/types/streaming/streaming.types';

export const useStreamSharing = (streamData: UpcomingStream, userDetails: any, token: string) => {
  const [caption, setCaption] = useState('');

  const shareLink = useMemo(() => generateDeepLink('streaming', streamData._id), [streamData._id]);
  
  const userInfo = useMemo(() => ({
    firstName: streamData.user?.user?.firstName || "",
    lastName: streamData.user?.user?.lastName || "",
    profilePicture: streamData.user?.user?.profilePicture || "",
    username: streamData.user?.user?.username || ""
  }), [streamData.user?.user]);

  // const shareText = useMemo(() => 
  //   `Check out this ${streamData.isLive ? 'live stream' : 'upcoming stream'} by ${userInfo.firstName} ${userInfo.lastName}`,
  //   [streamData.isLive, userInfo.firstName, userInfo.lastName]
  // );
  const shareText = useMemo(() => 
    ``,
    [streamData.isLive, userInfo.firstName, userInfo.lastName]
  );

  const sendToChat = (receiverId: string) => {
    const socket = getSocket(token);
    if (socket && userDetails) {
      // Create stream data object for SharedStreamCard
      const streamShareData = {
        streamId: streamData._id,
        title: streamData.title,
        description: streamData.description,
        coverPhoto: streamData.coverPhoto,
        startDate: streamData.startDate,
        time: streamData.time,
        isLive: streamData.isLive,
        views: streamData.views,
        userName: `${userInfo.firstName} ${userInfo.lastName}`.trim(),
        userAvatar: userInfo.profilePicture,
      };

      const streamMessage = {
        sender: userDetails._id,
        receiver: receiverId,
        text: `lettubbe://streaming/${streamData._id}`,
        streamData: streamShareData, // Include stream data for card rendering
        messageType: 'stream', // Identify this as a stream share
        userId: userDetails._id,
      };
      socket.emit('chat', streamMessage);
      
      if (caption.trim()) {
        setTimeout(() => {
          socket.emit('chat', {
            sender: userDetails._id,
            receiver: receiverId,
            text: caption.trim(),
            userId: userDetails._id,
          });
        }, 300);
      }
      showToast('success', 'Stream shared!');
    }
  };

  const sendToCommunity = (communityId: string) => {
    const socket = getSocket(token);
    if (socket && userDetails) {
      // Create stream data object for SharedStreamCard
      const streamShareData = {
        streamId: streamData._id,
        title: streamData.title,
        description: streamData.description,
        coverPhoto: streamData.coverPhoto,
        startDate: streamData.startDate,
        time: streamData.time,
        isLive: streamData.isLive,
        views: streamData.views,
        userName: `${userInfo.firstName} ${userInfo.lastName}`.trim(),
        userAvatar: userInfo.profilePicture,
      };

      const streamMessage = {
        sender: userDetails._id,
        groupId: communityId,
        text: `lettubbe://streaming/${streamData._id}`,
        streamData: streamShareData, // Include stream data for card rendering
        messageType: 'stream', // Identify this as a stream share
        userId: userDetails._id,
      };
      socket.emit('GroupChat', streamMessage);
      
      if (caption.trim()) {
        setTimeout(() => {
          socket.emit('GroupChat', {
            sender: userDetails._id,
            groupId: communityId,
            text: caption.trim(),
            userId: userDetails._id,
          });
        }, 300);
      }
      showToast('success', 'Stream shared!');
    }
  };

  const shareToWhatsApp = async () => {
    try {
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(`${shareText}${shareLink}`)}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        showToast('error', 'WhatsApp is not installed');
      }
    } catch (error) {
      showToast('error', 'Failed to share to WhatsApp');
    }
  };

  const shareToTwitter = async () => {
    try {
      const twitterUrl = `twitter://post?message=${encodeURIComponent(`${shareText}${shareLink}`)}`;
      const webTwitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText}${shareLink}`)}`;
      
      const canOpen = await Linking.canOpenURL(twitterUrl);
      if (canOpen) {
        await Linking.openURL(twitterUrl);
      } else {
        await Linking.openURL(webTwitterUrl);
      }
    } catch (error) {
      showToast('error', 'Failed to share to X');
    }
  };

  const shareToTelegram = async () => {
    try {
      const telegramUrl = `tg://msg?text=${encodeURIComponent(`${shareText}${shareLink}`)}`;
      const canOpen = await Linking.canOpenURL(telegramUrl);
      if (canOpen) {
        await Linking.openURL(telegramUrl);
      } else {
        showToast('error', 'Telegram is not installed');
      }
    } catch (error) {
      showToast('error', 'Failed to share to Telegram');
    }
  };

  const shareToSystem = async () => {
    try {
      await Share.share({
        message: `${shareText}${shareLink}`,
        title: 'Share Stream'
      });
    } catch (error) {
      showToast('error', 'Failed to open share menu');
    }
  };

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(shareLink);
      showToast('success', 'Stream link copied to clipboard!');
    } catch (error) {
      showToast('error', 'Failed to copy link');
    }
  };

  return {
    caption,
    setCaption,
    shareLink,
    shareText,
    userInfo,
    sendToChat,
    sendToCommunity,
    shareToWhatsApp,
    shareToTwitter,
    shareToTelegram,
    shareToSystem,
    copyToClipboard,
  };
};