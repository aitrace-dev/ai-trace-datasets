## File: LICENSE

```
MIT License

Copyright (c) 2025 Bluggie SG PTE LTD

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## File: LICENSE-EE

```
AITRACE DATASETS ENTERPRISE LICENSE

Copyright (c) 2025 Bluggie SG PTE LTD. All rights reserved.

The code and content in the "ee/" directories of this repository (the 
"Enterprise Features") are proprietary and confidential.

RESTRICTIONS

You may NOT, without a valid commercial license from Bluggie SG PTE LTD:

1. Use the Enterprise Features in production
2. Copy, modify, or distribute the Enterprise Features
3. Create derivative works based on the Enterprise Features
4. Remove or alter any proprietary notices

OBTAINING A LICENSE

Enterprise licenses will be available soon. Please check back later or 
contact us for more information.

THE ENTERPRISE FEATURES ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
IN NO EVENT SHALL BLUGGIE SG PTE LTD BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY ARISING FROM THE USE OF THE ENTERPRISE FEATURES.
```

---

## File: LICENSING.md

```markdown
# Licensing

AITrace Datasets is open source software with some Enterprise features.

## Open Source (MIT)

The majority of this codebase is licensed under the [MIT License](LICENSE). 
You are free to use, modify, and distribute this code for any purpose.

This includes:

- Core authentication & user management
- Dataset creation & management
- Schema builder
- Row management & review queue
- CSV import/export
- All UI components (outside of `ee/` folders)

## Enterprise Edition (Proprietary)

Code inside `ee/` directories is proprietary and requires a commercial license 
from Bluggie SG PTE LTD.

Enterprise features include:

- Multi-team support
- Invite links with quotas
- Billing & subscription management
- Advanced AI features
- Email verification
- Priority support

### Folder Structure

Example

```
src/
├── auth/           # MIT - Open Source
├── users/          # MIT - Open Source
├── teams/          # MIT - Open Source
├── datasets/       # MIT - Open Source
├── schemas/        # MIT - Open Source
├── rows/           # MIT - Open Source
└── ee/             # Proprietary - Enterprise License Required
    ├── multi-team/
    ├── invites/
    ├── billing/
    └── ai-features/
```

### How to Identify

- **Open Source:** All code outside of `ee/` folders
- **Enterprise:** Any code inside `ee/` folders

## Obtaining an Enterprise License

Enterprise licenses will be available soon.

## Contributing

We welcome contributions to the open source parts of AITrace Datasets!

### Contribution Terms

- **Core code (outside `ee/`):** Contributions are licensed under MIT
- **Enterprise code (inside `ee/`):** Contributions are accepted, but all rights 
  are assigned to Bluggie SG PTE LTD

By submitting a pull request, you agree to these terms.

## Questions?

For licensing questions, please open an issue on GitHub.
```

---

## File: CONTRIBUTING.md (Bonus)

```markdown
# Contributing to AITrace Datasets

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests
5. Submit a pull request

## Contribution Guidelines

### Code Style

- Follow existing code patterns
- Write clear commit messages
- Add tests for new features

### Pull Requests

- Keep PRs focused on a single feature or fix
- Update documentation if needed
- Ensure all tests pass

## Licensing of Contributions

This project has a dual license structure. By contributing, you agree to the 
following:

### Open Source Code (outside `ee/` folders)

Your contributions are licensed under the MIT License, the same as the project.

### Enterprise Code (inside `ee/` folders)

If you contribute to code inside `ee/` directories, you agree to assign all 
rights to Bluggie SG PTE LTD. This allows us to include your contributions in 
our commercial Enterprise offering.
