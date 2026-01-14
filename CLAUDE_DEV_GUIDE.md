# Claude AI Development Assistant Guide

## Purpose
This file helps Claude understand the project structure and provide better assistance during development.

## Project Context

### What This Project Does
A German language learning application that:
1. Integrates YouTube videos for authentic German content
2. Uses Claude AI to generate personalized lessons
3. Implements spaced repetition for effective memorization
4. Tracks user progress and adapts difficulty

### Technology Decisions

**Why React + TypeScript?**
- Strong typing prevents bugs
- Component reusability
- Large ecosystem and community support

**Why Vite?**
- Fast hot module replacement
- Modern build tool
- Better developer experience than Create React App

**Why Tailwind CSS?**
- Utility-first approach speeds up development
- Consistent design system
- Smaller bundle size than traditional CSS frameworks

**Why LocalStorage?**
- No backend required for MVP
- Instant data access
- Works offline

### Key Design Patterns

#### Component Structure
```typescript
// Always use functional components with TypeScript
interface ComponentProps {
  prop1: string;
  prop2?: number; // Optional props marked with ?
}

export const Component: React.FC<ComponentProps> = ({ prop1, prop2 = 0 }) => {
  // Hooks at the top
  const [state, setState] = useState<Type>(initial);
  
  // Event handlers
  const handleEvent = () => {
    // logic
  };
  
  // Effects
  useEffect(() => {
    // side effects
  }, [dependencies]);
  
  // Render
  return <div>...</div>;
};
```

#### State Management
- Local state: `useState` for component-specific data
- Shared state: Lift state up to common parent
- Persistent state: LocalStorage for user data

#### API Integration
```typescript
// All API calls in services/ directory
// Always handle errors
try {
  const result = await apiCall();
  // handle success
} catch (error) {
  console.error('API Error:', error);
  // handle error gracefully
}
```

### Common Development Scenarios

#### Scenario: Adding a New Lesson Type
1. Update `types.ts` with new lesson type
2. Update `lessons.json` with example data
3. Create/modify component to handle new type
4. Update lesson generation in services
5. Test with various inputs

#### Scenario: Modifying Spaced Repetition Algorithm
1. Review `SPACED_REPETITION_GUIDE.md`
2. Modify algorithm in `SpacedRepetition.tsx`
3. Test edge cases (new user, perfect score, failure)
4. Update documentation if logic changes

#### Scenario: Adding New UI Component
1. Create component file in `/components/`
2. Define TypeScript interface for props
3. Implement component with Tailwind styling
4. Export from component directory
5. Import and use in parent component

### File Organization Logic

```
/
├── components/          # Reusable UI components
│   ├── VideoPlayer.tsx  # YouTube integration
│   ├── LessonDisplay.tsx # Main lesson UI
│   └── ...
├── services/            # API calls and business logic
│   ├── claudeApi.ts     # Claude AI integration
│   ├── youtubeApi.ts    # YouTube API calls
│   └── storage.ts       # LocalStorage utilities
├── types.ts             # All TypeScript types/interfaces
├── constants.ts         # App-wide constants
├── App.tsx              # Root component
└── index.tsx            # Entry point
```

### Critical Information

#### Environment Variables
Must be set in `.env`:
- `VITE_CLAUDE_API_KEY` - For lesson generation
- `VITE_YOUTUBE_API_KEY` - For video search/embedding

#### Data Persistence
- User progress: LocalStorage key `deutsch-tutor-progress`
- Lesson history: LocalStorage key `deutsch-tutor-history`
- Settings: LocalStorage key `deutsch-tutor-settings`

#### Performance Considerations
- YouTube videos lazy load
- Lessons generated on-demand
- Progress calculated incrementally
- Large lists virtualized if needed

### Common Issues & Solutions

**Issue: API key not working**
- Check `.env` file exists in root
- Ensure keys start with `VITE_` prefix
- Restart dev server after changing `.env`

**Issue: TypeScript errors**
- Run `npx tsc --noEmit` to see all errors
- Check `types.ts` for missing/incorrect types
- Ensure imports are correct

**Issue: Tailwind classes not working**
- Check `tailwind.config.js` content paths
- Ensure class names are complete (no dynamic strings)
- Restart dev server if config changed

**Issue: Component not re-rendering**
- Check if state is being mutated directly
- Ensure dependencies in useEffect are correct
- Verify props are actually changing

### Best Practices for This Project

1. **Type Everything**: No `any` types unless absolutely necessary
2. **Component Size**: Keep components under 200 lines
3. **Reusability**: Extract common patterns into custom hooks
4. **Error Handling**: Always handle API failures gracefully
5. **User Feedback**: Show loading states and error messages
6. **Accessibility**: Use semantic HTML and ARIA labels
7. **Mobile First**: Design for mobile, enhance for desktop
8. **Comments**: Explain "why", not "what"

### When Asking Claude for Help

**Good Questions:**
- "How can I add a feature to track daily streak?"
- "The spaced repetition isn't scheduling correctly, here's the code..."
- "I'm getting TypeScript error X, here's the component..."

**Include Context:**
- Which file you're working on
- What you're trying to accomplish
- What you've already tried
- Any error messages

**Less Helpful:**
- "Fix my code" (too vague)
- "Make it better" (no specific goal)
- "It doesn't work" (no details)

### Development Philosophy

This project prioritizes:
1. **User Learning** - Features that improve learning outcomes
2. **Simplicity** - Clean, maintainable code over clever solutions
3. **Performance** - Fast, responsive user experience
4. **Accessibility** - Usable by everyone
5. **Maintainability** - Easy for others to understand and modify

### Future Considerations

Potential expansions:
- Backend API for multi-device sync
- Social features (study groups, leaderboards)
- Additional languages beyond German
- Audio recording for pronunciation practice
- Integration with other learning resources

Keep these in mind when making architectural decisions.

---

**Remember**: This project is a learning tool. Code quality matters because it sets an example for learners who might examine the codebase.
