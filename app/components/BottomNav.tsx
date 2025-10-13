import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: 'home',
      iconType: 'ionicons' as const,
    },
    {
      name: 'Flashcards',
      path: '/flash_card',
      icon: 'cards',
      iconType: 'material' as const,
    },
    {
      name: 'Words',
      path: '/wordlist',
      icon: 'list',
      iconType: 'ionicons' as const,
    },
    {
      name: 'Quiz',
      path: '/quiz',
      icon: 'school',
      iconType: 'ionicons' as const,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.navBar}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link key={item.path} href={item.path as any} asChild>
              <TouchableOpacity style={styles.navItem}>
                {item.iconType === 'ionicons' ? (
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={active ? '#2196F3' : '#666'}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={24}
                    color={active ? '#2196F3' : '#666'}
                  />
                )}
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {item.name}
                </Text>
                {active && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  navLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: 3,
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
});

