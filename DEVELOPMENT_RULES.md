# Development Rules & AI Collaboration Guide 🤖

## Core Principles

### 1. **Context is King**
- **ALWAYS** start each session by reviewing:
  - `.kiro/specs/ai-meal-planner/requirements.md` - What we're building
  - `.kiro/specs/ai-meal-planner/tasks.md` - Our roadmap and progress
  - `.kiro/specs/ai-meal-planner/personalization-vision.md` - Our north star
  - Recent commits to understand current state

### 2. **Tasks.md is Our Bible**
- Tasks are completed in the **exact order** specified
- Mark tasks as complete (`[x]`) only after testing confirms it works
- Update progress in real-time as features are built
- If a task reveals new subtasks, add them before proceeding

### 3. **Test-Driven Progress**
- **No feature is complete without testing**
- Manual testing minimum, automated tests preferred
- Document test results in commit messages
- If it doesn't work, we iterate until it does

## Development Workflow

### For Every Feature:

```markdown
1. **Review Context**
   - Check current task in tasks.md
   - Review related requirements
   - Understand acceptance criteria

2. **Plan Implementation**
   - Break down into smallest possible steps
   - Identify potential issues upfront
   - Choose simplest solution that works

3. **Build with AI**
   - Let AI generate boilerplate
   - Human reviews for business logic
   - Iterate quickly with Cursor

4. **Test Immediately**
   - Run the feature
   - Test edge cases
   - Verify it meets requirements

5. **Document & Commit**
   - Clear commit messages
   - Update tasks.md progress
   - Note any discoveries or issues

6. **Only Then Move On**
   - Task must be fully working
   - No "we'll fix it later"
   - Technical debt tracked explicitly
```

## AI Collaboration Rules

### 1. **AI Does Heavy Lifting**
- Component scaffolding
- Boilerplate code
- Test generation
- Documentation
- Bug identification

### 2. **Human Provides Direction**
- Business logic validation
- UX decisions
- Requirement interpretation
- Quality control
- Strategic thinking

### 3. **Iteration Protocol**
- If AI output isn't quite right, iterate immediately
- Don't accept "good enough" - we have time to make it great
- Use AI to refactor and improve continuously

## Code Quality Standards

### Every Feature Must:
1. **Follow existing patterns** - Consistency over cleverness
2. **Be typed properly** - No `any` types without good reason
3. **Handle errors gracefully** - User-friendly messages
4. **Be performant** - Test with realistic data
5. **Work on both platforms** - Mobile and Web parity

## Testing Requirements

### Before Marking Any Task Complete:

```bash
# Web Testing
cd MealPlannerWeb
npm run dev  # Visual testing
npm test     # Unit tests
npm run build # Build verification

# Mobile Testing
cd MealPlannerApp
npm run ios  # iOS testing
npm run android # Android testing
npm test    # Unit tests
```

### Testing Checklist:
- [ ] Feature works as described
- [ ] No console errors
- [ ] Loading states present
- [ ] Error states handled
- [ ] Mobile responsiveness
- [ ] Cross-platform consistency

## Progress Tracking

### Daily Practice:
1. **Start of Day**: Review tasks.md, pick up where we left off
2. **During Work**: Update task checkboxes in real-time
3. **End of Session**: Commit with detailed message about progress
4. **Blockers**: Document immediately in tasks.md with 🚨 emoji

### Commit Message Format:
```
feat(component): Brief description

- Implemented X feature per requirement Y
- Tested on both web and mobile
- Next: Will implement Z

Refs: #task-number
```

## Decision Making

### When Facing Choices:
1. **Simplest solution wins** - We can iterate later
2. **User experience first** - Features must delight
3. **Performance matters** - But not prematurely
4. **Reuse over rebuild** - Check if it exists first

### When Stuck:
1. Re-read the requirement
2. Check if similar pattern exists in codebase
3. Ask: "What would make the user happiest?"
4. Choose progress over perfection

## Documentation Rules

### Always Document:
- **Why** decisions were made (in comments)
- **How** complex features work (in code)
- **What** remains to be done (in tasks.md)
- **Where** to find related code (in README)

## The Prime Directive

> **Ship working features that delight families, every single day.**

If a decision supports this directive, it's probably right.

## Quick Reference Checklist

Before starting any work:
- [ ] Read tasks.md current task
- [ ] Understand requirements
- [ ] Check acceptance criteria

While working:
- [ ] Test frequently
- [ ] Commit working code
- [ ] Update progress

Before moving on:
- [ ] Feature fully works
- [ ] Tests pass
- [ ] Tasks.md updated
- [ ] Code committed

## Emergency Protocols

### If Something Breaks:
1. **Don't panic** - Git has our back
2. **Identify** - What exactly broke?
3. **Rollback** - `git revert` if needed
4. **Fix Forward** - Small fixes preferred
5. **Document** - What happened and why

### If Requirements Unclear:
1. **Check vision doc** - Does it align with our north star?
2. **Pick interpretation** - That best serves families
3. **Document decision** - In commit message
4. **Move forward** - We can adjust later

## Remember

We're building something that will genuinely help families. Every line of code should serve that mission. With AI as our copilot, we can build faster and better than ever before.

**Let's ship it! 🚀** 