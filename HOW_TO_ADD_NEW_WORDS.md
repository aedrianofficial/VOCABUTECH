# How to Add New Words to VocabUTech

This guide explains how to add new vocabulary words to your app with images and audio.

## 📋 Quick Steps

### 1. Prepare Your Files

Create two files for your new word:
- **Audio file**: `yourword.mp3` (pronunciation audio)
- **Image file**: `yourword.png` (visual representation)

### 2. Add Files to Directories

Copy your files to these locations:
```
src/audio/yourword.mp3
src/images/yourword.png
```

### 3. Update Media Loader

Open `app/utils/mediaLoader.ts` and add your word to both mappings:

**For Audio:**
```typescript
export const audioFiles: { [key: string]: any } = {
  // ... existing words ...
  'yourword': require('../../src/audio/yourword.mp3'),
};
```

**For Images:**
```typescript
export const imageFiles: { [key: string]: any } = {
  // ... existing words ...
  'yourword': require('../../src/images/yourword.png'),
};
```

### 4. Add Word to Database Seed Data

Open `app/utils/seed-data.js` and add your word:

```javascript
export const seedWords = [
  // ... existing words ...
  {
    word: 'yourword',
    meaning: 'Definition of your word',
    example: 'Example sentence using your word.',
    image: 'src/image/yourword.png',
    audio: 'src/audio/yourword.mp3',
    difficulty: 'Easy' // or 'Medium' or 'Hard'
  },
];
```

### 5. Test Your New Word

1. Delete the app from your device/emulator (to reset database)
2. Run `npx expo start`
3. Open the app
4. Navigate through Word List to find your new word
5. Test the audio playback
6. Verify the image displays correctly

## ✅ Checklist

Before adding a new word, make sure:

- [ ] Audio file is `.mp3` format
- [ ] Image file is `.png` format
- [ ] File names match exactly (case-sensitive)
- [ ] File names use lowercase and no spaces
- [ ] Added to `mediaLoader.ts` (both audio and image)
- [ ] Added to `seed-data.js` with correct paths
- [ ] Paths in seed-data use `src/audio/` and `src/image/` format

## 🎯 Example: Adding "Serendipity"

### Step 1: Files
```
src/audio/serendipity.mp3
src/images/serendipity.png
```

### Step 2: mediaLoader.ts
```typescript
// In audioFiles object:
'serendipity': require('../../src/audio/serendipity.mp3'),

// In imageFiles object:
'serendipity': require('../../src/images/serendipity.png'),
```

### Step 3: seed-data.js
```javascript
{
  word: 'serendipity',
  meaning: 'The occurrence of events by chance in a happy or beneficial way',
  example: 'Finding this perfect parking spot was pure serendipity.',
  image: 'src/image/serendipity.png',
  audio: 'src/audio/serendipity.mp3',
  difficulty: 'Hard'
}
```

## 🔧 Troubleshooting

### Image/Audio Not Loading?

1. **Check file names** - Must match exactly (case-sensitive)
2. **Verify paths** - Use `src/audio/` and `src/image/` in seed-data
3. **Check require paths** - Use `../../src/audio/` and `../../src/images/` in mediaLoader
4. **Restart Metro** - Run `npx expo start --clear`
5. **Reinstall app** - Delete and reinstall to reset database

### Word Not Appearing?

1. **Delete app** from device to reset database
2. **Check seed-data.js** - Ensure proper comma separation
3. **Verify difficulty** - Must be 'Easy', 'Medium', or 'Hard' (exact case)
4. **Check console** - Look for database seeding logs

## 📁 File Structure

```
VocabUTech/
├── src/
│   ├── audio/          # All .mp3 files
│   │   ├── abate.mp3
│   │   ├── benevolent.mp3
│   │   └── yourword.mp3
│   └── images/         # All .png files
│       ├── abate.png
│       ├── benevolent.png
│       └── yourword.png
├── app/
│   └── utils/
│       ├── mediaLoader.ts    # Add require() statements here
│       └── seed-data.js      # Add word data here
```

## 💡 Tips

- **Consistent naming**: Use lowercase, no spaces (e.g., `word-name.mp3`)
- **File size**: Keep images under 2MB for better performance
- **Audio quality**: Use clear pronunciation, 5-10 seconds max
- **Test immediately**: Always test after adding new words
- **Backup**: Keep original files before adding to project

## 🚀 Current Words

The app currently has **60 built-in words**:
- Easy: 20 words
- Medium: 22 words
- Hard: 18 words

All words are automatically loaded when the app starts for the first time!

