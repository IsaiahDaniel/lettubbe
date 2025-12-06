import React from 'react';
import { View, Switch, StyleSheet } from 'react-native';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Typography from '@/components/ui/Typography/Typography';

interface SettingsSectionProps {
  allowComments: boolean;
  onAllowCommentsChange: (value: boolean) => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  allowComments,
  onAllowCommentsChange,
}) => {
  const { theme } = useCustomTheme();

  return (
    <View style={styles.container}>
      <Typography
        weight="600"
        size={14}
        textType="textBold"
        style={styles.label}
      >
        Comments
      </Typography>
      
      <View style={styles.toggleContainer}>
        <Typography textType="text">Disabled</Typography>
        <Switch
          trackColor={{
            false: Colors[theme].cardBackground,
            true: Colors.general.primary,
          }}
          thumbColor={Colors.light.background}
          ios_backgroundColor={Colors[theme].cardBackground}
          onValueChange={onAllowCommentsChange}
          value={allowComments}
        />
        <Typography textType="text">Enabled</Typography>
      </View>
      
      <Typography size={12} textType="secondary" style={styles.helperText}>
        {allowComments
          ? 'Other users can comment on your video'
          : 'Comments are disabled for this video'}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  helperText: {
    marginTop: 4,
    textAlign: 'center',
  },
});