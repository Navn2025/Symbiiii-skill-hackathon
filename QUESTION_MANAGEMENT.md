# Question Management System

A comprehensive question management system that allows interviewers to select from a library, generate questions using AI, or create custom questions during interviews.

## Features

### 📚 Three Question Modes

#### 1. Question Library

- Browse existing questions from the database
- Filter by difficulty and category
- Quick selection with one click
- View question details before selection

#### 2. AI Question Generation

- Generate custom questions using AI (Groq LLaMA)
- Configure difficulty level (Easy, Medium, Hard)
- Choose from multiple categories:
  - Algorithms
  - Arrays
  - Strings
  - Trees
  - Graphs
  - Dynamic Programming
  - Sorting & Searching
  - Linked Lists
  - Stack & Queue
- Optional custom prompts for specific requirements
- Preview and regenerate options
- Automatically includes starter code for Python, JavaScript, and Java

#### 3. Custom Question Creation

- Create fully custom questions
- Set title, difficulty, and category
- Write detailed descriptions
- Add multiple input/output examples
- Provide starter code for multiple languages
- Full control over question content

## How to Use

### For Interviewers/Recruiters

#### During Interview Start

1. **Join as Recruiter** - When you join an interview room as a recruiter
2. **Question Selector Opens** - The question selector modal automatically appears
3. **Choose Your Mode:**
   - Click **"📚 Question Library"** to browse existing questions
   - Click **"🤖 AI Generate"** to create questions with AI
   - Click **"✏️ Custom Question"** to write your own

#### Changing Questions Mid-Interview

1. Click the **"📝 Change Question"** button in the interview header
2. The question selector modal will open
3. Select a new question using any of the three modes
4. The new question is instantly sent to the candidate via Socket.io

### 1. Using Question Library

```
1. Click "📚 Question Library" tab
2. Browse through available questions
3. Each card shows:
   - Title and difficulty badge
   - Category
   - Description preview
4. Click "Select This Question" button
5. Question is loaded into the interview
```

### 2. Generating AI Questions

```
1. Click "🤖 AI Generate" tab
2. Select difficulty level (Easy/Medium/Hard)
3. Choose a category
4. (Optional) Enter custom prompt:
   Example: "Generate a question about finding the longest palindrome"
5. Click "✨ Generate Question"
6. Review the generated question
7. Click "✅ Use This Question" or "🔄 Regenerate"
```

**AI Generation Example:**

```javascript
Request:
{
  "difficulty": "medium",
  "category": "arrays",
  "customPrompt": "Find the maximum sum subarray"
}

Response:
{
  "title": "Maximum Subarray Sum",
  "difficulty": "medium",
  "category": "arrays",
  "description": "Given an integer array, find the contiguous subarray...",
  "examples": [...],
  "starterCode": {...}
}
```

### 3. Creating Custom Questions

```
1. Click "✏️ Custom Question" tab
2. Fill in the form:

   Question Title *: Two Sum
   Difficulty: Medium
   Category: arrays

   Description *:
   Given an array of integers nums and an integer target,
   return indices of the two numbers such that they add up to target.

   Examples:
   Input: nums = [2,7,11,15], target = 9
   Output: [0,1]

   [+ Add Example]

   Starter Code:
   - Python: def solution():...
   - JavaScript: function solution() {...}
   - Java: public class Solution {...}

3. Click "✅ Create & Use Question"
```

## API Endpoints

### Generate AI Question

```http
POST /api/ai/generate-question
Content-Type: application/json

{
  "difficulty": "medium",
  "category": "algorithms",
  "customPrompt": "optional custom instructions"
}

Response:
{
  "question": {
    "title": "string",
    "difficulty": "easy|medium|hard",
    "category": "string",
    "description": "string",
    "examples": [{"input": "string", "output": "string"}],
    "constraints": ["string"],
    "hints": ["string"],
    "starterCode": {
      "python": "string",
      "javascript": "string",
      "java": "string"
    }
  }
}
```

### Create Custom Question

```http
POST /api/questions
Content-Type: application/json

{
  "title": "Question Title",
  "difficulty": "medium",
  "category": "arrays",
  "description": "Problem description",
  "examples": [
    {"input": "input 1", "output": "output 1"}
  ],
  "starterCode": {
    "python": "def solution():\n    pass",
    "javascript": "function solution() {\n    // code\n}",
    "java": "public class Solution {}"
  }
}

Response:
{
  "id": "uuid",
  "title": "Question Title",
  ...
  "createdAt": "ISO8601",
  "isCustom": true
}
```

### Get All Questions

```http
GET /api/questions?difficulty=medium&category=arrays

Response:
[
  {
    "id": "1",
    "title": "Two Sum",
    "difficulty": "easy",
    "category": "arrays",
    ...
  }
]
```

### Update Question

```http
PUT /api/questions/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

### Delete Question

```http
DELETE /api/questions/:id

Response:
{
  "success": true,
  "message": "Question deleted"
}
```

## Socket Events

### Question Updates (Real-time)

**Interviewer Sends:**

```javascript
socket.emit("question-update", {
  interviewId: "uuid",
  question: {
    id: "uuid",
    title: "Question Title",
    // full question object
  },
});
```

**Candidate Receives:**

```javascript
socket.on("question-update", (data) => {
  console.log("New question:", data.question);
  // Update UI with new question
  // Reset code editor with new starter code
});
```

## Component Structure

### QuestionSelector Component

Location: `frontend/src/components/QuestionSelector.jsx`

**Props:**

- `onQuestionSelected(question)` - Callback when question is selected
- `onClose()` - Callback to close the modal

**State:**

- `mode` - Current mode (library|ai|custom)
- `loading` - Loading state
- `error` - Error message
- `generatedQuestion` - AI-generated question
- `customQuestion` - Custom question form data
- `libraryQuestions` - List of questions from library

### Integration in InterviewRoom

```jsx
import QuestionSelector from "../components/QuestionSelector";

