import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Platform } from 'react-native';
import { Header } from './components/organisms/Header';
import { HomePage } from './components/pages/HomePage';

const App: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Header />
        <HomePage />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        paddingTop: 0,
      },
      android: {
        paddingTop: 24,
      },
    }),
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
});

export default App;