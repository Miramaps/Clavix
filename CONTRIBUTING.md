# Contributing to ClawdSales Norway

Thank you for considering contributing to ClawdSales Norway! This document provides guidelines for contributing to the project.

## 🤝 How to Contribute

### Reporting Bugs

Before creating a bug report:
- Check existing issues to avoid duplicates
- Collect information about the bug (error messages, screenshots, environment)

When reporting bugs, include:
- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, browser)
- Relevant logs or screenshots

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When suggesting:
- Use a clear, descriptive title
- Provide detailed description of suggested enhancement
- Explain why this would be useful
- Include mockups or examples if applicable

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Follow coding standards**:
   - TypeScript strict mode
   - No `any` types (use `unknown` or proper types)
   - Descriptive variable names
   - Add comments for complex logic
3. **Write tests** for new features
4. **Update documentation** if needed
5. **Test thoroughly**:
   ```bash
   npm run type-check
   npm test
   npm run build
   ```
6. **Commit with clear messages**:
   ```
   feat: add export to JSON feature
   fix: resolve scoring calculation bug
   docs: update API documentation
   ```
7. **Submit PR** with:
   - Clear description of changes
   - Reference to related issue
   - Screenshots (if UI changes)

## 📝 Coding Standards

### TypeScript

```typescript
// ✅ Good
interface Company {
  id: string;
  name: string;
}

function processCompany(company: Company): void {
  // Implementation
}

// ❌ Bad
function processCompany(company: any) {
  // Implementation
}
```

### React Components

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// ❌ Bad
export function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### Error Handling

```typescript
// ✅ Good
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('Failed to process data');
}

// ❌ Bad
try {
  await riskyOperation();
} catch (error) {
  // Silent failure
}
```

## 🧪 Testing

- Write unit tests for business logic (scoring, mapping, etc.)
- Test edge cases and error conditions
- Aim for >70% coverage on critical paths
- Use descriptive test names

```typescript
describe('Lead Scoring Engine', () => {
  it('should score active companies higher than inactive', () => {
    // Test implementation
  });
});
```

## 📚 Documentation

- Update README.md for major features
- Add JSDoc comments for complex functions
- Document API changes
- Include examples where helpful

## 🎨 UI/UX Guidelines

- Follow minimalist Scandinavian design principles
- Maintain consistent spacing and typography
- Ensure accessibility (ARIA labels, keyboard navigation)
- Test in both light and dark modes
- Mobile-responsive design

## 🔍 Code Review Process

1. Automated checks must pass (TypeScript, tests)
2. At least one reviewer approval required
3. Address all review comments
4. Squash commits before merge

## 📦 Release Process

1. Version bump in package.json (semantic versioning)
2. Update CHANGELOG.md
3. Tag release with version
4. Deploy to staging for testing
5. Deploy to production

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project acknowledgments

## 📧 Questions?

Feel free to open an issue or contact the maintainers.

---

Thank you for contributing! 🎉
