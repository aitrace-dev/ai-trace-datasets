# Contributing to AITrace Datasets

Thank you for your interest in contributing to AITrace Datasets!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/aitrace-datasets.git`
3. Create a feature branch: `git checkout -b feature/my-feature`
4. Make your changes
5. Run tests: `uv run pytest`
6. Commit your changes: `git commit -m "Add my feature"`
7. Push to your fork: `git push origin feature/my-feature`
8. Open a Pull Request

## Development Setup

See [README.md](README.md#local-development) for detailed setup instructions.

## Code Style

### Backend (Python)

- Follow PEP 8
- Use Black for formatting: `uv run black src/ tests/`
- Use isort for imports: `uv run isort src/ tests/`
- Type hints required everywhere: `uv run mypy src/`
- Write docstrings for functions and classes
- Maximum line length: 100 characters

### Frontend (Vue/TypeScript)

- Follow Vue 3 Composition API patterns
- Use TypeScript for type safety
- Use Prettier for formatting
- Follow Airbnb style guide
- Write clear component names (PascalCase for components)

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Backend: `uv run pytest`
- Frontend: `npm test` (in frontend directory)
- Aim for >80% code coverage

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated if needed
- [ ] Commit messages are clear and descriptive

### PR Description

Include:
- What changes were made
- Why these changes were necessary
- Any breaking changes
- Screenshots (for UI changes)

## Commit Messages

Use clear, descriptive commit messages:

**Good:**
```
Add CSV export functionality for datasets

- Implement export endpoint in DatasetService
- Add export button to dataset detail page
- Handle large datasets with streaming
```

**Bad:**
```
fix stuff
update files
wip
```

## Licensing of Contributions

This project is fully open source under the MIT License. By submitting a pull request, you agree to license your contributions under the MIT License.

## What to Contribute

### Good First Issues

Look for issues labeled `good first issue` - these are great for new contributors!

### Areas We Need Help

- Documentation improvements
- Bug fixes
- Test coverage
- Performance optimizations
- UI/UX improvements
- Example datasets and schemas

### What Not to Submit

- Changes to licensing or copyright
- Breaking changes without prior discussion
- Large refactors without prior discussion
- Code that violates our Code of Conduct

## Code Review Process

1. Maintainers will review your PR within 5 business days
2. Feedback will be provided as comments
3. Make requested changes and push updates
4. Once approved, maintainers will merge

## Community Guidelines

- Be respectful and inclusive
- Welcome newcomers
- Give constructive feedback
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)

## Questions?

- Open a GitHub Discussion
- Join our community chat (coming soon)
- Email: support@bluggie.com (coming soon)

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Annual contributor spotlight

Thank you for contributing to AITrace Datasets! 🎉
