# Statistics API

This document details the statistics tracking system in UniHub, which allows users to monitor their learning progress across topics and activities.

## Overview

The statistics system captures and analyzes user learning activities, providing insights on:
- Study time allocation
- Quiz performance metrics
- Topic engagement
- Learning progress over time

## API Endpoints

### Get User Learning Statistics

**Endpoint:** `GET /api/statistics`

**Description:** Retrieves comprehensive statistics for the current user.

**Authentication:** JWT token required

**Query Parameters:**
- `period` (optional): Time period for statistics (default: "all", options: "week", "month", "year")
- `topicId` (optional): Filter statistics for a specific topic

**Response:** (Status 200)
```json
{
  "studyTime": {
    "total": 1240,
    "byTopic": [
      {
        "topicId": "123",
        "topicTitle": "Machine Learning",
        "minutes": 450
      },
      {
        "topicId": "124",
        "topicTitle": "Web Development",
        "minutes": 790
      }
    ],
    "byDay": [
      {
        "date": "2023-05-01",
        "minutes": 120
      },
      {
        "date": "2023-05-02",
        "minutes": 90
      }
    ]
  },
  "quizPerformance": {
    "averageScore": 85.5,
    "totalAttempts": 12,
    "byTopic": [
      {
        "topicId": "123",
        "topicTitle": "Machine Learning",
        "averageScore": 82.3,
        "attempts": 5
      },
      {
        "topicId": "124",
        "topicTitle": "Web Development",
        "averageScore": 87.8,
        "attempts": 7
      }
    ]
  },
  "topicEngagement": [
    {
      "topicId": "123",
      "topicTitle": "Machine Learning",
      "notes": 5,
      "quizzes": 2,
      "materials": 8,
      "lastActivity": "2023-05-02T14:30:00Z"
    },
    {
      "topicId": "124",
      "topicTitle": "Web Development",
      "notes": 7,
      "quizzes": 3,
      "materials": 5,
      "lastActivity": "2023-05-03T09:15:00Z"
    }
  ]
}
```

### Log Study Session

**Endpoint:** `POST /api/statistics/study-sessions`

**Description:** Records a study session for a specific topic.

**Authentication:** JWT token required

**Request Body:**
```json
{
  "topicId": "123",
  "minutes": 45,
  "date": "2023-05-04"
}
```

**Required Fields:**
- `topicId`: Topic ID for the study session
- `minutes`: Duration of the study session in minutes

**Optional Fields:**
- `date`: Date of the study session (default: current date)

**Response:** (Status 201)
```json
{
  "id": "789",
  "topicId": "123",
  "userId": "456",
  "minutes": 45,
  "date": "2023-05-04",
  "created_at": "2023-05-04T15:30:45.000Z"
}
```

### Get Quiz Performance

**Endpoint:** `GET /api/statistics/quiz-performance`

**Description:** Retrieves detailed quiz performance statistics.

**Authentication:** JWT token required

**Query Parameters:**
- `period` (optional): Time period for statistics (default: "all", options: "week", "month", "year")
- `topicId` (optional): Filter by specific topic

**Response:** (Status 200)
```json
{
  "overall": {
    "averageScore": 85.5,
    "totalAttempts": 12,
    "highestScore": 98.0,
    "lowestScore": 65.0
  },
  "byQuiz": [
    {
      "quizId": "321",
      "quizTitle": "Introduction to Machine Learning",
      "attempts": 3,
      "averageScore": 82.3,
      "bestScore": 90.0,
      "lastAttemptDate": "2023-05-02T14:30:00Z"
    },
    {
      "quizId": "322",
      "quizTitle": "JavaScript Basics",
      "attempts": 2,
      "averageScore": 88.5,
      "bestScore": 95.0,
      "lastAttemptDate": "2023-05-03T09:15:00Z"
    }
  ],
  "byDate": [
    {
      "date": "2023-05-01",
      "attempts": 5,
      "averageScore": 78.4
    },
    {
      "date": "2023-05-02",
      "attempts": 3,
      "averageScore": 87.2
    },
    {
      "date": "2023-05-03",
      "attempts": 4,
      "averageScore": 92.5
    }
  ]
}
```

## Data Models

### Study Session

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT | Primary key |
| `user_id` | INT | User ID (foreign key) |
| `topic_id` | INT | Topic ID (foreign key) |
| `study_minutes` | INT | Duration in minutes |
| `study_date` | DATE | Date of the study session |
| `created_at` | DATETIME | Record creation timestamp |

### Quiz Attempt

Quiz attempts are recorded in the `quiz_attempts` table to track performance.

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT | Primary key |
| `quiz_id` | INT | Quiz ID (foreign key) |
| `user_id` | INT | User ID (foreign key) |
| `score` | FLOAT | Score as a percentage |
| `answers` | JSON | User's answers to questions |
| `created_at` | DATETIME | Record creation timestamp |

## Statistics Calculations

### Study Time

Study time is calculated by:
1. Summing all study session durations for the user
2. Grouping by topic, day, week, or month as requested
3. Applying date filters based on the requested period

### Quiz Performance

Quiz performance is calculated by:
1. Retrieving all quiz attempts for the user
2. Calculating average scores, best/worst scores, and attempt counts
3. Grouping by quiz, topic, or time period as requested
4. Applying date filters based on the requested period

### Topic Engagement

Topic engagement is calculated by:
1. Counting notes, quizzes, and materials created/accessed for each topic
2. Tracking the most recent activity for each topic
3. Computing engagement metrics based on frequency and recency of interactions

## Client Integration

To integrate statistics in a frontend application:

1. Fetch overall statistics on the dashboard:
   ```javascript
   async function fetchUserStatistics() {
     const response = await fetch('/api/statistics', {
       headers: {
         'Authorization': `Bearer ${userToken}`
       }
     });
     return await response.json();
   }
   ```

2. Display topic-specific statistics on topic pages:
   ```javascript
   async function fetchTopicStatistics(topicId) {
     const response = await fetch(`/api/statistics?topicId=${topicId}`, {
       headers: {
         'Authorization': `Bearer ${userToken}`
       }
     });
     return await response.json();
   }
   ```

3. Log study sessions when users interact with materials:
   ```javascript
   async function logStudySession(topicId, minutes) {
     const response = await fetch('/api/statistics/study-sessions', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${userToken}`
       },
       body: JSON.stringify({
         topicId,
         minutes
       })
     });
     return await response.json();
   }
   ```

## Visualization

The statistics data is designed to be easily visualized with libraries like Chart.js, D3.js, or similar visualization tools. Common visualizations include:

1. **Time Allocation Pie Chart**: Study time distribution across topics
2. **Progress Line Chart**: Study time or quiz scores over time
3. **Performance Bar Chart**: Quiz scores by topic
4. **Engagement Heat Map**: Activity intensity across different days

## Future Enhancements

Planned enhancements to the statistics system include:

1. **Learning Recommendations**: AI-powered recommendations based on engagement patterns
2. **Goal Setting**: User-defined study goals and progress tracking
3. **Comparative Statistics**: Anonymized comparison with peer performance
4. **Study Streak Tracking**: Gamification through daily/weekly study streaks
5. **Advanced Analytics**: Machine learning insights on optimal study patterns 