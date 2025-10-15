import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getWordsByDifficulty } from '../utils/database';

interface Word {
  id: number;
  word: string;
  meaning: string;
  example: string;
  difficulty: string;
}

interface QuizQuestion {
  word: Word;
  options: string[];
  correctAnswer: string;
}

const EasyQuiz = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredWords, setAnsweredWords] = useState<Set<number>>(new Set());
  const [showSummary, setShowSummary] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);

  useEffect(() => {
    initializeQuiz();
    loadQuizHistory();
  }, []);

  const loadQuizHistory = async () => {
    try {
      const historyJson = await AsyncStorage.getItem('@VT_QUIZ_HISTORY_easy');
      if (historyJson) {
        const history = JSON.parse(historyJson);
        setQuizHistory(history);
        setAttemptNumber(history.length + 1);
      }
    } catch (error) {
      console.error('Error loading quiz history:', error);
    }
  };

  const saveQuizAttempt = async (score: number, total: number, points: number) => {
    try {
      const attempt = {
        attemptNumber: attemptNumber,
        date: new Date().toISOString(),
        score: score,
        totalQuestions: total,
        pointsEarned: points,
        accuracy: Math.round((score / total) * 100)
      };

      const historyJson = await AsyncStorage.getItem('@VT_QUIZ_HISTORY_easy');
      const history = historyJson ? JSON.parse(historyJson) : [];
      history.push(attempt);
      
      await AsyncStorage.setItem('@VT_QUIZ_HISTORY_easy', JSON.stringify(history));
      setQuizHistory(history);
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }
  };

  const initializeQuiz = async () => {
    try {
      const words = await getWordsByDifficulty('easy');
      
      if (words.length < 4) {
        Alert.alert('Error', 'Not enough words for quiz. Need at least 4 words.');
        router.back();
        return;
      }

      // Shuffle all words for randomization
      const quizWords = words.sort(() => Math.random() - 0.5);
      
      // Generate questions with multiple choice options
      const generatedQuestions = quizWords.map((word: Word) => 
        generateQuestion(word, words)
      );
      
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Error initializing quiz:', error);
      Alert.alert('Error', 'Failed to load quiz questions');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const generateQuestion = (correctWord: Word, allWords: Word[]): QuizQuestion => {
    // Get 3 random wrong answers
    const wrongWords = allWords
      .filter(w => w.id !== correctWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    // Combine and shuffle options
    const options = [correctWord.word, ...wrongWords.map(w => w.word)]
      .sort(() => Math.random() - 0.5);
    
    return {
      word: correctWord,
      options,
      correctAnswer: correctWord.word
    };
  };

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback) return; // Prevent changing answer after submission
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) {
      Alert.alert('Please select an answer', 'Choose one of the options before submitting.');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    setShowFeedback(true);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      
      // Award points only if this word hasn't been answered correctly in this session
      if (!answeredWords.has(currentQuestion.word.id)) {
        const points = 10; // Easy quiz: 10 points per correct answer
        setPointsEarned(prev => prev + points);
        setAnsweredWords(prev => new Set(prev).add(currentQuestion.word.id));
        
        // Update total points in AsyncStorage
        try {
          const currentPoints = await AsyncStorage.getItem('@VT_POINTS');
          const newTotal = (currentPoints ? parseInt(currentPoints) : 0) + points;
          await AsyncStorage.setItem('@VT_POINTS', newTotal.toString());
        } catch (error) {
          console.error('Error updating points:', error);
        }
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Quiz complete
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    // Save quiz attempt to history
    await saveQuizAttempt(correctAnswers, questions.length, pointsEarned);

    // Update last activity
    try {
      await AsyncStorage.setItem('@VT_LAST_ACTIVITY', `Completed Easy Quiz (Attempt #${attemptNumber}): ${correctAnswers}/${questions.length} correct`);
    } catch (error) {
      console.error('Error updating last activity:', error);
    }

    setShowSummary(true);
  };

  const handleRetryQuiz = () => {
    setShowSummary(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setCorrectAnswers(0);
    setAnsweredWords(new Set());
    setPointsEarned(0);
    setAttemptNumber(prev => prev + 1);
    initializeQuiz();
  };

  const getAnswerStyle = (option: string) => {
    if (!showFeedback) {
      return selectedAnswer === option ? styles.optionSelected : styles.option;
    }
    
    if (option === questions[currentQuestionIndex].correctAnswer) {
      return styles.optionCorrect;
    }
    
    if (selectedAnswer === option && option !== questions[currentQuestionIndex].correctAnswer) {
      return styles.optionIncorrect;
    }
    
    return styles.optionDisabled;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF5252" />
        <Text style={styles.errorText}>No questions available</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Easy Quiz</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Question Card */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Ionicons name="help-circle" size={28} color="#4CAF50" />
            <Text style={styles.questionLabel}>What word matches this meaning?</Text>
          </View>
          <Text style={styles.questionText}>{currentQuestion.word.meaning}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={getAnswerStyle(option)}
              onPress={() => handleAnswerSelect(option)}
              disabled={showFeedback}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionNumber}>
                  <Text style={styles.optionNumberText}>{String.fromCharCode(65 + index)}</Text>
                </View>
                <Text style={styles.optionText}>{option}</Text>
              </View>
              {showFeedback && option === currentQuestion.correctAnswer && (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              )}
              {showFeedback && selectedAnswer === option && option !== currentQuestion.correctAnswer && (
                <Ionicons name="close-circle" size={24} color="#F44336" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback */}
        {showFeedback && (
          <View style={selectedAnswer === currentQuestion.correctAnswer ? styles.feedbackCorrect : styles.feedbackIncorrect}>
            <Ionicons 
              name={selectedAnswer === currentQuestion.correctAnswer ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={selectedAnswer === currentQuestion.correctAnswer ? "#4CAF50" : "#F44336"} 
            />
            <Text style={styles.feedbackText}>
              {selectedAnswer === currentQuestion.correctAnswer 
                ? '✓ Correct! Well done!' 
                : `✗ Incorrect. The correct answer is "${currentQuestion.correctAnswer}"`}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!showFeedback ? (
            <TouchableOpacity 
              style={[styles.submitButton, !selectedAnswer && styles.submitButtonDisabled]}
              onPress={handleSubmitAnswer}
              disabled={!selectedAnswer}
            >
              <Text style={styles.submitButtonText}>Submit Answer</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
              <Text style={styles.nextButtonText}>
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Summary Modal */}
      <Modal
        visible={showSummary}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalContainer}>
          <View style={styles.summaryCard}>
            <Ionicons name="trophy" size={64} color="#4CAF50" />
            <Text style={styles.summaryTitle}>Quiz Complete!</Text>
            <Text style={styles.attemptNumber}>Attempt #{attemptNumber}</Text>
            
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{correctAnswers}/{questions.length}</Text>
                <Text style={styles.statLabel}>Correct Answers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>+{pointsEarned}</Text>
                <Text style={styles.statLabel}>Points Earned</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round((correctAnswers / questions.length) * 100)}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>

            {correctAnswers === questions.length && (
              <View style={styles.perfectScore}>
                <Ionicons name="star" size={24} color="#FFD700" />
                <Text style={styles.perfectScoreText}>Perfect Score! 🎉</Text>
              </View>
            )}

            {/* Quiz History */}
            {quizHistory.length > 0 && (
              <View style={styles.historyContainer}>
                <Text style={styles.historyTitle}>Recent Attempts:</Text>
                {quizHistory.slice(-3).reverse().map((attempt, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyText}>
                      Attempt #{attempt.attemptNumber}: {attempt.score}/{attempt.totalQuestions} ({attempt.accuracy}%)
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.summaryButtons}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetryQuiz}>
                <Ionicons name="refresh" size={20} color="#4CAF50" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/')}>
                <Ionicons name="home" size={20} color="#fff" />
                <Text style={styles.homeButtonText}>Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EasyQuiz;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4CAF50',
    borderRadius: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 140,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  optionCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  optionIncorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F44336',
  },
  optionDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  feedbackCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  feedbackIncorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  feedbackText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  attemptNumber: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 20,
  },
  summaryStats: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  perfectScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF9C4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginBottom: 24,
  },
  perfectScoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57F17',
  },
  historyContainer: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  historyItem: {
    paddingVertical: 6,
  },
  historyText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
  },
  summaryButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    gap: 8,
  },
  retryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    gap: 8,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