// State
const [showQuestionSelector, setShowQuestionSelector] = useState(false);
const [currentQuestion, setCurrentQuestion] = useState(null);

// Handler
const handleQuestionSelected = (question) => {
  setCurrentQuestion(question);
  setCode(question.starterCode?.[language] || "");
  setShowQuestionSelector(false);

  // Broadcast to candidate
  socket.emit("question-update", {
    interviewId,
    question,
  });
};

// Render
{
  showQuestionSelector && role === "recruiter" && (
    <QuestionSelector
      onQuestionSelected={handleQuestionSelected}
      onClose={() => setShowQuestionSelector(false)}
    />
  );
}
```

## User Flow

### Recruiter Workflow

```
1. Join interview as recruiter
   ↓
2. Question Selector modal opens automatically
   ↓
3. Choose question source:
   - Library: Browse → Select
   - AI: Configure → Generate → Review → Use
   - Custom: Fill form → Create
   ↓
4. Question loads in interview room
   ↓
5. Candidate sees question in real-time
   ↓
6. During interview, recruiter can click "Change Question"
   ↓
7. Repeat steps 2-5 as needed
```

### Candidate Workflow

```
1. Join interview as candidate
   ↓
2. See "Waiting for interviewer to select a question..."
   ↓
3. Receive question update via Socket.io
   ↓
4. Question and starter code appear
   ↓
5. Begin coding
   ↓
6. If question changes, receive new question in real-time
   ↓
7. Editor resets with new starter code
```

## AI Question Generation

### Powered by Groq LLaMA

- Model: `llama-3.1-8b-instant`
- Temperature: 0.7 (balanced creativity)
- Max Tokens: 1500

### Prompt Engineering

The system uses structured prompts to ensure high-quality questions:

```
Generate a coding interview question with the following requirements:
- Difficulty: {difficulty}
- Category: {category}

Provide valid JSON with:
- title
- description
- examples (with input/output)
- constraints
- hints
- starterCode (Python, JavaScript, Java)
```

### Fallback Mechanism

If AI generation fails:

1. Returns a fallback question based on selected category
2. Includes proper starter code
3. User can retry generation

## Styling

### Modal Design

- Overlay with 70% opacity background
- Centered modal with max-width 900px
- Responsive design for mobile
- Smooth animations on open/close
- Tab-based navigation between modes

### Color Coding

- **Easy**: Green (#065f46)
- **Medium**: Orange (#92400e)
- **Hard**: Red (#991b1b)

### Interactive Elements

- Hover effects on cards and buttons
- Loading spinners
- Success/error messages
- Real-time preview of generated questions

## Configuration

### Environment Variables

```env
# Backend (.env)
GROQ_API_KEY=your_groq_api_key_here
FRONTEND_URL=http://localhost:5173
PORT=5000
```

### API Configuration

```javascript
// frontend/src/components/QuestionSelector.jsx
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
```

## Best Practices

### For Interviewers

1. **Prepare questions before interview** - Use library or generate AI questions
2. **Review generated questions** - Always preview AI questions before using
3. **Use custom prompts for specificity** - Be detailed in AI prompt for better results
4. **Test questions** - Ensure examples and constraints are clear
5. **Progressive difficulty** - Start easy, increase difficulty based on performance

### For System Administrators

1. **Regularly update question library** - Add new popular questions
2. **Monitor AI generation** - Track success rates and quality
3. **Set up rate limiting** - Prevent API abuse on AI generation
4. **Regular backups** - Back up custom questions database
5. **Update starter code** - Keep boilerplate code modern and idiomatic

## Troubleshooting

### AI Generation Not Working

- Check GROQ_API_KEY in backend .env
- Verify API key is valid and has credits
- Check network connectivity
- Review backend logs for errors
- Fallback question will be used automatically

### Questions Not Updating

- Check Socket.io connection
- Verify both users are in the same interview room
- Check browser console for errors
- Refresh the page

### Custom Question Not Saving

- Ensure title and description are filled
- Check network tab for API errors
- Verify backend is running
- Check CORS configuration

## Future Enhancements

Potential improvements:

- [ ] Question difficulty auto-adjustment based on performance
- [ ] Save favorite questions for quick access
- [ ] Question analytics (usage, success rate)
- [ ] Import questions from external sources (LeetCode, HackerRank)
- [ ] Collaborative question editing
- [ ] Question templates library
- [ ] Video solutions for questions
- [ ] Test case management
- [ ] Solution verification system
- [ ] Question versioning

## File Structure

```
backend/
  routes/
    questions.js        # CRUD operations for questions
    ai.js              # AI question generation
  socket/
    handlers.js        # Socket events including question-update

frontend/
  src/
    components/
      QuestionSelector.jsx    # Main modal component
      QuestionSelector.css    # Styling
      QuestionPanel.jsx       # Question display
    pages/
      InterviewRoom.jsx       # Integration point
    services/
      api.js                 # API calls
```

---

**Status**: ✅ Fully Implemented and Ready for Use

Interview interviewers now have complete flexibility in question selection with AI-powered generation, custom creation, and a comprehensive question library!
