# Habit Tracker + Social Journey + AI Nutrition

## 1. Product Goal
Build a web app where users can:
- Track habits daily, weekly, and monthly
- Share progress as posts/reels (Instagram-style community)
- Write journey stories: what helped, what blocked them, how they overcame problems
- Upload meal photos and get AI calorie/macronutrient estimation

The design reference you shared is used as the dashboard inspiration, but the product is expanded into a complete user-facing platform.

---

## 2. User Roles
1. Guest
- Can view landing page, public community posts, and app marketing pages
- Must sign up to track habits, upload media, and use AI nutrition

2. Member (Primary User)
- Full habit tracking and social features
- Can create posts/reels/journeys
- Can use meal image AI analysis

3. Coach (Optional)
- Can create challenge groups, comment on user journals, and monitor team progress

4. Admin
- Moderation, reports, abuse handling, content management, analytics

---

## 3. Global Navigation
## Main Header / Mobile Tab Nav
- Dashboard
- Habits
- Community
- Challenges
- Nutrition AI
- Calendar
- Profile

## Secondary Utilities
- Notifications
- Search
- Quick Add (+) for habit check-in / post / reel / meal upload
- Chat assistant entry point

---

## 4. Full Screen List (All Possible Screens)

## A. Public / Onboarding
1. Landing Page
- Value proposition, social proof, app walkthrough, CTA to sign up

2. Pricing Page (if premium)
- Free vs Pro features, billing cycle, FAQ

3. Auth - Sign Up
- Email/phone/social auth, profile basics

4. Auth - Sign In
- Login form + forgot password

5. Forgot Password / Reset
- Password recovery flow

6. Onboarding Wizard - Goal Setup
- Select focus areas: fitness, reading, meditation, hydration, etc.

7. Onboarding Wizard - Habit Template Selection
- User chooses templates or custom habits

8. Onboarding Wizard - Schedule + Reminder Setup
- Daily time, days of week, notification channel

9. Onboarding Wizard - Baseline Assessment
- Current routine, confidence level, expected barriers

10. Onboarding Completion / First Action
- Encourages first check-in and first community post

## B. Core Habit Tracking
11. Dashboard Home (Inspired by your attached image)
- Daily progress graph
- Overall completion ring
- Weekly overview bars
- Top habits leaderboard
- Habit matrix for current month

12. Habit List View
- All habits with status (done/missed/skipped)

13. Habit Create Screen
- Name, category, frequency, goal count, reminders

14. Habit Edit Screen
- Modify target, schedule, labels, archive state

15. Habit Detail - Daily Timeline
- Per-day completion, notes, mood, streaks

16. Habit Detail - Weekly Analytics
- Week trends, completion %, consistency score

17. Habit Detail - Monthly Analytics
- Calendar heatmap, regression, forecast

18. Daily Check-In Modal
- One-tap completion + note + photo + mood emoji

19. Weekly Review Screen
- Wins, misses, reflection prompts, next week goals

20. Monthly Review Screen
- Month summary, strongest habit, weakest habit, adjustments

21. Habit Categories Management
- Add/edit categories and color tags

22. Habit Reminder Settings
- Push/email/SMS timing and smart reminder logic

23. Streak Recovery Screen
- Restore streak via grace token (optional gamification)

24. Habit Archive / Deleted Habits
- Restore archived habits

## C. Calendar & Planning
25. Calendar Month View
- Habit check marks and completion density

26. Calendar Week View
- Detailed timeline for routines

27. Plan Day Screen
- Plan tasks/habits by day with drag and drop ordering

28. Plan Week Screen
- Weekly intention planning and slot allocation

29. Goal Roadmap Screen
- Long-term goals broken into habits and milestones

## D. Social Community (Instagram-style)
30. Community Feed
- Mixed content feed (posts, reels, achievements)

31. Create Post Screen
- Image/video upload, caption, tags, habit references

32. Create Reel Screen
- Short vertical video upload, cover frame, audio metadata

33. Post Detail Screen
- Full post, likes, comments, saves, shares

34. Reel Viewer Screen
- Vertical swipe reels, engagement actions

35. Story-Like Daily Updates (Optional)
- 24h progress snippets

36. Journey Log Screen
- Long-form diary entry: challenge, blocker, solution, lesson

37. Journey Detail Screen
- Read complete journey timeline from a user

38. Community Search Screen
- Search by hashtag, user, habit, challenge, keyword

39. User Public Profile Screen
- Bio, habit highlights, posts/reels, streak badges

40. Saved Content Screen
- Saved posts, routines, nutrition tips

41. Notifications Feed
- Likes/comments/follows/challenge invites

42. Direct Messages (Optional)
- 1:1 messaging for accountability partners

43. Report Content Screen
- Report abusive content or misinformation

## E. Challenges & Groups
44. Challenge Discovery Screen
- Join public challenges (30-day run, no sugar, etc.)

45. Challenge Detail Screen
- Rules, leaderboard, participant updates

