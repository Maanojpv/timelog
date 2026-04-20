import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Folder, Plus, BarChart2, Settings } from 'lucide-react-native';
import { colors } from '../theme/colors';
import HomeScreen from '../screens/HomeScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import LogTimeScreen from '../screens/LogTimeScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { useApp } from '../context/AppContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const LogTabButton = ({ onPress }: { onPress?: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.logBtn}>
    <View style={styles.logBtnCircle}>
      <Plus size={21} color={colors.bg} />
    </View>
    <Text style={styles.logBtnLabel}>Log</Text>
  </TouchableOpacity>
);

const TabIcon = ({
  Icon,
  focused,
  size = 21,
}: {
  Icon: React.ComponentType<{ size: number; color: string }>;
  focused: boolean;
  size?: number;
}) => (
  <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
    <Icon size={size} color={focused ? colors.amber : colors.muted} />
  </View>
);

function TabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { height: 58 + insets.bottom, paddingBottom: insets.bottom + 4 }],
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Folder} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Log"
        component={HomeScreen}
        options={{
          tabBarButton: (props) => (
            <LogTabButton onPress={() => { props.onPress?.({} as any); }} />
          ),
          tabBarLabel: () => null,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('LogTimeModal');
          },
        })}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={BarChart2} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Settings} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { state } = useApp();
  const initialRoute = state.onboardingComplete ? 'Main' : 'Onboarding';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen
          name="LogTimeModal"
          component={LogTimeScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {},
  logBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnLabel: {
    color: colors.amber,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});