46. Challenge Join / Invite Screen
- Invite friends or join team-based challenge

47. Group Dashboard
- Private accountability group progress

48. Leaderboard Screen
- Daily/weekly/monthly ranking by consistency

49. Rewards / Badge Cabinet
- Earned badges, levels, and milestones

## F. AI Nutrition Module
50. Nutrition AI Home
- Entry point for meal analysis and nutrition history

51. Upload Meal Screen
- Upload breakfast/lunch/dinner image

52. AI Analysis Result Screen
- Estimated calories, protein, carbs, fat, confidence score

53. Ingredient Correction Screen
- User edits detected ingredients for better estimate

54. Meal Log History Screen
- Previous meal analyses, daily calorie totals

55. Daily Nutrition Summary Screen
- Intake vs target with chart and suggestions

56. Weekly Nutrition Report Screen
- Average calories/macros and behavior pattern

57. AI Chat Nutrition Coach
- Ask diet questions and receive personalized suggestions

58. Nutrition Goal Settings
- Weight goal, calorie target, macro ratio preferences

59. Nutrition Warnings / Allergy Preferences
- Excluded ingredients and safety flags

## G. Personalization & Settings
60. Profile Edit Screen
- Avatar, bio, timezone, preferences

61. Account Settings
- Email, password, connected accounts

62. Privacy Settings
- Public/private profile, who can comment/message

63. Notification Preferences
- Habit reminders + social notifications control

64. Theme / Appearance Settings
- Theme color, compact mode, accessibility options

65. Data Export Screen
- Export habit and nutrition history

66. Connected Apps Screen
- Sync with Apple Health / Google Fit / wearables

67. Subscription / Billing Screen
- Plan details, invoices, upgrade/downgrade

68. Help Center
- FAQ and support links

69. Contact Support
- Submit issue ticket with screenshot

## H. Trust, Safety, and System
70. Empty State Screen Set
- No habits yet, no posts yet, no analysis yet

71. Error State Screen Set
- API failures, upload errors, offline mode

72. Offline Sync Screen
- Queue pending actions until connectivity returns

73. Loading Skeleton Set
- For feed, dashboard cards, and charts

74. Maintenance / Force Update Screen
- Required update and downtime messaging

75. 404 / Not Found
- Friendly recovery navigation

---

## 5. MVP Screen Scope (Build First)
Phase 1 should cover:
1. Landing Page
2. Sign Up / Sign In
3. Dashboard Home
4. Habit Create / List / Check-In
5. Calendar Month View
6. Community Feed + Create Post
7. Journey Log Create + Detail
8. Nutrition AI Upload + Result (mock API first)
9. Profile + Settings basic

---

## 6. Recommended Frontend Route Map
- /
- /auth/sign-up
- /auth/sign-in
- /dashboard
- /habits
- /habits/new
- /habits/:habitId
- /calendar
- /community
- /community/new-post
- /community/reels
- /journeys/new
- /journeys/:journeyId
- /nutrition
- /nutrition/upload
- /nutrition/result/:analysisId
- /profile/:username
- /settings

---

## 7. Key Components To Reuse Across Screens
- App shell (header, sidebar, mobile nav)
- Statistic cards
- Progress ring component
- Streak badge component
- Habit calendar grid
- Media uploader (image/video)
- Post/reel cards
- Comment composer
- AI analysis card
- Empty/error/loading states

---

## 8. Data Objects (Frontend View Models)
- User
- Habit
- HabitCheckin
- WeeklySummary
- MonthlySummary
- Post
- Reel
- JourneyEntry
- NutritionAnalysis
- MealLog
- Challenge
- Notification

---

## 9. API Integration Plan
1. Start with mock JSON service (frontend development speed)
2. Integrate backend auth + habits endpoints
3. Integrate social media upload endpoints
4. Integrate LLM nutrition endpoint:
- Image upload -> vision model analysis -> structured calorie result
5. Add retry, confidence level, and user correction pipeline

---

## 10. Non-Functional Requirements
- Mobile-first responsive design
- Accessibility (keyboard + screen reader)
- Performance (lazy routes + optimized images/videos)
- Privacy and secure media uploads
- Moderation and abuse reporting workflow

---

## 11. Screen Build Order (Implementation Sequence)
1. App Shell + Navigation
2. Dashboard Screen (matching your reference style)
3. Habits List + Habit Matrix Screen
4. Community Feed Screen
5. Create Post / Reel Screen
6. Journey Log Screens
7. Nutrition AI Upload + Result Screen
8. Profile + Settings
9. Authentication screens
10. Edge states and polish

---

## 12. Definition of Done for Every Screen
- Responsive desktop + mobile
- Empty, loading, and error state present
- CTA buttons wired to next route
- Reusable components extracted where applicable
- Matches visual direction and product brand

---

This file is the single source of truth for all screens. Next step is implementing the frontend screens one by one, beginning with app shell and dashboard.
